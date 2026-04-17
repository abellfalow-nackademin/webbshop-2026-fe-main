/**
 * Profilsidans skript
 * Hanterar visning av användarinformation och användarens växter
 */

import { getUserInfo, getUserPlants, createPlant, updatePlant, deletePlant } from "../utils/productsApi.js";
import { logout, isLoggedIn } from "../utils/auth.js";

// Globala variabler
let userInfo = null;
let userPlants = [];
let editingPlantId = null;
let map = null;
let marker = null;
let selectedLatitude = null;
let selectedLongitude = null;

// Initiera sidan när den laddas
document.addEventListener("DOMContentLoaded", initProfilePage);

/**
 * Initiera profilsidan
 */
async function initProfilePage() {
  try {
    // Kontrollera om användaren är inloggad
    if (!isLoggedIn()) {
      alert("Du måste vara inloggad för att se din profil.");
      window.location.href = "login.html";
      return;
    }

    // Hämta användarinformation
    await loadUserInfo();

    // Hämta användarens växter
    await loadUserPlants();

    // Konfigurera formulär för att skapa/uppdatera växt
    setupPlantForm();

    // Initialisera kartan
    initLocationMap();

    // Konfigurera logga ut-knapp
    setupLogout();

  } catch (error) {
    console.error("Fel vid initiering av profilsidan:", error);
    displayError("Kunde inte ladda profilen. Försök igen senare.");
  }
}

/**
 * Hämta och visa användarinformation
 */
async function loadUserInfo() {
  try {
    console.log("🔄 Hämtar användarinformation...");
    
    userInfo = await getUserInfo();
    
    if (!userInfo) {
      throw new Error("Kunde inte hämta användarinformation");
    }

    console.log("✅ Användarinformation hämtad:", userInfo);
    displayUserInfo(userInfo);

  } catch (error) {
    console.error("❌ Fel vid hämtning av användarinformation:", error);
    displayError("Kunde inte hämta användarinformation.");
  }
}

/**
 * Visa användarinformation på sidan
 * @param {object} user - Användardata
 */
function displayUserInfo(user) {
  const userInfoContainer = document.getElementById("user-info");
  console.log("User data:", user);
  
  if (!userInfoContainer) {
    console.error("Kunde inte hitta user-info-container");
    return;
  }

  // Hantera olika strukturer för användardata
  const userData = user.user || user;
  const userName = userData.name || userData.username || "Användare";
  const userEmail = userData.email || "Ej angiven";

  userInfoContainer.innerHTML = `
    <div class="user-info-card">
      <div class="user-avatar">
        👤
      </div>
      <h2>${userName}</h2>
      <p class="user-email">${userEmail}</p>
      <div class="user-stats">
        <div class="stat-item">
          <span class="stat-number">${userPlants.length}</span>
          <span class="stat-label">Växter</span>
        </div>
      </div>
    </div>
  `;
}

/**
 * Hämta och visa användarens växter
 */
