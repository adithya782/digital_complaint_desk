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

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: method,
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body,
  });

  // 1. Handle 401 Unauthorized IMMEDIATELY
  if (response.status === 401) {
    await SecureStore.deleteItemAsync("access_token");
    Alert.alert("Session Expired", "Please log in again.");
    router.replace("/home/login");
  }

  // 2. Handle 403 Forbidden
  if (response.status === 403) {
    Alert.alert("Forbidden", "You do not have access.");
    router.replace("/home");
  }

  // 3. Check for general errors
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Request failed");
  }

  return response.json();
}
