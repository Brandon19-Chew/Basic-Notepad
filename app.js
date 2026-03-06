// Ruby Notepad - Frontend JavaScript
// Features: Notes CRUD, Tags, Share, Download

(function() {
  'use strict';

  // State
  var notes = [];
  var tags = [];
  var currentNoteId = null;
  var currentColor = '#ffffff';
  var currentNoteTags = [];
  var activeTagFilter = 'all';

  // DOM Elements
  var listView = document.getElementById('list-view');
  var editorView = document.getElementById('editor-view');
  var notesContainer = document.getElementById('notes-container');
  var emptyState = document.getElementById('empty-state');
  var addBtn = document.getElementById('add-btn');
  var backBtn = document.getElementById('back-btn');
  var deleteBtn = document.getElementById('delete-btn');
  var colorBtn = document.getElementById('color-btn');
  var colorPicker = document.getElementById('color-picker');
  var noteTitle = document.getElementById('note-title');
  var noteContent = document.getElementById('note-content');
  var searchBtn = document.getElementById('search-btn');
  var searchBar = document.getElementById('search-bar');
  var searchInput = document.getElementById('search-input');
  var searchClose = document.getElementById('search-close');
  var deleteModal = document.getElementById('delete-modal');
  var cancelDelete = document.getElementById('cancel-delete');
  var confirmDelete = document.getElementById('confirm-delete');
  var listTitle = document.getElementById('list-title');

  // Tag elements
  var tagsBtn = document.getElementById('tags-btn');
  var tagFilterBar = document.getElementById('tag-filter-bar');
  var tagBtn = document.getElementById('tag-btn');
  var tagPicker = document.getElementById('tag-picker');
  var tagPickerList = document.getElementById('tag-picker-list');
  var tagPickerClose = document.getElementById('tag-picker-close');
  var newTagInput = document.getElementById('new-tag-input');
  var addTagBtn = document.getElementById('add-tag-btn');
  var editorTags = document.getElementById('editor-tags');
  var manageTagsBtn = document.getElementById('manage-tags-btn');
  var manageTagsModal = document.getElementById('manage-tags-modal');
  var manageTagsList = document.getElementById('manage-tags-list');
  var manageNewTagInput = document.getElementById('manage-new-tag-input');
  var manageAddTagBtn = document.getElementById('manage-add-tag-btn');
  var manageTagsCloseBtn = document.getElementById('manage-tags-close-btn');

  // Share & Download elements
  var shareBtn = document.getElementById('share-btn');
  var downloadBtn = document.getElementById('download-btn');
  var shareModal = document.getElementById('share-modal');
  var shareTextBtn = document.getElementById('share-text-btn');
  var shareCopyBtn = document.getElementById('share-copy-btn');
  var shareEmailBtn = document.getElementById('share-email-btn');
  var shareWhatsappBtn = document.getElementById('share-whatsapp-btn');
  var shareCancel = document.getElementById('share-cancel');

  var toast = document.getElementById('toast');

  // ===== Storage =====
  function loadNotes() {
    try {
      var data = localStorage.getItem('ruby_notepad_notes');
      notes = data ? JSON.parse(data) : [];
      // Migrate old notes to include tags array
      notes.forEach(function(n) {
        if (!n.tags) n.tags = [];
      });
    } catch (e) { notes = []; }
  }

  function saveNotes() {
    localStorage.setItem('ruby_notepad_notes', JSON.stringify(notes));
  }

  function loadTags() {
    try {
      var data = localStorage.getItem('ruby_notepad_tags');
      tags = data ? JSON.parse(data) : [];
    } catch (e) { tags = []; }
  }

  function saveTags() {
    localStorage.setItem('ruby_notepad_tags', JSON.stringify(tags));
  }

  function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
  }

  // ===== Toast =====
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.remove('hidden');
    toast.classList.add('visible');
    setTimeout(function() {
      toast.classList.remove('visible');
      toast.classList.add('hidden');
    }, 2000);
  }

  // ===== Date Formatting =====
  function formatDate(timestamp) {
    var date = new Date(timestamp);
    var now = new Date();
    var diff = now - date;
    var minutes = Math.floor(diff / 60000);
    var hours = Math.floor(diff / 3600000);
    var days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return minutes + 'm ago';
    if (hours < 24) return hours + 'h ago';
    if (days < 7) return days + 'd ago';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ===== Tag Filter Bar =====
  function renderTagFilterBar() {
    var scroll = tagFilterBar.querySelector('.tag-filter-scroll');
    scroll.innerHTML = '<button class="tag-chip' + (activeTagFilter === 'all' ? ' active' : '') + '" data-tag="all">All Notes</button>';
    tags.forEach(function(tag) {
      var btn = document.createElement('button');
      btn.className = 'tag-chip' + (activeTagFilter === tag ? ' active' : '');
      btn.setAttribute('data-tag', tag);
      btn.textContent = tag;
      scroll.appendChild(btn);
    });
    scroll.querySelectorAll('.tag-chip').forEach(function(chip) {
      chip.addEventListener('click', function() {
        activeTagFilter = this.getAttribute('data-tag');
        renderTagFilterBar();
        renderNotes();
        if (activeTagFilter === 'all') {
          listTitle.textContent = 'Ruby Notepad';
        } else {
          listTitle.textContent = activeTagFilter;
        }
      });
    });
  }

  // ===== Render Notes =====
  function renderNotes(filteredNotes) {
    var list = filteredNotes || notes;

    // Apply tag filter
    if (!filteredNotes && activeTagFilter !== 'all') {
      list = list.filter(function(n) {
        return n.tags && n.tags.indexOf(activeTagFilter) !== -1;
      });
    }

    notesContainer.innerHTML = '';

    if (list.length === 0) {
      notesContainer.classList.add('hidden');
      emptyState.classList.remove('hidden');
      return;
    }

    notesContainer.classList.remove('hidden');
    emptyState.classList.add('hidden');

    var sorted = list.slice().sort(function(a, b) { return b.updated_at - a.updated_at; });

    sorted.forEach(function(note) {
      var card = document.createElement('div');
      card.className = 'note-card';
      card.style.backgroundColor = note.color || '#ffffff';
      card.setAttribute('data-id', note.id);

      var title = note.title || 'Untitled';
      var preview = note.content || '';
      var date = formatDate(note.updated_at);

      var tagsHtml = '';
      if (note.tags && note.tags.length > 0) {
        tagsHtml = '<div class="card-tags">';
        note.tags.forEach(function(t) {
          tagsHtml += '<span class="card-tag">' + escapeHtml(t) + '</span>';
        });
        tagsHtml += '</div>';
      }

      card.innerHTML =
        '<div class="card-title">' + escapeHtml(title) + '</div>' +
        '<div class="card-preview">' + escapeHtml(preview) + '</div>' +
        tagsHtml +
        '<div class="card-date">' + date + '</div>';

      card.addEventListener('click', function() { openNote(note.id); });
      notesContainer.appendChild(card);
    });
  }

  // ===== Editor Tags Display =====
  function renderEditorTags() {
    if (currentNoteTags.length === 0) {
      editorTags.classList.add('hidden');
      editorTags.innerHTML = '';
      return;
    }
    editorTags.classList.remove('hidden');
    editorTags.innerHTML = '';
    currentNoteTags.forEach(function(t) {
      var span = document.createElement('span');
      span.className = 'editor-tag';
      span.textContent = t;
      editorTags.appendChild(span);
    });
  }

  // ===== Tag Picker =====
  function renderTagPicker() {
    tagPickerList.innerHTML = '';
    tags.forEach(function(tag) {
      var item = document.createElement('button');
      item.className = 'tag-picker-item' + (currentNoteTags.indexOf(tag) !== -1 ? ' selected' : '');
      item.textContent = tag;
      item.addEventListener('click', function() {
        var idx = currentNoteTags.indexOf(tag);
        if (idx === -1) {
          currentNoteTags.push(tag);
        } else {
          currentNoteTags.splice(idx, 1);
        }
        renderTagPicker();
        renderEditorTags();
        saveCurrentNote();
      });
      tagPickerList.appendChild(item);
    });
  }

  // ===== Manage Tags Modal =====
  function renderManageTags() {
    manageTagsList.innerHTML = '';
    if (tags.length === 0) {
      manageTagsList.innerHTML = '<p style="text-align:center;color:#ccc;font-size:13px;padding:12px">No tags yet</p>';
      return;
    }
    tags.forEach(function(tag) {
      var count = notes.filter(function(n) { return n.tags && n.tags.indexOf(tag) !== -1; }).length;
      var item = document.createElement('div');
      item.className = 'manage-tag-item';
      item.innerHTML =
        '<div><span class="tag-name">' + escapeHtml(tag) + '</span><span class="tag-count">' + count + ' note' + (count !== 1 ? 's' : '') + '</span></div>' +
        '<button class="manage-tag-delete" title="Delete tag"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>';
      item.querySelector('.manage-tag-delete').addEventListener('click', function() {
        tags = tags.filter(function(t) { return t !== tag; });
        saveTags();
        notes.forEach(function(n) {
          if (n.tags) { n.tags = n.tags.filter(function(t) { return t !== tag; }); }
        });
        saveNotes();
        renderManageTags();
        renderTagFilterBar();
        if (activeTagFilter === tag) { activeTagFilter = 'all'; listTitle.textContent = 'Ruby Notepad'; }
      });
      manageTagsList.appendChild(item);
    });
  }

  function addNewTag(inputEl) {
    var name = inputEl.value.trim();
    if (!name) return;
    if (tags.indexOf(name) !== -1) { showToast('Tag already exists'); return; }
    tags.push(name);
    saveTags();
    inputEl.value = '';
    renderTagFilterBar();
    renderTagPicker();
    renderManageTags();
    showToast('Tag "' + name + '" created');
  }

  // ===== Note Operations =====
  function openNote(id) {
    var note = notes.find(function(n) { return n.id === id; });
    if (!note) return;
    currentNoteId = id;
    currentColor = note.color || '#ffffff';
    currentNoteTags = (note.tags || []).slice();
    noteTitle.value = note.title || '';
    noteContent.value = note.content || '';
    editorView.style.backgroundColor = currentColor;
    updateColorSelection();
    colorPicker.classList.add('hidden');
    tagPicker.classList.add('hidden');
    renderEditorTags();
    showView('editor');
  }

  function createNote() {
    var note = {
      id: generateId(),
      title: '',
      content: '',
      color: '#ffffff',
      tags: [],
      created_at: Date.now(),
      updated_at: Date.now()
    };
    notes.push(note);
    saveNotes();
    openNote(note.id);
  }

  function saveCurrentNote() {
    if (!currentNoteId) return;
    var note = notes.find(function(n) { return n.id === currentNoteId; });
    if (!note) return;
    note.title = noteTitle.value.trim();
    note.content = noteContent.value.trim();
    note.color = currentColor;
    note.tags = currentNoteTags.slice();
    note.updated_at = Date.now();
    if (!note.title && !note.content) {
      notes = notes.filter(function(n) { return n.id !== currentNoteId; });
    }
    saveNotes();
  }

  function deleteNote() {
    notes = notes.filter(function(n) { return n.id !== currentNoteId; });
    saveNotes();
    currentNoteId = null;
    showView('list');
    renderNotes();
  }

  function showView(view) {
    if (view === 'editor') {
      listView.classList.remove('active');
      editorView.classList.add('active');
      setTimeout(function() {
        if (noteTitle.value) { noteContent.focus(); } else { noteTitle.focus(); }
      }, 100);
    } else {
      editorView.classList.remove('active');
      listView.classList.add('active');
      renderNotes();
    }
  }

  function updateColorSelection() {
    colorPicker.querySelectorAll('.color-dot').forEach(function(dot) {
      if (dot.getAttribute('data-color') === currentColor) {
        dot.classList.add('selected');
      } else {
        dot.classList.remove('selected');
      }
    });
  }

  function performSearch() {
    var query = searchInput.value.toLowerCase().trim();
    if (!query) { renderNotes(); return; }
    var filtered = notes.filter(function(n) {
      return (n.title || '').toLowerCase().indexOf(query) !== -1 ||
             (n.content || '').toLowerCase().indexOf(query) !== -1 ||
             (n.tags || []).some(function(t) { return t.toLowerCase().indexOf(query) !== -1; });
    });
    renderNotes(filtered);
  }

  // ===== Share =====
  function getNoteText() {
    var note = notes.find(function(n) { return n.id === currentNoteId; });
    if (!note) return '';
    var text = '';
    if (note.title) text += note.title + '\n\n';
    if (note.content) text += note.content;
    if (note.tags && note.tags.length > 0) {
      text += '\n\nTags: ' + note.tags.join(', ');
    }
    return text;
  }

  function shareViaWebAPI() {
    var note = notes.find(function(n) { return n.id === currentNoteId; });
    if (!note) return;
    if (navigator.share) {
      navigator.share({ title: note.title || 'Untitled Note', text: getNoteText() }).catch(function() {});
    } else {
      copyToClipboard();
    }
    shareModal.classList.add('hidden');
  }

  function copyToClipboard() {
    var text = getNoteText();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        showToast('Copied to clipboard');
      }).catch(function() { fallbackCopy(text); });
    } else {
      fallbackCopy(text);
    }
    shareModal.classList.add('hidden');
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); showToast('Copied to clipboard'); }
    catch(e) { showToast('Copy failed'); }
    document.body.removeChild(ta);
  }

  function shareViaEmail() {
    var note = notes.find(function(n) { return n.id === currentNoteId; });
    if (!note) return;
    var subject = encodeURIComponent(note.title || 'Shared Note');
    var body = encodeURIComponent(getNoteText());
    window.open('mailto:?subject=' + subject + '&body=' + body);
    shareModal.classList.add('hidden');
  }

  function shareViaWhatsApp() {
    var text = encodeURIComponent(getNoteText());
    window.open('https://wa.me/?text=' + text, '_blank');
    shareModal.classList.add('hidden');
  }

  // ===== Download =====
  function downloadNote() {
    var note = notes.find(function(n) { return n.id === currentNoteId; });
    if (!note) return;
    var text = getNoteText();
    var filename = (note.title || 'untitled').replace(/[^a-zA-Z0-9 ]/g, '').trim().replace(/\s+/g, '_') + '.txt';
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Note downloaded');
  }

  // ===== Event Listeners =====
  addBtn.addEventListener('click', createNote);

  backBtn.addEventListener('click', function() {
    saveCurrentNote();
    currentNoteId = null;
    showView('list');
  });

  deleteBtn.addEventListener('click', function() { deleteModal.classList.remove('hidden'); });
  cancelDelete.addEventListener('click', function() { deleteModal.classList.add('hidden'); });
  confirmDelete.addEventListener('click', function() { deleteModal.classList.add('hidden'); deleteNote(); });
  document.querySelector('#delete-modal .modal-backdrop').addEventListener('click', function() { deleteModal.classList.add('hidden'); });

  colorBtn.addEventListener('click', function() {
    colorPicker.classList.toggle('hidden');
    tagPicker.classList.add('hidden');
  });

  colorPicker.querySelectorAll('.color-dot').forEach(function(dot) {
    dot.addEventListener('click', function() {
      currentColor = this.getAttribute('data-color');
      editorView.style.backgroundColor = currentColor;
      updateColorSelection();
    });
  });

  // Tags button in header (list view) - toggle filter bar
  tagsBtn.addEventListener('click', function() { tagFilterBar.classList.toggle('hidden'); });

  // Tag button in editor - toggle tag picker
  tagBtn.addEventListener('click', function() {
    tagPicker.classList.toggle('hidden');
    colorPicker.classList.add('hidden');
    if (!tagPicker.classList.contains('hidden')) { renderTagPicker(); }
  });

  tagPickerClose.addEventListener('click', function() { tagPicker.classList.add('hidden'); });
  addTagBtn.addEventListener('click', function() { addNewTag(newTagInput); });
  newTagInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') { addNewTag(newTagInput); } });

  // Manage tags modal
  manageTagsBtn.addEventListener('click', function() { renderManageTags(); manageTagsModal.classList.remove('hidden'); });
  manageTagsCloseBtn.addEventListener('click', function() { manageTagsModal.classList.add('hidden'); });
  document.querySelector('.manage-tags-backdrop').addEventListener('click', function() { manageTagsModal.classList.add('hidden'); });
  manageAddTagBtn.addEventListener('click', function() { addNewTag(manageNewTagInput); });
  manageNewTagInput.addEventListener('keydown', function(e) { if (e.key === 'Enter') { addNewTag(manageNewTagInput); } });

  // Share
  shareBtn.addEventListener('click', function() {
    saveCurrentNote();
    var note = notes.find(function(n) { return n.id === currentNoteId; });
    if (!note || (!note.title && !note.content)) { showToast('Write something first'); return; }
    shareModal.classList.remove('hidden');
  });
  shareTextBtn.addEventListener('click', shareViaWebAPI);
  shareCopyBtn.addEventListener('click', copyToClipboard);
  shareEmailBtn.addEventListener('click', shareViaEmail);
  shareWhatsappBtn.addEventListener('click', shareViaWhatsApp);
  shareCancel.addEventListener('click', function() { shareModal.classList.add('hidden'); });
  document.querySelector('.share-backdrop').addEventListener('click', function() { shareModal.classList.add('hidden'); });

  // Download
  downloadBtn.addEventListener('click', function() {
    saveCurrentNote();
    var note = notes.find(function(n) { return n.id === currentNoteId; });
    if (!note || (!note.title && !note.content)) { showToast('Write something first'); return; }
    downloadNote();
  });

  // Search
  searchBtn.addEventListener('click', function() { searchBar.classList.remove('hidden'); searchInput.focus(); });
  searchClose.addEventListener('click', function() { searchBar.classList.add('hidden'); searchInput.value = ''; renderNotes(); });
  searchInput.addEventListener('input', performSearch);

  // Auto-save
  var saveTimeout;
  noteTitle.addEventListener('input', function() { clearTimeout(saveTimeout); saveTimeout = setTimeout(saveCurrentNote, 500); });
  noteContent.addEventListener('input', function() { clearTimeout(saveTimeout); saveTimeout = setTimeout(saveCurrentNote, 500); });

  // Android back button
  document.addEventListener('backbutton', function(e) {
    e.preventDefault();
    if (editorView.classList.contains('active')) {
      saveCurrentNote();
      currentNoteId = null;
      showView('list');
    }
  }, false);

  // ===== Initialize =====
  loadNotes();
  loadTags();
  renderTagFilterBar();
  renderNotes();

})();
