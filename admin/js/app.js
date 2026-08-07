(function () {
  'use strict';

  var CREDENTIALS = { username: 'erayrn', password: 'erayrn321' };
  var AUTH_KEY    = 'kh_admin_token';

  var form     = document.getElementById('loginForm');
  var errorMsg = document.getElementById('errorMsg');

  function showError(msg) {
    errorMsg.textContent = msg;
  }

  function clearError() {
    errorMsg.textContent = '';
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    clearError();

    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    if (username === CREDENTIALS.username && password === CREDENTIALS.password) {
      localStorage.setItem(AUTH_KEY, btoa(username + ':' + Date.now()));
      window.location.href = 'dashboard.html';
    } else {
      showError('Kullanıcı adı veya şifre yanlış');
    }
  });
}());
