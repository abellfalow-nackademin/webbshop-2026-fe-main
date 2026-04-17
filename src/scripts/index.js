/**
 * Startsidans skript
 * Hanterar visning av växter, karta och sökning
 */

import { getAllPlants, searchPlants } from "../utils/productsApi.js";

// Globala variabler
let map = null;
let allPlants = [];
let markers = [];

// Initiera sidan när den laddas
document.addEventListener("DOMContentLoaded", initIndexPage);

/**
 * Initiera startsidan
 */
async function initIndexPage() {
  try {
    // Initiera kartan
    initMap();

    // Hämta alla växter
    await loadPlants();

    // Lägg till sökfunktionalitet
    setupSearch();

  } catch (error) {
    console.error("Fel vid initiering av startsidan:", error);
    displayError("Kunde inte ladda sidan. Försök igen senare.");
  }
}

/**
 * Initiera Leaflet-kartan
 */
function initMap() {
  // Skapa karta centrerad på Stockholm
  map = L.map("map").setView([59.3293, 18.0686], 12);

  // Lägg till kartlager (OpenStreetMap)
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  }).addTo(map);
}

/**
 * Hämta och visa alla växter
 */
async function loadPlants(searchTerm = "") {
  try {
    const productsContainer = document.getElementById("products");
    
    if (!productsContainer) {
      console.error("❌ Kunde inte hitta products-container");
      return;
    }

    console.log("🔄 Börjar hämta växter...", searchTerm ? `(Sök: "${searchTerm}")` : "(Alla växter)");

    // Visa laddningsmeddelande
    productsContainer.innerHTML = `<p style="text-align: center; padding: 2rem;">⏳ Laddar växter...</p>`;

    // Rensa befintliga markörer
    clearMarkers();

    // Hämta växter (alla eller filtrerade)
    let plants;
    if (searchTerm) {
      console.log("🔍 Söker efter växter med term:", searchTerm);
      plants = await searchPlants(searchTerm);
    } else {
      console.log("🌱 Hämtar alla växter från API...");
      plants = await getAllPlants();
    }

    console.log("📊 Mottagen data från API:", plants);
    console.log("📊 Data typ:", typeof plants);
    console.log("📊 Är array?", Array.isArray(plants));

    // Spara alla växter för sökning
    if (!searchTerm) {
      if (Array.isArray(plants)) {
        allPlants = plants;
        console.log(`✅ Sparade ${plants.length} växter i minnet`);
      } else {
        console.warn("⚠️ Mottagen data är inte en array:", plants);
        allPlants = Array.isArray(plants) ? plants : [];
      }
    }

    // Visa växter på kartan och i listan
    displayPlants(plants);

  } catch (error) {
    console.error("❌ Fel vid hämtning av växter:", error);
    console.error("❌ Fel detaljer:", error.message);
    console.error("❌ Fel stack:", error.stack);
    
    const productsContainer = document.getElementById("products");
    if (productsContainer) {
      productsContainer.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: #dc3545;">
          <h3>⚠️ Kunde inte hämta växter</h3>
          <p>Det uppstod ett fel vid hämtning av växterna.</p>
          <p style="font-size: 0.9rem; color: #6c757d; margin-top: 1rem;">
            Fel: ${error.message}
          </p>
          <button onclick="location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background: var(--color-primary); color: white; border: none; border-radius: 8px; cursor: pointer;">
            🔄 Ladda om sidan
          </button>
        </div>
      `;
    }
  }
}

/**
 * Visa växter på kartan och i listan
 * @param {Array} plants - Lista över växter
 */
function displayPlants(plants) {
  const productsContainer = document.getElementById("products");
  
  if (!Array.isArray(plants) || plants.length === 0) {
    productsContainer.innerHTML = `
      <p>
        ${plants.length === 0 ? "Inga växter hittades." : "Laddar växter..."}
      </p>
    `;
    return;
  }

  // Rensa container
  productsContainer.innerHTML = "";

  let bounds = [];

  // Visa varje växt
  plants.forEach((plant) => {
    // Skapa växtkort
    const plantCard = createPlantCard(plant);
    productsContainer.appendChild(plantCard);

    // Lägg till markör på kartan om växten har koordinater
    if (plant.location && plant.location.coordinates && Array.isArray(plant.location.coordinates)) {
      addMarkerToMap(plant);
      // GeoJSON format: [longitude, latitude]
      const longitude = plant.location.coordinates[0];
      const latitude = plant.location.coordinates[1];
      bounds.push([latitude, longitude]);
    }
  });

  // Anpassa kartvyn så att alla markörer syns
  if (bounds.length > 0 && map) {
    map.fitBounds(bounds, { padding: [50, 50] });
  }
}

/**
 * Skapa HTML för ett växtkort
 * @param {object} plant - Växtdata
 * @returns {HTMLElement} Växtkortselement
 */
function createPlantCard(plant) {
  const card = document.createElement("div");
  card.className = "product-card";
  card.setAttribute("data-plant-id", plant._id );



  // Hantera olika fältnamn från API
  const plantName = plant.plantName || plant.name || "Namnlös växt";
  const description = plant.description || "Ingen beskrivning tillgänglig.";
  const imageUrl = plant.imageUrl || plant.image || "https://via.placeholder.com/400?text=Ingen+bild";
  const lightLevel = plant.lightLevel || "Ej angiven";
  const location = plant.location || "Plats ej angiven";
  const status = plant.status || "unknown";

  card.innerHTML = `
    <div class="product-card__image-placeholder">
      ${imageUrl && imageUrl !== "test2" 
        ? `<img src="${imageUrl}" alt="${plantName}" class="product-card__image" />`
        : "🌱"
      }
    </div>
    <div class="product-card__body">
      <div class="product-card__info">
        <h3>${plantName}</h3>
        <p class="product-card__status" style="font-size: 0.85rem; margin-top: 0.5rem; color: ${status === 'available' ? '#28a745' : '#6c757d'};">
          Status: ${status === 'available' ? '✅ Tillgänglig' : '❌ Inte tillgänglig'}
        </p>
      </div>
      <div class="product-card__buttons">
        <button class="send-request-btn" onclick="sendExchangeRequest('${plant._id || plant.id}')" ${status !== 'available' ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>
          Byt växt
        </button>
        <button class="show-on-map-btn" onclick="showOnMap('${plant._id}')">
          Visa på karta
        </button>
      </div>
    </div>
  `;

  return card;
}

/**
 * Lägg till markör på kartan
 * @param {object} plant - Växtdata
 */
function addMarkerToMap(plant) {
  if (!map) {
    return;
  }

  // Hämta koordinater från location.coordinates [longitude, latitude]
  let latitude = null;
  let longitude = null;
  
  if (plant.location && plant.location.coordinates && Array.isArray(plant.location.coordinates)) {
    // GeoJSON format: [longitude, latitude]
    longitude = plant.location.coordinates[0];
    latitude = plant.location.coordinates[1];
  }

  if (!latitude || !longitude) {
    return;
  }

  const marker = L.marker([latitude, longitude]).addTo(map);

  // Spara växt-ID i markören för att kunna identifiera den senare
  marker.plantId = plant._id || plant.id;

  // Skapa popup-innehåll med rätt fältnamn
  const plantName = plant.plantName || plant.name || "Namnlös växt";
  const description = plant.description || "Ingen beskrivning";
  const imageUrl = plant.imageUrl || plant.image || "";

  const popupContent = `
    <div class="marker-popup">
      <h4>${plantName}</h4>
      <p>${description}</p>
      ${imageUrl && imageUrl !== "test2" ? `<img src="${imageUrl}" alt="${plantName}" style="max-width: 150px; border-radius: 8px;" />` : ""}
      <button onclick="showPlantDetails('${plant._id || plant.id}')" style="margin-top: 8px; padding: 4px 8px; background: #2d5a3d; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Se detaljer
      </button>
    </div>
  `;

  marker.bindPopup(popupContent);
  markers.push(marker);
}

/**
 * Rensa alla markörer från kartan
 */
function clearMarkers() {
  markers.forEach((marker) => {
    map.removeLayer(marker);
  });
  markers = [];
}

/**
 * Konfigurera sökfunktionen
 */
function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const searchButton = document.getElementById("search-button");

  if (searchInput) {
    // Sök när användaren skriver (debounce)
    let timeout;
    searchInput.addEventListener("input", (e) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        handleSearch(e.target.value);
      }, 300);
    });

    // Sök när man trycker på Enter
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        handleSearch(e.target.value);
      }
    });
  }

  if (searchButton) {
    searchButton.addEventListener("click", () => {
      if (searchInput) {
        handleSearch(searchInput.value);
      }
    });
  }
}

/**
 * Hantera sökning
 * @param {string} searchTerm - Sökterm
 */
async function handleSearch(searchTerm) {
  try {
    await loadPlants(searchTerm);
  } catch (error) {
    console.error("Fel vid sökning:", error);
    displayError("Kunde inte söka. Försök igen.");
  }
}

/**
 * Visa specifik växt på kartan
 * @param {string} plantId - Växtens ID
 */
function showOnMap(plantId) {
  const plant = findPlantById(plantId);
  
  if (!plant) {
    alert("Kunde inte hitta växten.");
    return;
  }

  // Hämta koordinater från location.coordinates [longitude, latitude]
  let latitude = null;
  let longitude = null;
  
  if (plant.location && plant.location.coordinates && Array.isArray(plant.location.coordinates)) {
    // GeoJSON format: [longitude, latitude]
    longitude = plant.location.coordinates[0];
    latitude = plant.location.coordinates[1];
  }

  if (latitude && longitude && map) {
    map.setView([latitude, longitude], 16);
    
    // Hitta och öppna motsvarande markör (endast den som matchar plantId)
    const targetMarker = markers.find((marker) => marker.plantId === plantId);
    
    if (targetMarker) {
      targetMarker.openPopup();
    } else {
      console.warn(`Kunde inte hitta markör för växt ${plantId}`);
    }
  } else {
    alert("Kunde inte hitta växtens plats på kartan.");
  }
}

/**
 * Skicka bytesförfrågan
 * @param {string} plantId - Växtens ID
 */
function sendExchangeRequest(plantId) {
  const plant = findPlantById(plantId);
  
  if (!plant) {
    alert("Kunde inte hitta växten.");
    return;
  }

  const plantName = plant.plantName || plant.name || "Växt";
  // TODO: Implementera bytesförfrågan (kommer senare)
  alert(`Bytesförfrågan för "${plantName}" kommer snart!`);
}

/**
 * Visa växtdetaljer
 * @param {string} plantId - Växtens ID
 */
function showPlantDetails(plantId) {
  const plant = findPlantById(plantId);
  
  if (!plant) {
    alert("Kunde inte hitta växten.");
    return;
  }

  const plantName = plant.plantName || plant.name || "Växt";
  // TODO: Implementera detaljsida
  alert(`Detaljer för "${plantName}" kommer snart!`);
}

/**
 * Hitta växt med ID
 * @param {string} plantId - Växtens ID
 * @returns {object|null} Växt eller null
 */
function findPlantById(plantId) {
  return allPlants.find(
    (plant) => plant._id === plantId || plant.id === plantId
  );
}

/**
 * Visa felmeddelande
 * @param {string} message - Felmeddelande
 */
function displayError(message) {
  const productsContainer = document.getElementById("products");
  if (productsContainer) {
    productsContainer.innerHTML = `
      <p style="color: #dc3545; text-align: center; padding: 2rem;">
        ⚠️ ${message}
      </p>
    `;
  }
}

// Gör funktioner tillgängliga globalt för onclick-händelser
window.showOnMap = showOnMap;
window.sendExchangeRequest = sendExchangeRequest;
window.showPlantDetails = showPlantDetails;