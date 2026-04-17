/**
 * Autentiseringshanteringsfil
 * Innehåller funktioner för konto, inloggning och utloggning
 */

import { post, get } from "./api.js";

/**
 * Skapa nytt konto
 * @param {string} name - Användarens namn
 * @param {string} email - E-postadress
 * @param {string} password - Lösenord
 * @returns {Promise} Svar från servern
 */
export async function register(name, email, password) {
  try {
    const response = await post("/auth/register", {
      name,
      email,
      password,
    });

    return response;
  } catch (error) {
    console.error("Fel vid skapande av konto:", error);
    throw error;
  }
}

/**
 * Logga in
 * @param {string} email - E-postadress
 * @param {string} password - Lösenord
 * @returns {Promise} Svar från servern
 */
export async function login(email, password) {
  try {
    const response = await post("/auth/login", {
      email,
      password,
    });

    // Spara token i localStorage om inloggningen lyckades
    if (response.success && response.token) {
      localStorage.setItem("token", response.token);
    }

    return response;
  } catch (error) {
    console.error("Fel vid inloggning:", error);
    throw error;
  }
}

/**
 * Hämta information om aktuell användare
 * @param {string} token - Användarens token
 * @returns {Promise} Användardata
 */
export async function getUserInfo(token) {
  try {
    // Kontrollera först cachen
    const cachedUser = sessionStorage.getItem("user_session");
    if (cachedUser) {
      return JSON.parse(cachedUser);
    }

    // Hämta data från servern
    const response = await get("/user/me", token);

    // Spara data tillfälligt
    if (response) {
      sessionStorage.setItem("user_session", JSON.stringify(response));
    }

    return response;
  } catch (error) {
    console.error("Fel vid hämtning av användarinformation:", error);
    // Om det misslyckas, ta bort token
    localStorage.removeItem("token");
    sessionStorage.removeItem("user_session");
    throw error;
  }
}

/**
 * Logga ut
 */
export function logout() {
  localStorage.removeItem("token");
  sessionStorage.removeItem("user_session");
  window.location.href = "index.html";
}

/**
 * Kontrollera om användaren är inloggad
 * @returns {boolean} true om användaren är inloggad
 */
export function isLoggedIn() {
  return !!localStorage.getItem("token");
}

/**
 * Hämta token
 * @returns {string|null} Token eller null
 */
export function getToken() {
  return localStorage.getItem("token");
}