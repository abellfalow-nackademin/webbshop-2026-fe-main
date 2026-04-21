/**
 * Skript för växtdetalj-sida
 * Hanterar visning av växtdetaljer och bytesförfrågningar
 */

import { getPlantById, getUserPlants, createTrade } from "../utils/productsApi.js";
import { isLoggedIn, getToken } from "../utils/auth.js";

// Globala variabler
let map = null;
let plantDetails = null;
let userPlants = [];
let selectedPlantId = null;

// Initiera sidan när den laddas
document.addEventListener("DOMContentLoaded", initPlantDetailsPage);

/**
 * Initiera växtdetalj-sidan
 */
async function initPlantDetailsPage() {
  try {
    // Hämta växt-ID från URL
    const urlParams = new URLSearchParams(window.location.search);
    const plantId = urlParams.get("id");
    console.log(plantId)

    if (!plantId) {
      showError("Inget växt-ID angivet.");
      return;
    }

    // Hämta växtdetaljer
    await loadPlantDetails(plantId);

    // Initiera kartan om växten har koordinater
    if (plantDetails.location && plantDetails.location.coordinates) {
      initMap();
    }

    // Om användaren är inloggad, ladda deras växter för bytesförfrågan
    if (isLoggedIn()) {
      await loadUserPlantsForExchange();
      setupExchangeSection();
    } else {
      // Dölj bytesförfrågan-sektionen om användaren inte är inloggad
      const exchangeSection = document.getElementById("exchange-section");
      if (exchangeSection) {
        exchangeSection.style.display = "none";
      }
    }

  } catch (error) {
    console.error("Fel vid initiering av växtdetalj-sidan:", error);
    showError("Kunde inte ladda sidan. Försök igen senare.");
  }
}

/**
 * Hämta och visa växtdetaljer
 * @param {string} plantId - Växtens ID
 */
async function loadPlantDetails(plantId) {
  try {
    console.log("🔄 Hämtar växtdetaljer för ID:", plantId);

    let data = await getPlantById(plantId);
    plantDetails = data.plant;

    if (!plantDetails) {
      throw new Error("Kunde inte hitta växten");
    }

    console.log("✅ Växtdetaljer hämtade:", plantDetails);

    // Visa växtdetaljer
    showPlantDetails(plantDetails);

  } catch (error) {
    console.error("❌ Fel vid hämtning av växtdetaljer:", error);
    throw error;
  }
}

/**
 * Visa växtdetaljer på sidan
 * @param {object} plant - Växtdata
 */
function showPlantDetails(plant) {
  // Dölj laddningsskärm
  const loadingScreen = document.getElementById("loading");
  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }

  // Visa växtdetaljer
  const detailsContainer = document.getElementById("plant-details");
  if (detailsContainer) {
    detailsContainer.style.display = "block";
  }

  // Fyll i växtinformation
  const plantName = plant.plantName || plant.name || "Namnlös växt";
  const description = plant.description || "Ingen beskrivning";
  const imageUrl = plant.imageUrl || plant.image || "https://via.placeholder.com/600?text=Ingen+bild";
  const lightLevel = plant.lightLevel || "Ej angiven";
  const status = plant.status || "unknown";

  // Uppdatera element
  document.getElementById("plant-name").textContent = plantName;
  document.getElementById("plant-desc").textContent = description;
  document.getElementById("plant-image").src = imageUrl;
  document.getElementById("plant-light").textContent = lightLevel;

  // Uppdatera status
  const statusElement = document.getElementById("plant-status");
  statusElement.textContent = status === 'available' ? '✅ Tillgänglig' : '❌ Inte tillgänglig';
  statusElement.className = `status-badge ${status === 'available' ? 'status-available' : 'status-unavailable'}`;

  // Uppdatera plats
  const locationElement = document.getElementById("plant-location");
  if (plant.location && plant.location.coordinates && Array.isArray(plant.location.coordinates)) {
    const longitude = plant.location.coordinates[0];
    const latitude = plant.location.coordinates[1];
    locationElement.textContent = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
  } else {
    locationElement.textContent = "Plats ej angiven";
  }

  // Dölj bytesförfrågan-sektion om växten inte är tillgänglig
  if (status !== 'available') {
    const exchangeSection = document.getElementById("exchange-section");
    if (exchangeSection) {
      exchangeSection.style.display = "none";
    }
  }
}

/**
 * Initialisera kartan
 */
function initMap() {
  if (!plantDetails.location || !plantDetails.location.coordinates) {
    return;
  }

  const longitude = plantDetails.location.coordinates[0];
  const latitude = plantDetails.location.coordinates[1];

  // Skapa karta centrerad på växtens plats
  map = L.map("map").setView([latitude, longitude], 14);

  // Styla Marker
  var greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  // Lägg till kartlager (OpenStreetMap)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);

  // Lägg till markör
  const marker = L.marker([latitude, longitude], {icon: greenIcon}).addTo(map);

  const plantName = plantDetails.plantName || plantDetails.name || "Växt";
  console.log(plantDetails.description);
  marker.bindPopup(`
    <div class="marker-popup">
    <img src="${plantDetails.imageUrl}" alt="${plantName}" style="max-width: 150px; border-radius: 8px;" />
    <h4>${plantName}</h4>
    <p>${plantDetails.description}</p>
    </div
    `);
}

/**
 * Hämta användarens växter för bytesförfrågan
 */
