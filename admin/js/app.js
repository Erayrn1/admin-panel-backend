(function () {
  'use strict';

  var VALID_USERNAME = 'erayrn';
  var VALID_PASSWORD = 'erayrn321';

  var form = document.getElementById('loginForm');
  var usernameInput = document.getElementById('username');
  var passwordInput = document.getElementById('password');
  var errorMsg = document.getElementById('errorMsg');
  var submitBtn = form ? form.querySelector('.login-btn') : null;

  function showError(msg) {
    if (!errorMsg) return;
    errorMsg.textContent = msg;
    errorMsg.classList.add('visible');

    var card = document.querySelector('.login-card');
    if (card) {
      card.classList.remove('shake');
      void card.offsetWidth;
      card.classList.add('shake');
    }
  }

  function hideError() {
    if (!errorMsg) return;
    errorMsg.textContent = '';
    errorMsg.classList.remove('visible');
  }

  function handleSubmit(e) {
    e.preventDefault();
    hideError();

    var username = usernameInput ? usernameInput.value.trim() : '';
    var password = passwordInput ? passwordInput.value : '';

    if (!username || !password) {
      showError('Kullanıcı adı ve şifre gereklidir');
      return;
    }

    if (submitBtn) submitBtn.disabled = true;

    setTimeout(function () {
      if (username === VALID_USERNAME && password === VALID_PASSWORD) {
        sessionStorage.setItem('admin_auth', '1');
        window.location.href = '/dashboard';
      } else {
        showError('Kullanıcı adı veya şifre yanlış');
        if (submitBtn) submitBtn.disabled = false;
        if (passwordInput) passwordInput.value = '';
      }
    }, 300);
  }

  if (form) {
    form.addEventListener('submit', handleSubmit);
  }

  [usernameInput, passwordInput].forEach(function (input) {
    if (input) {
      input.addEventListener('input', hideError);
    }
  });
}());
