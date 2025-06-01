// script.js

// Utility functions
function getUsers() {
  const users = JSON.parse(localStorage.getItem('users')) || [];
  return users;
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

// Authentication
function signUp(username, password, role = 'user') {
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

// Page-specific logic
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  const user = getCurrentUser();

  // Redirect if not signed in (except on signup.html)
  if (currentPage !== 'signup.html' && currentPage !== 'index.html' && !user) {
    window.location.href = 'index.html';
    return;
  }

  // Redirect if signed in on sign-in/signup pages
  if ((currentPage === 'index.html' || currentPage === 'signup.html') && user) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Handle Sign In
  if (currentPage === 'index.html') {
    document.getElementById('signin-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value.trim();
      const password = document.getElementById('password').value;
      if (signIn(username, password)) {
        window.location.href = 'dashboard.html';
      }
    });
  }

  // Handle Sign Up
  if (currentPage === 'signup.html') {
    document.getElementById('signup-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('new-username').value.trim();
      const password = document.getElementById('new-password').value;
      if (signUp(username, password)) {
        alert('Account created! Please sign in.');
        window.location.href = 'index.html';
      }
    });
  }

  // Handle Logout
  if (document.getElementById('logout')) {
    document.getElementById('logout').addEventListener('click', () => {
      logout();
      window.location.href = 'index.html';
    });
  }

  // Dashboard logic
  if (currentPage === 'dashboard.html') {
    // Load user files
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

        // Optionally, add delete button
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

    // Handle new file upload
    document.getElementById('upload-form').addEventListener('submit', (e) => {
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

    loadUserFiles();
  }

  // Admin panel logic
  if (currentPage === 'admin.html') {
    // Check if user is admin
    if (user.role !== 'admin') {
      alert('Access denied.');
      window.location.href = 'dashboard.html';
      return;
    }
    // Load all files
    const adminFileList = document.getElementById('admin-file-list');
    const users = getUsers();

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

          // Delete button
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

    // Add new file
    document.getElementById('admin-upload-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const iframeCode = document.getElementById('admin-iframe-code').value.trim();
      if (!iframeCode) return;
      const files = JSON.parse(localStorage.getItem('files')) || {};
      // For admin, assign to 'admin' or prompt for user? Here, assign to 'admin' user.
      if (!files['admin']) files['admin'] = [];
      files['admin'].push(iframeCode);
      localStorage.setItem('files', JSON.stringify(files));
      document.getElementById('admin-iframe-code').value = '';
      loadAllFiles();
    });

    // Load users
    const userListDiv = document.getElementById('user-list');

    function loadUsers() {
      userListDiv.innerHTML = '';
      getUsers().forEach((u, i) => {
        const div = document.createElement('div');
        div.className = 'user-list';

        div.innerHTML = `
          <p>Username: ${u.username} | Role: ${u.role}</p>
        `;

        // Remove user button (except prevent deleting self)
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
    document.getElementById('add-user-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const username = document.getElementById('new-username').value.trim();
      const password = document.getElementById('new-password').value;
      const role = document.getElementById('user-role').value;
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
