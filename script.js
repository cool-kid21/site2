// script.js

const ADMIN_CODE = 'admin123';

function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}
function clearCurrentUser() {
  localStorage.removeItem('currentUser');
}
function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || [];
}
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}
function signUp(username, password, role='user') {
  const users = getUsers();
  if (users.find(u => u.username === username)) {
    alert('Username already exists.');
    return false;
  }
  users.push({ username, password, role });
  saveUsers(users);
  return true;
}
function signIn(username, password) {
  const users = getUsers();
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    setCurrentUser(user);
    return true;
  } else {
    alert('Invalid credentials.');
    return false;
  }
}
function logout() {
  clearCurrentUser();
}
function loadAllFiles() {
  return JSON.parse(localStorage.getItem('all_files')) || [];
}
function saveAllFiles(files) {
  localStorage.setItem('all_files', JSON.stringify(files));
}
function addFile(uploadedBy, filename, iframeCode) {
  const files = loadAllFiles();
  files.push({ filename, iframe: iframeCode, uploadedBy });
  saveAllFiles(files);
}
function loadAndDisplayFilesForUser() {
  const container = document.getElementById('file-list');
  if (!container) return; // element may not exist on all pages
  container.innerHTML = '';

  const allFiles = loadAllFiles();
  const currentUser = getCurrentUser();
  const filesToShow = currentUser.role === 'admin' ? allFiles : allFiles.filter(f => f.uploadedBy === currentUser.username);

  if (filesToShow.length === 0) {
    container.innerHTML = '<p>No files uploaded yet.</p>';
    return;
  }

  filesToShow.forEach(file => {
    const { filename, iframe, uploadedBy } = file;
    const div = document.createElement('div');
    div.className = 'file-item';

    const title = document.createElement('h3');
    title.textContent = `${filename} (by ${uploadedBy})`;
    div.appendChild(title);

    const iframeDiv = document.createElement('div');
    iframeDiv.innerHTML = iframe;

    // Make iframe clickable for fullscreen
    const clickableDiv = document.createElement('div');
    clickableDiv.style.cursor = 'pointer';
    clickableDiv.appendChild(iframeDiv);
    clickableDiv.addEventListener('click', () => {
      document.getElementById('fullscreen-modal').style.display = 'flex';
      document.getElementById('modal-iframe-container').innerHTML = iframe;
    });
    div.appendChild(clickableDiv);

    // Add delete button if owner or admin
    if (getCurrentUser().role === 'admin' || getCurrentUser().username === uploadedBy) {
      const delBtn = document.createElement('button');
      delBtn.textContent = 'Delete';
      delBtn.onclick = () => {
        if (confirm('Delete this file?')) {
          const allFiles = loadAllFiles();
          const index = allFiles.indexOf(file);
          if (index > -1) {
            allFiles.splice(index, 1);
            saveAllFiles(allFiles);
            loadAndDisplayFilesForUser();
          }
        }
      };
      div.appendChild(delBtn);
    }

    container.appendChild(div);
  });
}

// Event listener for logout
document.querySelectorAll('#logout').forEach(link => {
  link.addEventListener('click', () => {
    logout();
    window.location.href = 'index.html';
  });
});

// Modal close handler
const modalOverlay = document.getElementById('fullscreen-modal');
const closeModalBtn = document.getElementById('close-modal');
if (closeModalBtn) {
  closeModalBtn.addEventListener('click', () => {
    modalOverlay.style.display = 'none';
    document.getElementById('modal-iframe-container').innerHTML = '';
  });
}

// Initialize event handlers based on page
window.addEventListener('DOMContentLoaded', () => {
  const page = window.location.pathname.split('/').pop();

  const user = getCurrentUser();

  // Redirect based on role
  if (user) {
    if (page === 'index.html' || page === 'signup.html') {
      if (user.role === 'admin') {
        window.location.href = 'admin.html';
        return;
      } else {
        window.location.href = 'dashboard.html';
        return;
      }
    }
    if (page === 'dashboard.html' && user.role === 'admin') {
      window.location.href = 'admin.html';
      return;
    }
    if (page === 'admin.html' && user.role !== 'admin') {
      window.location.href = 'dashboard.html';
      return;
    }
  } else {
    if (page !== 'index.html' && page !== 'signup.html') {
      window.location.href = 'index.html';
      return;
    }
  }

  // Attach event for sign-in page
  if (page === 'index.html') {
    const form = document.getElementById('signin-form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        if (signIn(username, password)) {
          const user = getCurrentUser();
          if (user.role === 'admin') {
            window.location.href = 'admin.html';
          } else {
            window.location.href = 'dashboard.html';
          }
        }
      });
    }
  }

  // Attach event for sign-up page
  if (page === 'signup.html') {
    const form = document.getElementById('signup-form');
    if (form) {
      form.addEventListener('submit', e => {
        e.preventDefault();
        const username = document.getElementById('new-username').value.trim();
        const password = document.getElementById('new-password').value;
        if (password.length < 8) {
          alert('Password must be at least 8 characters.');
          return;
        }
        const adminCodeInput = document.getElementById('admin-code');
        const adminCode = adminCodeInput ? adminCodeInput.value.trim() : '';
        let role = 'user';
        if (adminCode && adminCode === 'admin123') {
          role = 'admin';
        }
        if (signUp(username, password, role)) {
          alert('Account created! Please sign in.');
          window.location.href = 'index.html';
        }
      });
    }
  }

  // Load files in dashboard
  if (page === 'dashboard.html') {
    loadAndDisplayFilesForUser();

    // Attach upload form event
    const uploadForm = document.getElementById('upload-form');
    if (uploadForm) {
      uploadForm.addEventListener('submit', e => {
        e.preventDefault();
        const filename = document.getElementById('file-name').value.trim();
        const iframeCode = document.getElementById('iframe-code').value.trim();
        const user = getCurrentUser();
        if (filename && iframeCode) {
          addFile(user.username, filename, iframeCode);
          loadAndDisplayFilesForUser(); // refresh list
          uploadForm.reset();
        }
      });
    }
  }

  // Load files in admin page
  if (page === 'admin.html') {
    loadAllFiles(); // To ensure data is loaded
  }
});
