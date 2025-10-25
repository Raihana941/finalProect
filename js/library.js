// storage backup json
export function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
export function load(key, defaultValue) {
  try {
    return JSON.parse(localStorage.getItem(key)) || defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

// switching by adding and removing classes
function showSection(id) {
  document
    .querySelectorAll("section")
    .forEach((s) => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}

document
  .getElementById("nav-library")
  .addEventListener("click", () => showSection("library"));
document
  .getElementById("nav-author")
  .addEventListener("click", () => showSection("author"));
document
  .getElementById("nav-learn")
  .addEventListener("click", () => showSection("learn"));

// making up library
const capsuleListEl = document.getElementById("capsule-list");
function renderLibrary() {
  const capsules = load("pc_capsules_index", []);
  capsuleListEl.innerHTML = capsules
    .map(
      (c) => `
        <div class="col-md-4 capsule-card"
            data-title="${c.title.toLowerCase()}"
            data-subject="${c.subject.toLowerCase()}"
            data-level="${c.level.toLowerCase()}">
          <div class="card mb-3">
            <div class="card-body">
              <h5 class="card-title">${c.title}</h5>
              <p class="card-subject">Subject: ${c.subject}</p>
              <p class="card-level">Level: ${c.level}</p>
              <button class="btn btn-primary btn-sm learn-btn" data-id="${
                c.id
              }">Learn</button>
              <button class="btn btn-secondary btn-sm edit-btn" data-id="${
                c.id
              }">Edit</button>
              <button class="btn btn-danger btn-sm delete-btn" data-id="${
                c.id
              }">Delete</button>
            </div>
          </div>
        </div>
        `
    )
    .join("");

  // learn edit and delete buttons functionality
  capsuleListEl.addEventListener("click", (e) => {
    const id = e.target.dataset.id;
    if (e.target.classList.contains("learn-btn")) {
      loadLearnCapsule(id);
      showSection("learn");
    } else if (e.target.classList.contains("edit-btn")) {
      editCapsule(id);
      showSection("author");
    } else if (e.target.classList.contains("delete-btn")) {
      let capsules = load("pc_capsules_index", []);
      capsules = capsules.filter((c) => c.id != id);
      save("pc_capsules_index", capsules);
      renderLibrary();
    }
  });
}

// making author capsule functionality
const authorForm = document.getElementById("author-form");
const flashcardsContainer = document.getElementById("flashcards-container");
document
  .getElementById("add-flashcard")
  .addEventListener("click", addFlashcard);

function addFlashcard(front = "", back = "") {
  const div = document.createElement("div");
  div.className = "d-flex gap-2 mb-1 flashcard-row";
  div.innerHTML = `
    <input type="text" class="form-control form-control-sm flash-front-input" placeholder="Front" value="${front}">
    <input type="text" class="form-control form-control-sm flash-back-input" placeholder="Back" value="${back}">
    <button type="button" class="btn btn-sm btn-danger remove-flash">X</button>
  `;
  div
    .querySelector(".remove-flash")
    .addEventListener("click", () => div.remove());
  flashcardsContainer.appendChild(div);
}

// cancle button functionality for author part
document
  .getElementById("cancel-author")
  .addEventListener("click", () => showSection("library"));

// editing capsule
function editCapsule(id) {
  const capsules = load("pc_capsules_index", []);
  const cap = capsules.find((c) => c.id == id);
  if (!cap) return;

  // filling the form with data taken form capsule
  document.getElementById("editing-id").value = cap.id;
  document.getElementById("capsule-title").value = cap.title;
  document.getElementById("capsule-subject").value = cap.subject;
  document.getElementById("capsule-level").value = cap.level;
  document.getElementById("capsule-notes").value = cap.notes.join("\n");

  // filling flashcars
  flashcardsContainer.innerHTML = "";
  cap.flashcards.forEach((f) => addFlashcard(f.front, f.back));
}

// saving capsule btn
authorForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const id = document.getElementById("editing-id").value || Date.now();
  const title = document.getElementById("capsule-title").value;
  const subject = document.getElementById("capsule-subject").value;
  const level = document.getElementById("capsule-level").value;
  const notes = document
    .getElementById("capsule-notes")
    .value.split("\n")
    .filter((n) => n.trim());
  const flashcards = [
    ...flashcardsContainer.querySelectorAll(".flashcard-row"),
  ].map((row) => ({
    front: row.querySelector(".flash-front-input").value,
    back: row.querySelector(".flash-back-input").value,
  }));

  let capsules = load("pc_capsules_index", []);
  const existingIndex = capsules.findIndex((c) => c.id == id);
  const capsule = { id, title, subject, level, notes, flashcards };
  if (existingIndex >= 0) capsules[existingIndex] = capsule;
  else capsules.push(capsule);
  save("pc_capsules_index", capsules);
  authorForm.reset();
  flashcardsContainer.innerHTML = "";
  renderLibrary();
  showSection("library");
});

// making a new capsule btn
document.getElementById("new-capsule").addEventListener("click", () => {
  document.getElementById("editing-id").value = "";
  authorForm.reset();
  flashcardsContainer.innerHTML = "";
  showSection("author");
});

// learning paart
const learnSelect = document.getElementById("learn-capsule-select");
const notesList = document.getElementById("notes-list");
const notesSearch = document.getElementById("notes-search");
const flashFront = document.getElementById("flash-front");
const flashBack = document.getElementById("flash-back");
let currentFlashIndex = 0;
let currentFlashcards = [];

function loadLearnCapsule(id) {
  const capsules = load("pc_capsules_index", []);
  const cap = capsules.find((c) => c.id == id);
  if (!cap) return;
  // populating the select
  learnSelect.innerHTML = `<option value="${cap.id}">${cap.title}</option>`;
  // notes part
  notesList.innerHTML = cap.notes.map((n) => `<li>${n}</li>`).join("");
  notesSearch.value = "";
  notesSearch.oninput = () => {
    const val = notesSearch.value.toLowerCase();
    notesList.innerHTML = cap.notes
      .filter((n) => n.toLowerCase().includes(val))
      .map((n) => `<li>${n}</li>`)
      .join("");
  };
  // the flashcardds
  currentFlashcards = cap.flashcards;
  currentFlashIndex = 0;
  renderFlashcard();
}
//function for rendering flashcards
function renderFlashcard() {
  if (currentFlashcards.length === 0) {
    flashFront.textContent = "No flashcards";
    flashBack.textContent = "";
    updateProgress();
    return;
  }
  const card = currentFlashcards[currentFlashIndex];
  flashFront.textContent = card.front;
  flashBack.textContent = card.back;
  updateProgress();
}
function updateProgress() {
  if (currentFlashcards.length === 0) {
    document.getElementById("flash-progress").textContent = "";
    return;
  }
  document.getElementById("flash-progress").textContent = `Card ${
    currentFlashIndex + 1
  } of ${currentFlashcards.length}`;
}

document.getElementById("next-flash").addEventListener("click", () => {
  if (currentFlashcards.length === 0) return;
  currentFlashIndex = (currentFlashIndex + 1) % currentFlashcards.length;
  renderFlashcard();
});
document.getElementById("prev-flash").addEventListener("click", () => {
  if (currentFlashcards.length === 0) return;
  currentFlashIndex =
    (currentFlashIndex - 1 + currentFlashcards.length) %
    currentFlashcards.length;
  renderFlashcard();
});
// event listner for shuffeling fllshcards
document.getElementById("shuffle-flash").addEventListener("click", () => {
  if (currentFlashcards.length === 0) return;
  currentFlashcards.sort(() => Math.random() - 0.5);
  currentFlashIndex = 0;
  renderFlashcard();
});

// restart flashcards
document.getElementById("restart-flash").addEventListener("click", () => {
  currentFlashIndex = 0;
  renderFlashcard();
});

// flip flashcards btn
document.getElementById("flip-flash").addEventListener("click", () => {
  document.getElementById("flashcard-container").classList.toggle("flipped");
});

// back to library btn in Learn mode
document.getElementById("back-to-library").addEventListener("click", () => {
  showSection("library");
});

// switching between notes and flashcards tabs
document.querySelectorAll("#learn-tabs button").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const tab = e.target.dataset.tab;
    document
      .querySelectorAll("#learn-tabs button")
      .forEach((b) => b.classList.remove("active"));
    e.target.classList.add("active");

    document.getElementById("notes-area").style.display =
      tab === "notes" ? "block" : "none";
    document.getElementById("flashcards-area").style.display =
      tab === "flashcards" ? "block" : "none";
  });
});

