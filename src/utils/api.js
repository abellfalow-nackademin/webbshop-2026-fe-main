/**
 * Unified API management file
 * Innehåller backend URL och grundläggande operationer
 */

// Backend bas-URL
const API_BASE_URL = "https://plot-twist-neon.vercel.app/api";

/**
 * Hämta backend URL
 * @returns {string} Backend URL
 */
export function getBaseUrl() {
  return API_BASE_URL;
}

/**
 * Skicka GET-förfrågan
 * @param {string} endpoint - Slutpunkt
 * @param {string} token - Token (valfritt)
 * @returns {Promise} Svar från servern
 */
export async function get(endpoint, token = null) {
  const headers = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  console.log(`🌐 API GET: ${API_BASE_URL}${endpoint}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      console.error(`⏱️ Timeout for ${endpoint}`);
    }, 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: "GET",
      headers,
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    console.log(`📡 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`❌ API Error ${response.status}:`, errorData);
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ API Success:`, data);
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`❌ API Timeout for ${endpoint}: Request took too long`);
      throw new Error(`Request timeout for ${endpoint}`);
    }
    console.error(`❌ API Error for ${endpoint}:`, error);
    throw error;
  }
}

/**
 * Skicka POST-förfrågan
 * @param {string} endpoint - Slutpunkt
 * @param {object} data - Data att skicka
 * @returns {Promise} Svar från servern
 */
export async function post(endpoint, data) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  return response.json();
}

/**
 * Skicka POST-förfrågan med token
 * @param {string} endpoint - Slutpunkt
 * @param {object} data - Data att skicka
 * @param {string} token - Token
 * @returns {Promise} Svar från servern
 */
export async function postWithAuth(endpoint, data, token) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  return response.json();
}