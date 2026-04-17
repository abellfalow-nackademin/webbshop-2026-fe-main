/**
 * Inloggningsskript
 * Hanterar inloggningsformuläret och verifierar användaren
 */

import { login, logout } from "../utils/auth.js";
import { getUserInfo } from "../utils/auth.js";

// Initiera sidan när den laddas
document.addEventListener("DOMContentLoaded", initLoginPage);

/**
 * Initiera inloggningssidan
 */
function initLoginPage() {
  const loginForm = document.getElementById("loginForm");

  if (!loginForm) {
    console.error("Kunde inte hitta inloggningsformuläret");
    return;
  }

  // Lägg till event listener för formulärskick
  loginForm.addEventListener("submit", handleLoginSubmit);
}

/**
 * Hantera skickande av inloggningsformuläret
 * @param {Event} event - Skicka-händelsen
 */
async function handleLoginSubmit(event) {
  event.preventDefault();

  // Samla data från formuläret
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  // Validera data
  if (!validateForm(email, password)) {
    return;
  }

  // Inaktivera knappen under bearbetning
  const submitButton = document.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Loggar in...";

  try {
    // Skicka inloggningsförfrågan
    const response = await login(email, password);

    if (response.success) {
      // Lyckad inloggning
      alert("Du har loggat in framgångsrikt!");
      
      // Omdirigera till startsidan
      window.location.href = "index.html";
    } else {
      // Misslyckad inloggning
      alert(response.message || "Inloggningen misslyckades. Kontrollera dina uppgifter.");
    }
  } catch (error) {
    console.error("Fel vid inloggning:", error);
    alert("Ett fel uppstod vid inloggning. Försök igen.");
  } finally {
    // Återaktivera knappen
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

/**
 * Validera formulärdata
 * @param {string} email - E-postadress
 * @param {string} password - Lösenord
 * @returns {boolean} true om datan är giltig
 */
function validateForm(email, password) {
  // Validera e-post
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    alert("Vänligen ange en giltig e-postadress");
    return false;
  }

  // Validera lösenord
  if (!password || password.length < 1) {
    alert("Vänligen ange ditt lösenord");
    return false;
  }

  return true;
}