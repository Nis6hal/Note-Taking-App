
const titleInput = document.getElementById('title');
const tagInput = document.getElementById('tag');
const contentInput = document.getElementById('content');
const addBtn = document.getElementById('add-note');
const notesContainer = document.getElementById('notes');
const searchInput = document.getElementById('search');
const toggleThemeBtn = document.getElementById('toggle-theme');
const body = document.body;

let notes = JSON.parse(localStorage.getItem('notes')) || [];

// DARK MODE INIT
if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark');
  toggleThemeBtn.textContent = "☀️ Light Mode";
}

// DISPLAY NOTES
function displayNotes(filter = "") {
  notesContainer.innerHTML = "";
  notes
    .filter(n =>
      n.title.toLowerCase().includes(filter.toLowerCase()) ||
      n.content.toLowerCase().includes(filter.toLowerCase()) ||
      n.tag.toLowerCase().includes(filter.toLowerCase())
    )
    .forEach((note, index) => {
      const noteDiv = document.createElement('div');
      noteDiv.className = 'note';
      noteDiv.innerHTML = `
        <h3>${note.title}</h3>
        <p><strong>${note.tag}</strong></p>
        <p>${note.content}</p>
        <button class="delete" onclick="deleteNote(${index})">×</button>
      `;
      notesContainer.appendChild(noteDiv);
    });
}

// ADD NOTE
addBtn.addEventListener('click', () => {
  const note = {
    title: titleInput.value.trim(),
    tag: tagInput.value.trim(),
    content: contentInput.value.trim()
  };

  if (!note.title || !note.content) {
    alert("Title and Content are required!");
    return;
  }

  notes.push(note);
  localStorage.setItem('notes', JSON.stringify(notes));
  displayNotes();
  titleInput.value = "";
  tagInput.value = "";
  contentInput.value = "";
});

// DELETE NOTE
window.deleteNote = function(index) {
  notes.splice(index, 1);
  localStorage.setItem('notes', JSON.stringify(notes));
  displayNotes(searchInput.value);
};

// SEARCH NOTES
searchInput.addEventListener('input', () => {
  displayNotes(searchInput.value);
});

// TOGGLE THEME
toggleThemeBtn.addEventListener('click', () => {
  body.classList.toggle('dark');
  const isDark = body.classList.contains('dark');
  toggleThemeBtn.textContent = isDark ? "☀️ Light Mode" : "🌙 Dark Mode";
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
});

displayNotes();
