
export function getBaseUrl() {
  return "https://plot-twist-neon.vercel.app/";
  if (window.location.hostname.includes("localhost")) {
    return "http://localhost:3000/";
  }
  // TODO: Add deployed backend URL
}
