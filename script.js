
// Utility: Escape HTML to prevent XSS
function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[tag]);
}

// State
let notes = JSON.parse(localStorage.getItem('notes')) || [];
let editIndex = null;

// DOM Elements
const titleInput = document.getElementById('title');
const tagInput = document.getElementById('tag');
const contentInput = document.getElementById('content');
const addBtn = document.getElementById('add-note');
const updateBtn = document.getElementById('update-note');
const cancelEditBtn = document.getElementById('cancel-edit');
const notesContainer = document.getElementById('notes');
const searchInput = document.getElementById('search');
const sortSelect = document.getElementById('sort-notes');
const toggleThemeBtn = document.getElementById('toggle-theme');
const body = document.body;
const noteForm = document.getElementById('note-form');
const emptyState = document.getElementById('empty-state');
const exportBtn = document.getElementById('export-notes');
const importBtn = document.getElementById('import-notes-btn');
const importInput = document.getElementById('import-notes');

// Modal and FAB logic
const fab = document.getElementById('fab');
const noteModal = document.getElementById('note-modal');
const modalBg = document.getElementById('modal-bg');
const editIndicator = document.getElementById('edit-indicator');
const tagList = document.getElementById('tag-list');
const allNotesBtn = document.getElementById('all-notes');

// Settings modal logic
const settingsBtn = document.getElementById('settings-btn');
let settingsModal = document.getElementById('settings-modal');
if (!settingsModal) {
  settingsModal = document.createElement('div');
  settingsModal.id = 'settings-modal';
  settingsModal.className = 'note-modal';
  settingsModal.style.display = 'none';
  settingsModal.innerHTML = `
    <h2>Settings</h2>
    <p>Settings will be available in a future update! 🎉</p>
    <button id="close-settings">Close</button>
  `;
  document.body.appendChild(settingsModal);
}
settingsBtn.addEventListener('click', () => {
  settingsModal.style.display = 'block';
  modalBg.style.display = 'block';
  document.getElementById('close-settings').onclick = () => {
    settingsModal.style.display = 'none';
    modalBg.style.display = 'none';
  };
});

function openModal(edit = false) {
  noteModal.style.display = 'block';
  modalBg.style.display = 'block';
  if (edit) {
    document.getElementById('modal-title').textContent = 'Edit Note';
    addBtn.style.display = 'none';
    updateBtn.style.display = '';
    cancelEditBtn.style.display = '';
  } else {
    document.getElementById('modal-title').textContent = 'Add Note';
    addBtn.style.display = '';
    updateBtn.style.display = 'none';
    cancelEditBtn.style.display = '';
    noteForm.reset();
    editIndex = null;
  }
  setTimeout(() => titleInput.focus(), 100);
}
function closeModal() {
  noteModal.style.display = 'none';
  modalBg.style.display = 'none';
  editIndicator.style.display = 'none';
  noteForm.reset();
  editIndex = null;
}
fab.addEventListener('click', () => openModal(false));
modalBg.addEventListener('click', closeModal);

// Show all notes
allNotesBtn.addEventListener('click', () => {
  searchInput.value = '';
  displayNotes();
  allNotesBtn.classList.add('active');
  Array.from(tagList.children).forEach(btn => btn.classList.remove('active'));
});

// Tag sidebar
function updateTagList() {
  const tags = Array.from(new Set(notes.map(n => n.tag).filter(Boolean)));
  tagList.innerHTML = '';
  tags.forEach(tag => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.textContent = tag;
    btn.addEventListener('click', () => {
      searchInput.value = tag;
      displayNotes(tag);
      Array.from(tagList.children).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      allNotesBtn.classList.remove('active');
    });
    tagList.appendChild(btn);
  });
}

// Pin/unpin logic
function pinNote(index) {
  notes[index].pinned = !notes[index].pinned;
  localStorage.setItem('notes', JSON.stringify(notes));
  displayNotes(searchInput.value, sortSelect.value);
}

