import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Alert } from "react-native";
const IS_PRODUCTION = true; // 🔄 Flip this to true when deploying!

const API_BASE_URL = IS_PRODUCTION
  ? "https://appear-eastbound-usable.ngrok-free.dev" // Your live backend domain (Supabase/Render/AWS)
  : // : "http://127.0.0.1:5000"; // Your local Flask server
    "http://192.168.43.36:5000";

export async function apiClient(endpoint, options = {}) {
  const token = await SecureStore.getItemAsync("access_token");
  const method = options.method || "GET";
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: method,
    headers: {
      ...(!isFormData ? { "Content-Type": "application/json" } : {}),
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    // If it's FormData, pass the body directly.
    // Otherwise, stringify the body if it exists.
    body: isFormData
      ? options.body
      : options.body
        ? JSON.stringify(options.body)
        : null,
  });

  // 1. Handle 401 Unauthorized
  if (response.status === 401) {
    await SecureStore.deleteItemAsync("access_token");
    Alert.alert("Session Expired", "Please log in again.");
    router.replace("/home/login");
    return null;
  }

  // 2. Handle 403 Forbidden
  if (response.status === 403) {
    Alert.alert("Forbidden", "You do not have access.");
    router.replace("/home");
    return null;
  }

  // 3. Check for general errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Request failed");
  }

  // 4. Handle Empty Responses (Fix for 204 or empty string bodies)
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch (e) {
    return text; // Return raw text if it's not JSON
  }
}
