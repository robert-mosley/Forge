export function getBackendUrl(): string {
  const value = process.env.FASTAPI_BACKEND_URL?.trim();
  if (!value) {
    throw new Error("FASTAPI_BACKEND_URL is not configured.");
  }
  return value.replace(/\/$/, "");
}