async function loadUserPlants() {
  try {
    console.log("🔄 Hämtar användarens växter...");
    
    const plantsContainer = document.getElementById("user-plants");
    
    if (!plantsContainer) {
      console.error("Kunde inte hitta user-plants-container");
      return;
    }

    plantsContainer.innerHTML = `<p style="text-align: center; padding: 2rem;">⏳ Laddar växter...</p>`;

    userPlants = await getUserPlants();
    
    console.log(`✅ Hittade ${userPlants.length} växter`);
    console.log("Växter:", userPlants);
    displayUserPlants(userPlants);

    // Uppdatera statistik
    if (userInfo) {
      displayUserInfo(userInfo);
    }

  } catch (error) {
    console.error("❌ Fel vid hämtning av användarens växter:", error);
    
    const plantsContainer = document.getElementById("user-plants");
    if (plantsContainer) {
      plantsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #dc3545;">
          <h3>⚠️ Kunde inte hämta växter</h3>
          <p>Det uppstod ett fel vid hämtning av dina växter.</p>
        </div>
      `;
    }
  }
}

/**
 * Visa användarens växter
 * @param {Array} plants - Lista över växter
 */
function displayUserPlants(plants) {
  const plantsContainer = document.getElementById("user-plants");
  
  if (!Array.isArray(plants) || plants.length === 0) {
    plantsContainer.innerHTML = `
      <div style="text-align: center; padding: 3rem 2rem;">
        <p style="font-size: 2rem; margin-bottom: 1rem;">🌱</p>
        <p>Du har inga växter än.</p>
        <p style="color: var(--color-text-muted);">Lägg till din första växt nedan!</p>
      </div>
    `;
    return;
  }

  plantsContainer.innerHTML = "";

  plants.forEach((plant) => {
    const plantCard = createUserPlantCard(plant);
    plantsContainer.appendChild(plantCard);
  });
}

/**
 * Skapa HTML för ett växtkort i profilen
 * @param {object} plant - Växtdata
 * @returns {HTMLElement} Växtkortselement
 */
function createUserPlantCard(plant) {
  const card = document.createElement("div");
  card.className = "plant-card";
  card.setAttribute("data-plant-id", plant._id);

  const plantName = plant.plantName || plant.name || "Namnlös växt";
  const description = plant.description || "Ingen beskrivning";
  const imageUrl = plant.imageUrl || plant.image || "";
  const status = plant.status || "unknown";

  // Hämta koordinater från location.coordinates [longitude, latitude]
  let latitude = "";
  let longitude = "";
  if (plant.location && plant.location.coordinates && Array.isArray(plant.location.coordinates)) {
    // GeoJSON format: [longitude, latitude]
    longitude = plant.location.coordinates[0];
    latitude = plant.location.coordinates[1];
  }

  card.innerHTML = `
    <div class="plant-card__image">
      ${imageUrl && imageUrl !== "test2" 
        ? `<img src="${imageUrl}" alt="${plantName}" />`
        : '<div class="plant-card__placeholder">🌱</div>'
      }
    </div>
    <div class="plant-card__content">
      <h3>${plantName}</h3>
      <p class="plant-card__description">${description}</p>
      <div class="plant-card__meta">
        <span class="status-badge ${status === 'available' ? 'status-available' : 'status-unavailable'}">
          ${status === 'available' ? '✅ Tillgänglig' : '❌ Inte tillgänglig'}
        </span>
        ${latitude && longitude ? `<span class="location-badge">📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</span>` : ''}
      </div>
      <div class="plant-card__actions">
        <button class="btn-edit" onclick="editPlant('${plant._id}')">
          ✏️ Redigera
        </button>
        <button class="btn-delete" onclick="deletePlantById('${plant._id}')">
          🗑️ Ta bort
        </button>
      </div>
    </div>
  `;

  return card;
}

/**
 * Konfigurera formulär för att skapa/uppdatera växt
 */
function setupPlantForm() {
  const form = document.getElementById("plant-form");
  
  if (!form) {
    console.error("Kunde inte hitta plant-form");
    return;
  }

  form.addEventListener("submit", handlePlantFormSubmit);

  // Lägg till event listener för avbryt-knappen
  const cancelButton = document.getElementById("cancel-edit-btn");
  if (cancelButton) {
    cancelButton.addEventListener("click", cancelEdit);
  }
}

/**
 * Hantera skickande av växtformuläret
 * @param {Event} event - Skicka-händelsen
 */
async function handlePlantFormSubmit(event) {
  event.preventDefault();

  try {
    const plantName = document.getElementById("plant-name").value.trim();
    const description = document.getElementById("plant-description").value.trim();
    const imageUrl = document.getElementById("plant-image-url").value.trim();
    const status = document.getElementById("plant-status").value;
    const latitude = parseFloat(document.getElementById("plant-latitude").value);
    const longitude = parseFloat(document.getElementById("plant-longitude").value);

    // Validera data
    if (!plantName || !description) {
      alert("Vänligen fyll i namn och beskrivning.");
      return;
    }

    if (isNaN(latitude) || isNaN(longitude)) {
      alert("Vänligen välj en plats på kartan.");
      return;
    }

    const plantData = {
      plantName,
      description,
      imageUrl: imageUrl || "https://via.placeholder.com/400?text=Ingen+bild",
      status,
      location: {
        type: "Point",
        coordinates: [longitude, latitude]
      }
    };

    const submitButton = document.querySelector('#plant-form button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = editingPlantId ? "Uppdaterar..." : "Skapar...";

    if (editingPlantId) {
      // Uppdatera befintlig växt
      await updatePlant(editingPlantId, plantData);
      alert("Växten har uppdaterats!");
    } else {
      // Skapa ny växt
      await createPlant(plantData);
      alert("Växten har skapats!");
    }

    // Återställ formuläret och ladda om växter
    resetForm();
    await loadUserPlants();

  } catch (error) {
    console.error("Fel vid hantering av växtformuläret:", error);
    alert(editingPlantId ? "Kunde inte uppdatera växten." : "Kunde inte skapa växten.");
  } finally {
    const submitButton = document.querySelector('#plant-form button[type="submit"]');
    submitButton.disabled = false;
    submitButton.textContent = editingPlantId ? "Uppdatera växt" : "Lägg till växt";
  }
}

/**
 * Redigera växt
 * @param {string} plantId - Växtens ID
 */
function editPlant(plantId) {
  const plant = userPlants.find(p => p._id === plantId);
  
  if (!plant) {
    alert("Kunde inte hitta växten.");
    return;
  }

  // Fyll i formuläret med växtens data
  document.getElementById("plant-name").value = plant.plantName || plant.name || "";
  document.getElementById("plant-description").value = plant.description || "";
  document.getElementById("plant-image-url").value = plant.imageUrl || plant.image || "";
  document.getElementById("plant-status").value = plant.status || "available";

  // Sätt redigeringsläge
  editingPlantId = plantId;

  // Om växten har en plats, visa den på kartan
  if (plant.location && plant.location.coordinates && Array.isArray(plant.location.coordinates)) {
    const longitude = plant.location.coordinates[0];
    const latitude = plant.location.coordinates[1];
    
    // Uppdatera dolda fält
    document.getElementById("plant-latitude").value = latitude;
    document.getElementById("plant-longitude").value = longitude;
    
    // Ta bort gammal markör om det finns en
    if (marker) {
      map.removeLayer(marker);
    }
    
    // Centrera kartan på växtens plats
    map.setView([latitude, longitude], 14);
    
    // Lägg till markör på växtens plats
    marker = L.marker([latitude, longitude]).addTo(map);
    
    // Spara koordinater
    selectedLatitude = latitude;
    selectedLongitude = longitude;
    
    console.log(`📍 Redigerar växt på plats: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
  }

  // Uppdatera formulärets utseende
  const formTitle = document.getElementById("form-title");
  const submitButton = document.querySelector('#plant-form button[type="submit"]');
  const cancelButton = document.getElementById("cancel-edit-btn");

  if (formTitle) formTitle.textContent = "Uppdatera växt";
  submitButton.textContent = "Uppdatera växt";
  cancelButton.style.display = "inline-block";

  // Scrolla till formuläret
  document.getElementById("plant-form").scrollIntoView({ behavior: "smooth" });
}

/**
 * Avbryt redigering
 */
function cancelEdit() {
  resetForm();
}

/**
 * Återställ formuläret
 */
function resetForm() {
  document.getElementById("plant-form").reset();
  editingPlantId = null;

  const formTitle = document.getElementById("form-title");
  const submitButton = document.querySelector('#plant-form button[type="submit"]');
  const cancelButton = document.getElementById("cancel-edit-btn");

  if (formTitle) formTitle.textContent = "Lägg till ny växt";
  submitButton.textContent = "Lägg till växt";
  cancelButton.style.display = "none";

  // Återställ kartan
  if (marker) {
    map.removeLayer(marker);
    marker = null;
  }
  
  // Återställ koordinater
  selectedLatitude = null;
  selectedLongitude = null;
  
  // Återställ dolda fält
  document.getElementById("plant-latitude").value = "";
  document.getElementById("plant-longitude").value = "";
  
  // Återställ kartvyn till Stockholm
  map.setView([59.3293, 18.0686], 12);
  
  console.log("🔄 Kartan och formuläret har återställts");
}

/**
 * Ta bort växt
 * @param {string} plantId - Växtens ID
 */
async function deletePlantById(plantId) {
  const plant = userPlants.find(p => p._id === plantId);
  
  if (!plant) {
    alert("Kunde inte hitta växten.");
    return;
  }

  const plantName = plant.plantName || plant.name || "Växt";

  if (!confirm(`Är du säker på att du vill ta bort "${plantName}"?`)) {
    return;
  }

  try {
    await deletePlant(plantId);
    alert("Växten har tagits bort!");
    
    // Ta bort från lokala data
    userPlants = userPlants.filter(p => p._id !== plantId);
    
    // Uppdatera visning
    displayUserPlants(userPlants);
    
    // Uppdatera statistik
    if (userInfo) {
      displayUserInfo(userInfo);
    }

  } catch (error) {
    console.error("Fel vid borttagning av växt:", error);
    alert("Kunde inte ta bort växten.");
  }
}

/**
 * Konfigurera logga ut-knapp
 */
function setupLogout() {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      if (confirm("Är du säker på att du vill logga ut?")) {
        logout();
      }
    });
  }
}