// Override displayNotes to show pinned notes first and add pin button
function displayNotes(filter = "", sort = sortSelect.value) {
  notesContainer.innerHTML = "";
  updateTagList();
  let filtered = notes.filter(n =>
    n.title.toLowerCase().includes(filter.toLowerCase()) ||
    n.content.toLowerCase().includes(filter.toLowerCase()) ||
    n.tag.toLowerCase().includes(filter.toLowerCase())
  );
  // Sort
  filtered.sort((a, b) => {
    // Pinned notes always first
    if (b.pinned && !a.pinned) return 1;
    if (a.pinned && !b.pinned) return -1;
    switch (sort) {
      case 'date-desc': return b.created - a.created;
      case 'date-asc': return a.created - b.created;
      case 'title-asc': return a.title.localeCompare(b.title);
      case 'title-desc': return b.title.localeCompare(a.title);
      case 'tag-asc': return a.tag.localeCompare(b.tag);
      case 'tag-desc': return b.tag.localeCompare(a.tag);
      default: return 0;
    }
  });
  if (filtered.length === 0) {
    emptyState.style.display = 'block';
    return;
  } else {
    emptyState.style.display = 'none';
  }
  filtered.forEach((note, index) => {
    const noteDiv = document.createElement('div');
    noteDiv.className = 'note';
    noteDiv.setAttribute('tabindex', '0');
    noteDiv.innerHTML = `
      <div class="note-actions">
        <button class="pin" data-index="${index}" aria-label="${note.pinned ? 'Unpin' : 'Pin'} note">${note.pinned ? '📌' : '📍'}</button>
        <button class="edit" data-index="${index}" aria-label="Edit note">✏️</button>
        <button class="delete" data-index="${index}" aria-label="Delete note">×</button>
      </div>
      <h3>${escapeHTML(note.title)}</h3>
      <p><span class="tag-badge" data-tag="${escapeHTML(note.tag)}">${escapeHTML(note.tag)}</span></p>
      <p>${escapeHTML(note.content)}</p>
      <div class="note-meta">
        <span class="note-date">${new Date(note.created).toLocaleString()}</span>
      </div>
    `;
    notesContainer.appendChild(noteDiv);
  });
}

// ADD/UPDATE NOTE (modal)
noteForm.addEventListener('submit', e => {
  e.preventDefault();
  const note = {
    title: titleInput.value.trim(),
    tag: tagInput.value.trim(),
    content: contentInput.value.trim(),
    created: Date.now()
  };
  if (!note.title || !note.content) {
    alert("Title and Content are required!");
    return;
  }
  if (editIndex !== null) {
    note.created = notes[editIndex].created; // preserve original date
    notes[editIndex] = note;
    editIndex = null;
    editIndicator.style.display = 'none';
  } else {
    notes.push(note);
  }
  localStorage.setItem('notes', JSON.stringify(notes));
  displayNotes(searchInput.value, sortSelect.value);
  closeModal();
  showSaveIndicator();
});

// EDIT/CANCEL (modal)
notesContainer.addEventListener('click', e => {
  if (e.target.classList.contains('pin')) {
    const idx = +e.target.dataset.index;
    pinNote(idx);
  } else if (e.target.classList.contains('edit')) {
    const idx = +e.target.dataset.index;
    const note = notes[idx];
    titleInput.value = note.title;
    tagInput.value = note.tag;
    contentInput.value = note.content;
    editIndex = idx;
    openModal(true);
    editIndicator.style.display = 'block';
  } else if (e.target.classList.contains('delete')) {
    const idx = +e.target.dataset.index;
    if (confirm('Delete this note?')) {
      notes.splice(idx, 1);
      localStorage.setItem('notes', JSON.stringify(notes));
      displayNotes(searchInput.value, sortSelect.value);
    }
  } else if (e.target.classList.contains('tag-badge')) {
    searchInput.value = e.target.dataset.tag;
    displayNotes(searchInput.value, sortSelect.value);
  }
});

cancelEditBtn.addEventListener('click', () => {
  closeModal();
});

// SEARCH & SORT
searchInput.addEventListener('input', () => {
  displayNotes(searchInput.value, sortSelect.value);
});
sortSelect.addEventListener('change', () => {
  displayNotes(searchInput.value, sortSelect.value);
});

// THEME TOGGLE
toggleThemeBtn.addEventListener('click', () => {
  body.classList.toggle('dark');
  const isDark = body.classList.contains('dark');
  toggleThemeBtn.textContent = isDark ? "☀️" : "🌙";
  toggleThemeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

// EXPORT NOTES
exportBtn.addEventListener('click', () => {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(notes));
  const dl = document.createElement('a');
  dl.setAttribute('href', dataStr);
  dl.setAttribute('download', 'notes.json');
  dl.click();
});

// IMPORT NOTES
importBtn.addEventListener('click', () => {
  importInput.click();
});
importInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(ev) {
    try {
      const imported = JSON.parse(ev.target.result);
      if (Array.isArray(imported)) {
        notes = imported.map(n => ({
          ...n,
          created: n.created || Date.now()
        }));
        localStorage.setItem('notes', JSON.stringify(notes));
        displayNotes(searchInput.value, sortSelect.value);
      } else {
        alert('Invalid file format.');
      }
    } catch {
      alert('Failed to import notes.');
    }
  };
  reader.readAsText(file);
});

displayNotes();

// Show a visual indicator for successful save
function showSaveIndicator() {
  let indicator = document.getElementById('save-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'save-indicator';
    indicator.className = 'edit-indicator';
    indicator.style.position = 'fixed';
    indicator.style.top = '1.5rem';
    indicator.style.right = '2.5rem';
    indicator.style.zIndex = '2000';
    document.body.appendChild(indicator);
  }
  indicator.textContent = 'Note saved!';
  indicator.style.display = 'block';
  setTimeout(() => { indicator.style.display = 'none'; }, 1200);
}