const API_BASE = window.location.protocol === "file:" ? "" : window.location.origin;
const STORAGE_KEY = "simple-notepad-notes";

const noteList = document.querySelector("#noteList");
const searchInput = document.querySelector("#searchInput");
const titleInput = document.querySelector("#titleInput");
const contentInput = document.querySelector("#contentInput");
const statusEl = document.querySelector("#status");
const updatedAtEl = document.querySelector("#updatedAt");
const countInfo = document.querySelector("#countInfo");
const newButton = document.querySelector("#newButton");
const saveButton = document.querySelector("#saveButton");
const deleteButton = document.querySelector("#deleteButton");

let notes = [];
let activeId = null;

const noteApi = {
  async list() {
    if (API_BASE) {
      const response = await fetch(`${API_BASE}/notes`);
      if (!response.ok) {
        throw new Error("Failed to load notes");
      }
      return response.json();
    }

    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  },
  async save(note) {
    if (API_BASE) {
      const method = note.createdAt === note.updatedAt ? "POST" : "PUT";
      const url = method === "POST" ? `${API_BASE}/notes` : `${API_BASE}/notes/${note.id}`;
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(note),
      });
      if (!response.ok) {
        throw new Error("Failed to save note");
      }
      return response.json();
    }

    const nextNotes = notes.filter((item) => item.id !== note.id);
    nextNotes.unshift(note);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
    return note;
  },
  async remove(id) {
    if (API_BASE) {
      const response = await fetch(`${API_BASE}/notes/${id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Failed to delete note");
      }
      return;
    }

    const nextNotes = notes.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextNotes));
  },
};

function createId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `note-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatDate(value) {
  if (!value) {
    return "아직 저장되지 않음";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function setStatus(message) {
  statusEl.textContent = message;
  window.clearTimeout(setStatus.timer);
  setStatus.timer = window.setTimeout(() => {
    statusEl.textContent = "준비됨";
  }, 1600);
}

function getActiveNote() {
  return notes.find((note) => note.id === activeId);
}

function renderList() {
  const keyword = searchInput.value.trim().toLowerCase();
  const filteredNotes = notes.filter((note) => {
    return `${note.title} ${note.content}`.toLowerCase().includes(keyword);
  });

  noteList.innerHTML = "";

  if (filteredNotes.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = keyword ? "검색 결과가 없습니다." : "아직 저장된 메모가 없습니다.";
    noteList.append(empty);
    return;
  }

  filteredNotes.forEach((note) => {
    const item = document.createElement("li");
    const button = document.createElement("button");
    button.className = `note-item${note.id === activeId ? " active" : ""}`;
    button.type = "button";
    button.addEventListener("click", () => selectNote(note.id));

    const name = document.createElement("span");
    name.className = "note-name";
    name.textContent = note.title || "제목 없음";

    const preview = document.createElement("span");
    preview.className = "note-preview";
    preview.textContent = note.content || "내용 없음";

    button.append(name, preview);
    item.append(button);
    noteList.append(item);
  });
}

function renderEditor() {
  const activeNote = getActiveNote();
  titleInput.value = activeNote?.title || "";
  contentInput.value = activeNote?.content || "";
  updatedAtEl.textContent = activeNote ? `마지막 저장: ${formatDate(activeNote.updatedAt)}` : "아직 저장되지 않음";
  countInfo.textContent = `${contentInput.value.length}자`;
  deleteButton.disabled = !activeNote;
}

function selectNote(id) {
  activeId = id;
  renderList();
  renderEditor();
}

function newNote() {
  activeId = null;
  titleInput.value = "";
  contentInput.value = "";
  updatedAtEl.textContent = "아직 저장되지 않음";
  countInfo.textContent = "0자";
  deleteButton.disabled = true;
  titleInput.focus();
  renderList();
}

async function saveNote() {
  const now = new Date().toISOString();
  const oldNote = getActiveNote();
  const note = {
    id: oldNote?.id || createId(),
    title: titleInput.value.trim() || "제목 없음",
    content: contentInput.value.trim(),
    createdAt: oldNote?.createdAt || now,
    updatedAt: now,
  };

  const savedNote = await noteApi.save(note);
  notes = notes.filter((item) => item.id !== savedNote.id);
  notes.unshift(savedNote);
  activeId = savedNote.id;
  renderList();
  renderEditor();
  setStatus("저장됨");
  titleInput.value = "";
  contentInput.value = "";
}

async function deleteNote() {
  const activeNote = getActiveNote();
  if (!activeNote) {
    return;
  }

  const confirmed = window.confirm(`"${activeNote.title || "제목 없음"}" 메모를 삭제할까요?`);
  if (!confirmed) {
    return;
  }

  await noteApi.remove(activeNote.id);
  notes = notes.filter((note) => note.id !== activeNote.id);
  activeId = notes[0]?.id || null;
  renderList();
  renderEditor();
  setStatus("삭제됨");
}

async function loadNotes() {
  notes = await noteApi.list();
  notes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  activeId = notes[0]?.id || null;
  renderList();
  renderEditor();
}

searchInput.addEventListener("input", renderList);
contentInput.addEventListener("input", () => {
  countInfo.textContent = `${contentInput.value.length}자`;
});
newButton.addEventListener("click", newNote);
saveButton.addEventListener("click", saveNote);
deleteButton.addEventListener("click", deleteNote);

loadNotes().catch(() => {
  setStatus("불러오기 실패");
  noteList.innerHTML = `<li class="empty">메모를 불러오지 못했습니다.</li>`;
});
