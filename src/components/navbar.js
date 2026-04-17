/**
 * Dynamisk navigeringskomponent
 * Visar olika länkar beroende på inloggningsstatus
 */

import { getUserInfo, logout, getToken } from "../utils/auth.js";

/**
 * Ladda navigeringsfältet baserat på användarens status
 */
export async function loadNavbar() {
  const navContainer = document.getElementById("navbar-container");

  if (!navContainer) {
    console.warn("Kunde inte hitta navigeringsfältets behållare");
    return;
  }

  try {
    // Hämta token
    const token = getToken();
    let user = null;

    // Om det finns en token, hämta användarinformation
    if (token) {
      user = await getUserInfo(token);
    }

    // Bygg länkar baserat på användarens status
    const authLinks = user
      ? `
          <li><a href="profile.html">Profil</a></li>
          <li><a href="#" id="logout-link">Logga ut</a></li>
        `
      : `
          <li><a href="register.html">Skapa konto</a></li>
          <li><a href="login.html">Logga in</a></li>
        `;

    // Bygg navigeringsfältets HTML
    const navbarHTML = `
      <header class="site-header">
        <nav class="main-nav">
          <a href="index.html" class="logo">Plot Twist</a>
          <ul class="nav-links">
            <li><a href="index.html">Hem</a></li>
            ${authLinks}
          </ul>
        </nav>
      </header>
    `;

    // Infoga navigeringsfältet på sidan
    navContainer.innerHTML = navbarHTML;

    // Markera aktiv länk
    highlightActiveLink();

    // Lägg till event listener för utloggningsknappen
    const logoutBtn = document.getElementById("logout-link");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", handleLogout);
    }
  } catch (error) {
    console.error("Fel vid laddning av navigeringsfältet:", error);
    // Vid fel, visa navigeringsfältet utan inloggad användare
    navContainer.innerHTML = `
      <header class="site-header">
        <nav class="main-nav">
          <a href="index.html" class="logo">Plot Twist</a>
          <ul class="nav-links">
            <li><a href="index.html">Hem</a></li>
            <li><a href="register.html">Skapa konto</a></li>
            <li><a href="login.html">Logga in</a></li>
          </ul>
        </nav>
      </header>
    `;
  }
}

/**
 * Hantera utloggning
 */
function handleLogout(event) {
  event.preventDefault();
  
  if (confirm("Är du säker på att du vill logga ut?")) {
    logout();
  }
}

/**
 * Markera aktiv länk i navigeringsfältet
 */
function highlightActiveLink() {
  const links = document.querySelectorAll(".main-nav a");
  
  // Hämta nuvarande sökväg
  let currentPath = window.location.pathname.split("/").pop();
  
  // Om sökvägen är tom eller är roten, anta att det är index.html
  if (!currentPath || currentPath === "") {
    currentPath = "index.html";
  }

  // Markera den aktiva länken
  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href === currentPath) {
      link.classList.add("active");
    }
  });
}

// Ladda navigeringsfältet när filen öppnas
loadNavbar();