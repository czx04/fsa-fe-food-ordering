export const SERVER_STATIC_ASSET_BASE_URL = import.meta.env.VITE_API_BASE_URL
  ? import.meta.env.VITE_API_BASE_URL.replace('/api', '')
  : "http://localhost:3000";
