// The backend returns image paths like "/api/students/{id}/image?v=123".
// Resolve them against the backend origin (REACT_APP_BACKEND_URL may or may not end in /api).
const BACKEND_ORIGIN = (process.env.REACT_APP_BACKEND_URL || "").replace(/\/+$/, "").replace(/\/api$/, "");

export const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("data:") || url.startsWith("http") || url.startsWith("blob:")) return url;
  return `${BACKEND_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};
