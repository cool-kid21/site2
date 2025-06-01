// script.js

// Utility functions (same as before)...

// Authentication functions (same as before)...

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  const user = getCurrentUser();

  if (currentPage !== 'signup.html' && currentPage !== 'index.html' && !user) {
    window.location.href = 'index.html';
    return;
  }

  if ((currentPage === 'index.html' || currentPage === 'signup.html') && user) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Sign in handling
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

  // Sign up handling
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

  // Logout
  if (document.getElementById('logout')) {
    document.getElementById('logout').addEventListener('click', () => {
      logout();
      window.location.href = 'index.html';
    });
  }

  // Dashboard
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

  // Admin panel
  if (currentPage === 'admin.html') {
    if (user.role !== 'admin') {
      alert('Access denied.');
      window.location.href = 'dashboard.html';
      return;
    }

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

    // Add new file (admin only)
    document.getElementById('admin-upload-form').addEventListener('submit', (e) => {
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

    // Load users
    const userListDiv = document.getElementById('user-list');

    function loadUsers() {
      userListDiv.innerHTML = '';
      getUsers().forEach((u) => {
        const div = document.createElement('div');
        div.className = 'user-list';

        div.innerHTML = `
          <p>Username: ${u.username} | Role: ${u.role}</p>
        `;

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

  // Hide iframe input for regular users on dashboard
  if (currentPage === 'dashboard.html') {
    // Remove iframe textarea if user is not admin
    const iframeTextarea = document.getElementById('iframe-code');
    if (user.role !== 'admin' && iframeTextarea) {
      iframeTextarea.parentNode.style.display = 'none';
    }
  }
});
