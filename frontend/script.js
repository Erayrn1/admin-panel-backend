/* ===== AUTO REDIRECT ===== */
(function () {
  const token = localStorage.getItem('token');
  if (token) {
    window.location.replace('dashboard.html');
  }
})();

const BACKEND_URL = 'https://admin-panel-backend-ur6p.vercel.app/api/auth/login';

/* ===== EYES FOLLOW CURSOR ===== */
document.addEventListener('mousemove', function (e) {
  movePupil('pupilLeft', 'eyeLeft', e.clientX, e.clientY);
  movePupil('pupilRight', 'eyeRight', e.clientX, e.clientY);
});

function movePupil(pupilId, eyeId, cx, cy) {
  const eye = document.getElementById(eyeId);
  const pupil = document.getElementById(pupilId);
  if (!eye || !pupil) return;

  const rect = eye.getBoundingClientRect();
  const eyeCx = rect.left + rect.width / 2;
  const eyeCy = rect.top + rect.height / 2;

  const dx = cx - eyeCx;
  const dy = cy - eyeCy;
  const angle = Math.atan2(dy, dx);
  const maxDist = (rect.width / 2) - (pupil.offsetWidth / 2) - 4;
  const dist = Math.min(Math.hypot(dx, dy), maxDist);

  const tx = Math.cos(angle) * dist;
  const ty = Math.sin(angle) * dist;

  pupil.style.transform = `translate(${tx}px, ${ty}px)`;
}

/* ===== LOGIN FORM ===== */
const form = document.getElementById('loginForm');
const loginBtn = document.getElementById('loginBtn');
const btnText = document.getElementById('btnText');
const btnLoading = document.getElementById('btnLoading');
const errorMsg = document.getElementById('errorMsg');
const warningOverlay = document.getElementById('warningOverlay');
const overlayMsg = document.getElementById('overlayMsg');
const overlayCloseBtn = document.getElementById('overlayCloseBtn');

if (overlayCloseBtn) {
  overlayCloseBtn.addEventListener('click', function () {
    warningOverlay.style.display = 'none';
  });
}

if (form) {
  form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      showError('Tüm alanları doldurun! 🕷️');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.success && data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('username', username);
        window.location.replace('dashboard.html');
      } else {
        const msg = (data && data.message) ? data.message : 'Giriş başarısız!';
        showError(msg);
        showOverlay(msg);
      }
    } catch (err) {
      const msg = 'Sunucuya ulaşılamadı! Ruhlar engel oluyor... 👻';
      showError(msg);
      showOverlay(msg);
    } finally {
      setLoading(false);
    }
  });
}

function setLoading(state) {
  if (!loginBtn) return;
  loginBtn.disabled = state;
  if (btnText) btnText.style.display = state ? 'none' : 'inline';
  if (btnLoading) btnLoading.style.display = state ? 'inline' : 'none';
}

function showError(msg) {
  if (!errorMsg) return;
  errorMsg.textContent = msg;
  errorMsg.style.display = 'block';
  const box = document.querySelector('.login-box');
  if (box) {
    box.classList.remove('shake');
    void box.offsetWidth; // reflow to restart animation
    box.classList.add('shake');
  }
}

function showOverlay(msg) {
  if (!warningOverlay) return;
  if (overlayMsg) overlayMsg.textContent = msg;
  warningOverlay.style.display = 'flex';
}
