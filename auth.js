const overlay = document.getElementById("authOverlay");
const signBtn = document.getElementById("signBtn");
const closeBtn = document.getElementById("authClose");

const tabLogin = document.getElementById("tabLogin");
const tabRegister = document.getElementById("tabRegister");
const submitBtn = document.getElementById("authSubmit");

const usernameInput = document.getElementById("authUsername");
const passwordInput = document.getElementById("authPassword");
const errorBox = document.getElementById("authError");

const userDropdown = document.getElementById("userDropdown");

let mode = "login";

// ---------- OPEN / DROPDOWN ----------
signBtn.onclick = () => {
    if (signBtn.textContent === "Sign in") {
        overlay.style.display = "flex";
    } else {
        userDropdown.style.display =
            userDropdown.style.display === "block" ? "none" : "block";
    }
};

// close modal
closeBtn.onclick = () => {
    overlay.style.display = "none";
};

// ---------- TABS ----------
tabLogin.onclick = () => {
    mode = "login";
    tabLogin.classList.add("active");
    tabRegister.classList.remove("active");
    errorBox.textContent = "";
};

tabRegister.onclick = () => {
    mode = "register";
    tabRegister.classList.add("active");
    tabLogin.classList.remove("active");
    errorBox.textContent = "";
};

// ---------- LOGIN / REGISTER ----------
submitBtn.onclick = async () => {
    const username = usernameInput.value;
    const password = passwordInput.value;

    const url = mode === "login" ? "/api/login" : "/api/register";

    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (!data.ok) {
        errorBox.textContent = data.error;
        return;
    }

    signBtn.textContent = data.username;
    overlay.style.display = "none";
    userDropdown.style.display = "none";
};

// ---------- LOGOUT ----------
userDropdown.onclick = async () => {
    await fetch("/api/logout", { method: "POST" });

    signBtn.textContent = "Sign in";
    userDropdown.style.display = "none";

    // перезагрузка страницы
    location.reload();
};

// ---------- CHECK SESSION ----------
async function checkSession() {
    const res = await fetch("/api/me");
    const data = await res.json();

    if (data.loggedIn) {
        signBtn.textContent = data.username;
    } else {
        signBtn.textContent = "Sign in";
        userDropdown.style.display = "none";
    }
}

checkSession();
