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

/**
 * Skapa bytesförfrågan (trade)
 * @param {string} ownerPlantId - ID på växten man vill byta till (ägarens växt)
 * @param {string} requesterPlantId - ID på egen växt att byta bort
 * @returns {Promise} Skapad trade
 */
export async function createTrade(ownerPlantId, requesterPlantId) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Du måste vara inloggad för att skicka en bytesförfrågan");
    }

    const response = await fetch(`${API_BASE_URL}/trades`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ownerPlantId,
        requesterPlantId
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Kunde inte skapa bytesförfrågan");
    }

    return response.json();
  } catch (error) {
    console.error("Fel vid skapande av trade:", error);
    throw error;
  }
}

/**
 * Hämta användarens trades (både requests och trades)
 * @returns {Promise} Objekt med requests och trades arrays
 */
export async function getMyTrades() {
  console.log("🔄 getMyTrades: Starting...");
  try {
    const token = getToken();
    console.log("🔑 getMyTrades: Token exists:", !!token);
    
    if (!token) {
      console.log("⚠️ getMyTrades: No token, returning empty arrays");
      return { requests: [], trades: [] };
    }

    // Hämta requests (där användaren är requester)
    console.log("📤 getMyTrades: Fetching requests (my-requests)...");
    let requestsData = { trades: [] };
    try {
      requestsData = await get("/trades/my-requests", token);
      console.log("✅ getMyTrades: Requests fetched successfully:", requestsData);
    } catch (error) {
      console.warn("⚠️ getMyTrades: Could not fetch requests:", error.message);
    }
    
    const requests = requestsData.trades || [];
    console.log("📤 getMyTrades: Requests (I asked for):", requests);

    // Hämta trades (där användaren är owner)
    console.log("📥 getMyTrades: Fetching trades (my-trades)...");
    let tradesData = { trades: [] };
    try {
      tradesData = await get("/trades/my-trades", token);
      console.log("✅ getMyTrades: Trades fetched successfully:", tradesData);
    } catch (error) {
      console.warn("⚠️ getMyTrades: Could not fetch trades:", error.message);
    }
    
    const trades = tradesData.trades || [];
    console.log("📥 getMyTrades: Trades (Others asked for):", trades);

    const result = {
      requests: requests,
      trades: trades
    };
    console.log("🎯 getMyTrades: Final result:", result);
    
    return result;
  } catch (error) {
    console.error("❌ getMyTrades: Error:", error);
    console.error("❌ getMyTrades: Error message:", error.message);
    console.error("❌ getMyTrades: Error stack:", error.stack);
    return { requests: [], trades: [] };
  }
}

/**
 * Acceptera en trade
 * @param {string} tradeId - ID på trade
 * @returns {Promise} Uppdaterad trade
 */
export async function acceptTrade(tradeId) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Du måste vara inloggad");
    }

    const response = await fetch(`${API_BASE_URL}/trades/my-trades/${tradeId}/accept`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Kunde inte acceptera trade");
    }

    return response.json();
  } catch (error) {
    console.error("Fel vid accept av trade:", error);
    throw error;
  }
}

/**
 * Avvisa en trade
 * @param {string} tradeId - ID på trade
 * @returns {Promise} Uppdaterad trade
 */
export async function rejectTrade(tradeId) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Du måste vara inloggad");
    }

    const response = await fetch(`${API_BASE_URL}/trades/my-trades/${tradeId}/reject`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Kunde inte avvisa trade");
    }

    return response.json();
  } catch (error) {
    console.error("Fel vid avvisning av trade:", error);
    throw error;
  }
}

/**
 * Avbryt en trade (requester)
 * @param {string} tradeId - ID på trade
 * @returns {Promise} Svarsmeddelande
 */
export async function cancelTrade(tradeId) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Du måste vara inloggad");
    }

    const response = await fetch(`${API_BASE_URL}/trades/my-trades/${tradeId}/cancel`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Kunde inte avbryta trade");
    }

    return response.json();
  } catch (error) {
    console.error("Fel vid avbrytning av trade:", error);
    throw error;
  }
}

/**
 * Slutför en trade (owner)
 * @param {string} tradeId - ID på trade
 * @returns {Promise} Svarsmeddelande
 */
export async function completeTrade(tradeId) {
  try {
    const token = getToken();
    if (!token) {
      throw new Error("Du måste vara inloggad");
    }

    const response = await fetch(`${API_BASE_URL}/trades/my-trades/${tradeId}/complete`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Kunde inte slutföra trade");
    }

    return response.json();
  } catch (error) {
    console.error("Fel vid slutförande av trade:", error);
    throw error;
  }
}