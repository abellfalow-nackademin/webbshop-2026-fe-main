/**
 * Hantering av växt-API
 * Innehåller funktioner för att hämta och hantera växter
 */

import { get } from "./api.js";
import { getToken } from "./auth.js";

// Backend bas-URL
const API_BASE_URL = "https://plot-twist-neon.vercel.app/api";

/**
 * Hämta alla växter
 * @returns {Promise} Lista över alla växter
 */
export async function getAllPlants() {
  try {
    const response = await get("/plants");
    console.log("API Response:", response);
    
    // Kontrollera om svaret innehåller en 'plants'-array
    if (response && response.plants && Array.isArray(response.plants)) {
      return response.plants;
    }
    
    // Om svaret direkt är en array
    if (Array.isArray(response)) {
      return response;
    }
    
    // Om inget av ovanstående, returnera tom array
    console.warn("⚠️ Oväntat svar från API:", response);
    return [];
  } catch (error) {
    console.error("Fel vid hämtning av växter:", error);
    throw error;
  }
}

/**
 * Hämta växt med specifikt ID
 * @param {string} plantId - Växtens ID
 * @returns {Promise} Växtdata
 */
export async function getPlantById(plantId) {
  try {
    const response = await get(`/plants/${plantId}`);
    return response;
  } catch (error) {
    console.error(`Fel vid hämtning av växt med ID ${plantId}:`, error);
    throw error;
  }
}

/**
 * Sök efter växter baserat på namn
 * @param {string} searchTerm - Sökterm
 * @returns {Promise} Lista över matchande växter
 */
export async function searchPlants(searchTerm) {
  try {
    const plants = await getAllPlants();
    
    if (!Array.isArray(plants)) {
      return [];
    }

    // Filtrera växter baserat på sökterm
    const filteredPlants = plants.filter(plant => {
      // Hantera både plantName och name
      const plantName = plant.plantName || plant.name || "";
      const description = plant.description || "";
      
      const nameMatch = plantName.toLowerCase().includes(searchTerm.toLowerCase());
      const descriptionMatch = description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return nameMatch || descriptionMatch;
    });

    return filteredPlants;
  } catch (error) {
    console.error("Fel vid sökning efter växter:", error);
    throw error;
  }
}

/**
 * Hämta användarens växter
 * @returns {Promise} Lista över användarens växter
 */
export async function getUserPlants() {
  try {
    const token = getToken();
    if (!token) {
      return [];
    }

    const response = await get("/plants/my-plants", token);
    
    // Kontrollera om svaret innehåller en 'plants'-array
    if (response && response.plants && Array.isArray(response.plants)) {
      return response.plants;
    }
    
    // Om svaret direkt är en array
    if (Array.isArray(response)) {
      return response;
    }
    
    return [];
  } catch (error) {
    console.error("Fel vid hämtning av användarens växter:", error);
    throw error;
  }
}

/**
 * Skapa ny växt (kräver inloggning)
 * @param {object} plantData - Växtdata
 * @returns {Promise} Skapad växt
 */
export async function createPlant(plantData) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Du måste vara inloggad för att skapa en växt");
    }

    const response = await fetch(`${API_BASE_URL}/plants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(plantData),
    });

    return response.json();
  } catch (error) {
    console.error("Fel vid skapande av växt:", error);
    throw error;
  }
}

/**
 * Uppdatera växt (kräver inloggning)
 * @param {string} plantId - Växtens ID
 * @param {object} plantData - Uppdaterad växtdata
 * @returns {Promise} Uppdaterad växt
 */
export async function updatePlant(plantId, plantData) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Du måste vara inloggad för att uppdatera en växt");
    }

    // Använd PUT för uppdatering
    const response = await fetch(`${API_BASE_URL}/plants/${plantId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(plantData),
    });

    return response.json();
  } catch (error) {
    console.error("Fel vid uppdatering av växt:", error);
    throw error;
  }
}

/**
 * Ta bort växt (kräver inloggning)
 * @param {string} plantId - Växtens ID
 * @returns {Promise} Svarsmeddelande
 */
export async function deletePlant(plantId) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Du måste vara inloggad för att ta bort en växt");
    }

    // Använd DELETE för borttagning
    const response = await fetch(`${API_BASE_URL}/plants/${plantId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    return response.json();
  } catch (error) {
    console.error("Fel vid borttagning av växt:", error);
    throw error;
  }
}

/**
 * Hämta användarens information
 * @returns {Promise} Användardata
 */
export async function getUserInfo() {
  try {
    const token = getToken();
    if (!token) {
      return null;
    }

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
    throw error;
  }
}