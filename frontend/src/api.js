const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Shared request helper for JSON and multipart requests.
async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function registerUser(payload) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function loginUser(payload) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(token) {
  return apiRequest("/api/auth/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getTrips(token) {
  return apiRequest("/api/trips", {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function createTrip(token, formData) {
  return apiRequest("/api/trips", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

export async function updateTrip(token, tripId, formData) {
  return apiRequest(`/api/trips/${tripId}`, {
    method: "PUT",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

export async function deleteTrip(token, tripId) {
  return apiRequest(`/api/trips/${tripId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
