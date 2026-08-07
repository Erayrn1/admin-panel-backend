// Hardcoded credentials
const ADMIN_USERNAME = 'erayrn';
const ADMIN_PASSWORD = 'erayrn321';
const AUTH_TOKEN = 'admin_token_erayrn';

// Check if user is already logged in
function checkAuth() {
    const token = localStorage.getItem(AUTH_TOKEN);
    if (token && window.location.pathname.includes('index.html')) {
        window.location.href = 'dashboard.html';
    }
    if (!token && window.location.pathname.includes('dashboard.html')) {
        window.location.href = 'index.html';
    }
}

// Navigate to page
function goToPage(page) {
    window.location.href = page;
}

// Login form handler
document.addEventListener('DOMContentLoaded', function() {
    checkAuth();

    const loginForm = document.getElementById('loginForm');
    const errorMessage = document.getElementById('errorMessage');
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const loginBtn = document.querySelector('.login-btn');

    if (loginForm) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const username = usernameInput.value.trim();
            const password = passwordInput.value;

            // Clear previous error
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';

            // Validate credentials
            if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
                // Success
                loginBtn.disabled = true;
                loginBtn.textContent = 'Giriş Yapılıyor...';

                // Store auth token
                localStorage.setItem(AUTH_TOKEN, 'authenticated_' + Date.now());

                // Redirect to dashboard
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 500);
            } else {
                // Error
                errorMessage.textContent = 'Kullanıcı adı veya şifre yanlış';
                errorMessage.style.display = 'block';

                // Shake animation
                loginForm.style.animation = 'none';
                setTimeout(() => {
                    loginForm.style.animation = 'shake 0.5s ease';
                }, 10);

                // Clear password field
                passwordInput.value = '';
                passwordInput.focus();
            }
        });
    }
});

// Logout function
function logout() {
    localStorage.removeItem(AUTH_TOKEN);
    window.location.href = 'index.html';
}

// Add shake animation
const style = document.createElement('style');
style.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
        20%, 40%, 60%, 80% { transform: translateX(5px); }
    }
`;
document.head.appendChild(style);