/**
 * Initialisera platskartan för växt
 */
function initLocationMap() {
  const mapContainer = document.getElementById("location-map");
  
  if (!mapContainer) {
    console.error("Kunde inte hitta location-map container");
    return;
  }

  // Skapa kartan centrerad på Stockholm
  map = L.map("location-map").setView([59.3293, 18.0686], 12);

  // Lägg till kartlager (OpenStreetMap)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map);

  // Lägg till klickhändelse på kartan
  map.on("click", function(e) {
    const { lat, lng } = e.latlng;
    
    // Ta bort gammal markör om det finns en
    if (marker) {
      map.removeLayer(marker);
    }
    
    // Lägg till ny markör
    marker = L.marker([lat, lng]).addTo(map);
    
    // Spara koordinater
    selectedLatitude = lat;
    selectedLongitude = lng;
    
    // Uppdatera dolda fält
    document.getElementById("plant-latitude").value = lat;
    document.getElementById("plant-longitude").value = lng;
    
    console.log(`📍 Plats vald: ${lat.toFixed(6)}, ${lng.toFixed(6)}`);
  });
}

/**
 * Visa felmeddelande
 * @param {string} message - Felmeddelande
 */
function displayError(message) {
  const main = document.querySelector("main");
  if (main) {
    main.innerHTML = `
      <div style="text-align: center; padding: 3rem 2rem; color: #dc3545;">
        <h2>⚠️ ${message}</h2>
        <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
          🔄 Ladda om sidan
        </button>
      </div>
    `;
  }
}

// Gör funktioner tillgängliga globalt för onclick-händelser
window.editPlant = editPlant;
window.deletePlantById = deletePlantById;
window.cancelEdit = cancelEdit;