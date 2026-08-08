/* ========================================
   Dashboard Logic - dashboard.js
   ======================================== */

const token = localStorage.getItem('token');
const username = localStorage.getItem('username') || 'Admin';

// Redirect to login if not authenticated
if (!token) {
  window.location.href = 'index.html';
}

// Show admin name
const adminNameEl = document.getElementById('adminName');
if (adminNameEl) {
  adminNameEl.textContent = username;
}

// Show session info
const sessionInfoEl = document.getElementById('sessionInfo');
if (sessionInfoEl) {
  const loginTime = new Date().toLocaleString('tr-TR');
  sessionInfoEl.innerHTML = `
    Kullanıcı: <strong style="color:#ff3333">${username}</strong><br/>
    Giriş Saati: <strong style="color:#ff3333">${loginTime}</strong><br/>
    Token: <span style="color:rgba(255,51,51,0.5);font-size:0.75rem;word-break:break-all">${token.substring(0, 40)}...</span>
  `;
}

// Animate stat counters
function animateCount(elId, target, duration) {
  const el = document.getElementById(elId);
  if (!el) return;
  const start = 0;
  const step = Math.ceil(target / (duration / 30));
  let current = start;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current >= target) clearInterval(timer);
  }, 30);
}

animateCount('ghostCount', 13, 800);
animateCount('skullCount', 666, 1200);
animateCount('batCount', 99, 1000);
animateCount('spiderCount', 777, 1100);

// Logout
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.href = 'index.html';
  });
}