// press spacebar to flip flashcard
document.addEventListener("keydown", (e) => {
  if (
    e.code === "Space" &&
    document.getElementById("learn").classList.contains("active")
  ) {
    e.preventDefault();
    document.getElementById("flashcard-panel").classList.toggle("flipped");
  }
});

// initial render
renderLibrary();
// capsule search
const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", () => {
  const query = searchInput.value.toLowerCase();
  const capsules = document.querySelectorAll(".capsule-card");

  capsules.forEach((capsule) => {
    const title = capsule.dataset.title || "";
    const subject = capsule.dataset.subject || "";
    const level = capsule.dataset.level || "";

    if (
      title.includes(query) ||
      subject.includes(query) ||
      level.includes(query)
    ) {
      capsule.style.display = "block";
    } else {
      capsule.style.display = "none";
    }
  });
});

// Exporting and Iporting Capsules

// Exporting the data made to JSON
document.getElementById("export-btn").addEventListener("click", () => {
  const capsules = load("pc_capsules_index", []);
  const blob = new Blob([JSON.stringify(capsules, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "pocket_classroom_backup.json";
  a.click();
  URL.revokeObjectURL(url);
});

// trigger hidden file input when clicking import
document.getElementById("import-btn").addEventListener("click", () => {
  document.getElementById("import-file").click();
});

// handleing file import
document.getElementById("import-file").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      if (!Array.isArray(imported)) throw new Error("Invalid file format");

      // merging with existing capsules
      let existing = load("pc_capsules_index", []);
      const ids = new Set(existing.map((c) => c.id));
      const merged = [...existing, ...imported.filter((c) => !ids.has(c.id))];
      save("pc_capsules_index", merged);
      renderLibrary();
      alert("✅ Capsules imported successfully!");
    } catch (err) {
      alert("❌ Invalid or corrupted file.");
    }
  };
  reader.readAsText(file);
});
