// script.js

// The admin code (change as needed)
const ADMIN_CODE = 'admin123';

// Utility functions
function getUsers() {
  return JSON.parse(localStorage.getItem('users')) || [];
}
function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users));
}
function getCurrentUser() {
  return JSON.parse(localStorage.getItem('currentUser'));
}
function setCurrentUser(user) {
  localStorage.setItem('currentUser', JSON.stringify(user));
}
function clearCurrentUser() {
  localStorage.removeItem('currentUser');
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

// DOM ready
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  const user = getCurrentUser();

  // Redirect to correct page based on role
  if (user) {
    // If on sign-in or sign-up pages, redirect to appropriate page
    if (currentPage === 'index.html' || currentPage === 'signup.html') {
      if (user.role === 'admin') {
        window.location.href = 'admin.html';
        return;
      } else {
        window.location.href = 'dashboard.html';
        return;
      }
    }
    // If on any page and user is logged in, ensure correct page for role
    if (currentPage === 'dashboard.html' && user.role === 'admin') {
      // user is admin but on dashboard, redirect to admin
      window.location.href = 'admin.html';
      return;
    }
    if (currentPage === 'admin.html' && user.role !== 'admin') {
      // non-admin on admin page, redirect to dashboard
      window.location.href = 'dashboard.html';
      return;
    }
  } else {
    // Not logged in, if on protected pages, redirect to sign in
    if (currentPage !== 'index.html' && currentPage !== 'signup.html') {
      window.location.href = 'index.html';
      return;
    }
  }

  // Sign In
  if (currentPage === 'index.html') {
    document.getElementById('signin-form').addEventListener('submit', e => {
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

  // Sign Up
  if (currentPage === 'signup.html') {
    document.getElementById('signup-form').addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('new-username').value.trim();
      const password = document.getElementById('new-password').value;
      if (password.length < 8) {
        alert('Password must be at least 8 characters.');
        return;
      }
      const adminCodeInput = document.getElementById('admin-code') ? document.getElementById('admin-code').value.trim() : '';
      let role = 'user';
      if (adminCodeInput && adminCodeInput === ADMIN_CODE) role = 'admin';

      if (signUp(username, password, role)) {
        alert('Account created! Please sign in.');
        window.location.href = 'index.html';
      }
    });
  }

  // Logout
  if (document.getElementById('logout')) {
    document.getElementById('logout').addEventListener('click', () => {
      logout();
      window.location.href = 'index.html';
    });
  }

  // Dashboard (user view)
  if (currentPage === 'dashboard.html') {
    const fileListDiv = document.getElementById('file-list');

    function loadUserFiles() {
      fileListDiv.innerHTML = '';
      const files = JSON.parse(localStorage.getItem('files')) || {};
      const username = user.username;
      const userFiles = files[username] || [];
      if (userFiles.length === 0) {
        fileListDiv.innerHTML = '<p>No files uploaded yet.</p>';
        return;
      }
      userFiles.forEach((iframeCode, index) => {
        const div = document.createElement('div');
        div.className = 'file-item';

        const span = document.createElement('span');
        span.textContent = iframeCode;
        div.appendChild(span);

        const iframeContainer = document.createElement('div');
        iframeContainer.innerHTML = iframeCode;
        div.appendChild(iframeContainer);

        // Delete button
        const delBtn = document.createElement('button');
        delBtn.textContent = 'Delete';
        delBtn.style.marginTop = '0.5rem';
        delBtn.onclick = () => {
          if (confirm('Delete this file?')) {
            userFiles.splice(index, 1);
            files[username] = userFiles;
            localStorage.setItem('files', JSON.stringify(files));
            loadUserFiles();
          }
        };
        div.appendChild(delBtn);
        fileListDiv.appendChild(div);
      });
    }

    // Add file
    document.getElementById('upload-form').addEventListener('submit', e => {
      e.preventDefault();
      const iframeCode = document.getElementById('iframe-code').value.trim();
      if (!iframeCode) return;
      const files = JSON.parse(localStorage.getItem('files')) || {};
      const username = user.username;
      if (!files[username]) files[username] = [];
      files[username].push(iframeCode);
      localStorage.setItem('files', JSON.stringify(files));
      document.getElementById('iframe-code').value = '';
      loadUserFiles();
    });

    // Restrict embed code for non-admins
    const iframeTextarea = document.getElementById('iframe-code');
    if (iframeTextarea && user.role !== 'admin') {
      iframeTextarea.disabled = true;
      iframeTextarea.parentElement.style.display = 'none';
    }

    loadUserFiles();
  }

  // Admin pages
  if (currentPage === 'admin.html') {
    if (user.role !== 'admin') {
      alert('Access denied.');
      window.location.href = 'dashboard.html';
      return;
    }

    // Load all files
    const adminFileList = document.getElementById('admin-file-list');

    function loadAllFiles() {
      adminFileList.innerHTML = '';
      const files = JSON.parse(localStorage.getItem('files')) || {};
      Object.keys(files).forEach(username => {
        files[username].forEach((iframeCode, index) => {
          const div = document.createElement('div');
          div.className = 'file-item';

          const info = document.createElement('span');
          info.textContent = `User: ${username} - File ${index + 1}`;
          div.appendChild(info);

          const iframeContainer = document.createElement('div');
          iframeContainer.innerHTML = iframeCode;
          div.appendChild(iframeContainer);

          const delBtn = document.createElement('button');
          delBtn.textContent = 'Delete';
          delBtn.style.marginTop = '0.5rem';
          delBtn.onclick = () => {
            if (confirm('Delete this file?')) {
              files[username].splice(index, 1);
              if (files[username].length === 0) delete files[username];
              localStorage.setItem('files', JSON.stringify(files));
              loadAllFiles();
            }
          };
          div.appendChild(delBtn);
          adminFileList.appendChild(div);
        });
      });
    }

    // Add new file (admin only)
    document.getElementById('admin-upload-form').addEventListener('submit', e => {
      e.preventDefault();
      const iframeCode = document.getElementById('admin-iframe-code').value.trim();
      if (!iframeCode) return;
      const files = JSON.parse(localStorage.getItem('files')) || {};
      if (!files['admin']) files['admin'] = [];
      files['admin'].push(iframeCode);
      localStorage.setItem('files', JSON.stringify(files));
      document.getElementById('admin-iframe-code').value = '';
      loadAllFiles();
    });

    // Load users for admin
    const userListDiv = document.getElementById('user-list');
    function loadUsers() {
      userListDiv.innerHTML = '';
      getUsers().forEach(u => {
        const div = document.createElement('div');
        div.className = 'user-list';
        div.innerHTML = `<p>Username: ${u.username} | Role: ${u.role}</p>`;
        if (u.username !== user.username) {
          const btn = document.createElement('button');
          btn.textContent = 'Remove User';
          btn.onclick = () => {
            if (confirm(`Remove user ${u.username}?`)) {
              let usersArr = getUsers();
              usersArr = usersArr.filter(user => user.username !== u.username);
              saveUsers(usersArr);
              loadUsers();
            }
          };
          div.appendChild(btn);
        }
        userListDiv.appendChild(div);
      });
    }
    // Add user
    document.getElementById('add-user-form').addEventListener('submit', e => {
      e.preventDefault();
      const username = document.getElementById('new-username').value.trim();
      const password = document.getElementById('new-password').value;
      const role = document.getElementById('user-role').value;
      if (password.length < 8) {
        alert('Password must be at least 8 characters.');
        return;
      }
      if (signUp(username, password, role)) {
        alert('User added.');
        loadUsers();
        document.getElementById('add-user-form').reset();
      }
    });
    loadAllFiles();
    loadUsers();
  }
});
