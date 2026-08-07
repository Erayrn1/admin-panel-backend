/* ===== AUTH CHECK ===== */
(function () {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.replace('index.html');
  }
})();

/* ===== POPULATE SESSION INFO ===== */
const username = localStorage.getItem('username') || '???';
const token = localStorage.getItem('token') || '';
const loginTime = new Date().toLocaleString('tr-TR');

const displayUsername = document.getElementById('displayUsername');
const sessionUsername = document.getElementById('sessionUsername');
const sessionTime = document.getElementById('sessionTime');
const sessionToken = document.getElementById('sessionToken');

if (displayUsername) displayUsername.textContent = username;
if (sessionUsername) sessionUsername.textContent = username;
if (sessionTime) sessionTime.textContent = loginTime;
if (sessionToken) sessionToken.textContent = token.slice(0, 40) + '...';

/* ===== ANIMATE STAT COUNTERS ===== */
const stats = [
  { id: 'statGhosts',  target: 13 },
  { id: 'statSkulls',  target: 66 },
  { id: 'statBats',    target: 42 },
  { id: 'statSpiders', target: 99 },
];

stats.forEach(function (stat) {
  const el = document.getElementById(stat.id);
  if (!el) return;
  let current = 0;
  const step = Math.ceil(stat.target / 40);
  const interval = setInterval(function () {
    current = Math.min(current + step, stat.target);
    el.textContent = current;
    if (current >= stat.target) clearInterval(interval);
  }, 40);
});

/* ===== LOGOUT ===== */
const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
  logoutBtn.addEventListener('click', function () {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    window.location.replace('index.html');
  });
}