async function loadUserPlantsForExchange() {
  try {
    console.log("🔄 Hämtar användarens växter för bytesförfrågan...");

    const userPlantsContainer = document.getElementById("user-plants-select");

    if (!userPlantsContainer) {
      console.error("Kunde inte hitta user-plants-select container");
      return;
    }

    userPlantsContainer.innerHTML = `<p style="text-align: center; padding: 1rem;">⏳ Laddar dina växter...</p>`;

    userPlants = await getUserPlants();

    console.log(`✅ Hittade ${userPlants.length} växter för bytesförfrågan`);

    // Filtrera bort växter som inte är tillgängliga
    const availablePlants = userPlants.filter(plant => plant.status === 'available');

    if (availablePlants.length === 0) {
      userPlantsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; background: #f8f9fa; border-radius: 8px;">
          <p style="font-size: 1.5rem; margin-bottom: 1rem;">🌱</p>
          <p>Du har inga tillgängliga växter att byta med.</p>
          <p style="color: var(--color-text-muted); font-size: 0.9rem; margin-top: 0.5rem;">
            Lägg till en växt på din profil och markera den som tillgänglig.
          </p>
        </div>
      `;
      return;
    }

    // Visa användarens växter
    userPlantsContainer.innerHTML = "";

    availablePlants.forEach((plant) => {
      const plantCard = createExchangePlantCard(plant);
      userPlantsContainer.appendChild(plantCard);
    });

  } catch (error) {
    console.error("❌ Fel vid hämtning av användarens växter:", error);
    const userPlantsContainer = document.getElementById("user-plants-select");
    if (userPlantsContainer) {
      userPlantsContainer.innerHTML = `
        <div style="text-align: center; padding: 1rem; color: #dc3545;">
          <p>Kunde inte ladda dina växter. Försök igen.</p>
        </div>
      `;
    }
  }
}

/**
 * Skapa HTML för ett växtkort i bytesförfrågan
 * @param {object} plant - Växtdata
 * @returns {HTMLElement} Växtkortselement
 */
function createExchangePlantCard(plant) {
  const card = document.createElement("div");
  card.className = "exchange-plant-card";
  card.setAttribute("data-plant-id", plant._id);

  const plantName = plant.plantName || plant.name || "Namnlös växt";
  const imageUrl = plant.imageUrl || plant.image || "";

  card.innerHTML = `
    <input type="radio" name="exchange-plant" value="${plant._id}" id="plant-${plant._id}">
    <label for="plant-${plant._id}" class="exchange-plant-label">
      <div class="exchange-plant-image">
        ${imageUrl && imageUrl !== "test2" 
          ? `<img src="${imageUrl}" alt="${plantName}" />`
          : '<div class="exchange-plant-placeholder">🌱</div>'
        }
      </div>
      <div class="exchange-plant-info">
        <h4>${plantName}</h4>
        <span class="exchange-plant-status">✅ Tillgänglig</span>
      </div>
    </label>
  `;

  return card;
}

/**
 * Konfigurera bytesförfrågan-sektion
 */
function setupExchangeSection() {
  const sendRequestBtn = document.getElementById("send-request-btn");
  const plantRadios = document.querySelectorAll('input[name="exchange-plant"]');

  if (!sendRequestBtn) {
    return;
  }

  // Uppdatera vald växt när användaren klickar på en radio-knapp
  plantRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      selectedPlantId = e.target.value;
      sendRequestBtn.disabled = false;
    });
  });

  // Skicka bytesförfrågan
  sendRequestBtn.addEventListener('click', handleSendExchangeRequest);
}

/**
 * Hantera skickande av bytesförfrågan (trade)
 */
async function handleSendExchangeRequest() {
  if (!selectedPlantId) {
    alert("Vänligen välj en växt att byta med.");
    return;
  }

  if (!plantDetails || !plantDetails._id) {
    alert("Kunde inte hitta växten.");
    return;
  }

  try {
    const confirmMessage = `Är du säker på att du vill skicka en bytesförfrågan?\n\n` +
      `Du byter: ${userPlants.find(p => p._id === selectedPlantId)?.plantName || 'Din växt'}\n` +
      `Mot: ${plantDetails.plantName || plantDetails.name || 'Växten'}`;

    if (!confirm(confirmMessage)) {
      return;
    }

    const sendRequestBtn = document.getElementById("send-request-btn");
    const originalText = sendRequestBtn.textContent;
    sendRequestBtn.disabled = true;
    sendRequestBtn.textContent = "Skickar...";

    // ownerPlantId = växten man vill byta till (den som visas på sidan)
    // requesterPlantId = egen växt att byta bort
    await createTrade(plantDetails._id, selectedPlantId);

    alert("✅ Bytesförfrågan har skickats!");

    // Omdirigera till profilsidan för att se förfrågan
    window.location.href = "profile.html";

  } catch (error) {
    console.error("Fel vid skickande av bytesförfrågan:", error);
    alert(`Kunde inte skicka bytesförfrågan: ${error.message}`);
  } finally {
    const sendRequestBtn = document.getElementById("send-request-btn");
    if (sendRequestBtn) {
      sendRequestBtn.disabled = false;
      sendRequestBtn.textContent = "📤 Skicka bytesförfrågan";
    }
  }
}

/**
 * Visa felmeddelande
 * @param {string} message - Felmeddelande
 */
function showError(message) {
  const loadingScreen = document.getElementById("loading");
  if (loadingScreen) {
    loadingScreen.style.display = "none";
  }

  const errorScreen = document.getElementById("error");
  if (errorScreen) {
    errorScreen.style.display = "block";
  }

  const errorMessage = document.getElementById("error-message");
  if (errorMessage) {
    errorMessage.textContent = message;
  }
}