document.addEventListener("DOMContentLoaded", () => {
  initLogin();
  renderProfile();
});

function initLogin() {
  const loginForm = document.getElementById("loginForm");
  if (!loginForm) return;

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();
    handleLogin();
  });
}

async function handleLogin() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    try {
        const response = await fetch('https://plot-twist-neon.vercel.app/api/auth/login', {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify({
        email,
        password
        })
    })
    const data = await response.json();
    if (data.success === true) {
        localStorage.setItem("user", JSON.stringify(data));
        console.log("Login Succesful!")
        renderProfile();
        window.location.href = "index.html";
    } else {
        console.log(data.message)
    }
    } catch (error) {
        console.log(error);
    }
}

function renderProfile() {
const user = JSON.parse(localStorage.getItem("user"));
if (!user) return;
const navLinks = document.querySelector(".nav-links");
const thirdItem = navLinks.children[2];
const registerNav = navLinks.children[1];

thirdItem.innerHTML = `
    <a href="profile.html">Profile</a>
`;

registerNav.style.display = "none";

if (user.role === "admin") {
navLinks.innerHTML += `
    <li><a href="admin.html">Admin</a></li>
`;
}

navLinks.innerHTML += `
<li><button id="logoutBtn">Logout</button></li>
`;

document.getElementById("logoutBtn").addEventListener("click", () => {
localStorage.removeItem("user");
location.reload();
});
}