/**
 * Registreringsskript
 * Hanterar formuläret för att skapa nytt konto
 */

import { register } from "../utils/auth.js";

// Initiera sidan när den laddas
document.addEventListener("DOMContentLoaded", initRegisterPage);

/**
 * Initiera registreringssidan
 */
function initRegisterPage() {
  const registerForm = document.getElementById("registerForm");

  if (!registerForm) {
    console.error("Kunde inte hitta registreringsformuläret");
    return;
  }

  // Lägg till event listener för formulärskick
  registerForm.addEventListener("submit", handleRegisterSubmit);
}

/**
 * Hantera skickande av registreringsformuläret
 * @param {Event} event - Skicka-händelsen
 */
async function handleRegisterSubmit(event) {
  event.preventDefault();

  // Samla data från formuläret
  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // Validera data
  if (!validateForm(name, email, password)) {
    return;
  }

  // Inaktivera knappen under bearbetning
  const submitButton = document.querySelector('button[type="submit"]');
  const originalText = submitButton.textContent;
  submitButton.disabled = true;
  submitButton.textContent = "Skapar konto...";

  try {
    // Skicka förfrågan för att skapa konto
    const response = await register(name, email, password);

    if (response.success) {
      // Lyckad registrering
      alert("Kontot har skapats framgångsrikt! Du kan nu logga in.");
      
      // Omdirigera till inloggningssidan
      window.location.href = "login.html";
    } else {
      // Misslyckad registrering
      alert(response.message || "Kunde inte skapa konto. Försök igen.");
    }
  } catch (error) {
    console.error("Fel vid skapande av konto:", error);
    alert("Ett fel uppstod vid skapande av konto. Försök igen.");
  } finally {
    // Återaktivera knappen
    submitButton.disabled = false;
    submitButton.textContent = originalText;
  }
}

/**
 * Validera formulärdata
 * @param {string} name - Namn
 * @param {string} email - E-postadress
 * @param {string} password - Lösenord
 * @returns {boolean} true om datan är giltig
 */
function validateForm(name, email, password) {
  // Validera namn
  if (!name || name.length < 2) {
    alert("Namnet måste innehålla minst 2 tecken");
    return false;
  }

  // Validera e-post
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    alert("Vänligen ange en giltig e-postadress");
    return false;
  }

  // Validera lösenord
  if (!password || password.length < 6) {
    alert("Lösenordet måste innehålla minst 6 tecken");
    return false;
  }

  return true;
}