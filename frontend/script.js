/* ========================================
   Login Logic & Horror Effects - script.js
   ======================================== */

const API_BASE = 'https://admin-panel-backend-ur6p.vercel.app';

// ---- Eyes following cursor ----
document.addEventListener('mousemove', (e) => {
  const pupils = [
    { eye: document.getElementById('eye1'), pupil: document.getElementById('pupil1') },
    { eye: document.getElementById('eye2'), pupil: document.getElementById('pupil2') },
  ];

  pupils.forEach(({ eye, pupil }) => {
    if (!eye || !pupil) return;
    const rect = eye.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxMove = 8;
    const mx = (dx / dist) * Math.min(dist, maxMove);
    const my = (dy / dist) * Math.min(dist, maxMove);
    pupil.style.transform = `translate(${mx}px, ${my}px)`;
  });
});

// ---- Warning overlay helpers ----
function showWarning(msg) {
  const overlay = document.getElementById('warningOverlay');
  const msgEl = document.getElementById('warningMsg');
  if (msgEl) msgEl.textContent = msg;
  if (overlay) overlay.classList.add('active');
}

function closeWarning() {
  const overlay = document.getElementById('warningOverlay');
  if (overlay) overlay.classList.remove('active');
}

// ---- Shake the login box ----
function shakeLoginBox() {
  const box = document.getElementById('loginBox');
  if (!box) return;
  box.classList.remove('shake');
  // Force reflow to restart animation
  void box.offsetWidth;
  box.classList.add('shake');
  box.addEventListener('animationend', () => box.classList.remove('shake'), { once: true });
}

// ---- Show inline error ----
function setError(msg) {
  const el = document.getElementById('errorMsg');
  if (el) el.textContent = msg;
}

// ---- Toggle loading state on button ----
function setLoading(loading) {
  const btn = document.getElementById('loginBtn');
  const text = btn && btn.querySelector('.btn-text');
  const loadEl = document.getElementById('btnLoading');
  if (!btn) return;
  btn.disabled = loading;
  if (text) text.style.display = loading ? 'none' : '';
  if (loadEl) loadEl.style.display = loading ? '' : 'none';
}

// ---- Login form submission ----
const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;

    if (!username || !password) {
      setLoading(false);
      setError('⚠️ Kullanıcı adı ve şifre gerekli!');
      shakeLoginBox();
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (res.ok && data.token) {
        // Store token and username
        localStorage.setItem('token', data.token);
        localStorage.setItem('username', username);
        // Redirect to dashboard
        window.location.href = 'dashboard.html';
      } else {
        const errMsg = data.message || data.error || 'Giriş başarısız!';
        shakeLoginBox();
        showWarning(`☠️ ${errMsg}`);
        setError(`❌ ${errMsg}`);
      }
    } catch (err) {
      shakeLoginBox();
      const msg = 'Sunucuya ulaşılamadı. Lütfen tekrar dene.';
      showWarning(`🌐 ${msg}`);
      setError(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  });
}

// ---- Redirect if already logged in ----
if (localStorage.getItem('token')) {
  window.location.href = 'dashboard.html';
}
