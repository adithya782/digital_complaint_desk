import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
import { Alert } from "react-native";
const IS_PRODUCTION = true; // 🔄 Flip this to true when deploying!

const API_BASE_URL = IS_PRODUCTION
  ? "https://digital-complaint-desk-server.onrender.com" // Your live backend domain (Supabase/Render/AWS)
  : // : "http://127.0.0.1:5000"; // Your local Flask server
    "http://192.168.43.36:5000";

export async function apiClient(
  endpoint,
  options = {},
  ignoreAuthErrors = false,
) {
  const token = await SecureStore.getItemAsync("access_token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(!options.body || !(options.body instanceof FormData)
        ? { "Content-Type": "application/json" }
        : {}),
      Authorization: token ? `Bearer ${token}` : "",
      ...options.headers,
    },
    body:
      options.body && !(options.body instanceof FormData)
        ? JSON.stringify(options.body)
        : options.body,
  });

  // Handle 401: Always force logout
  if (response.status === 401) {
    await SecureStore.deleteItemAsync("access_token");
    router.replace("/home/login");
    return null;
  }

  // Handle 403: Only logout if NOT ignoring errors
  if (response.status === 403) {
    if (!ignoreAuthErrors) {
      Alert.alert("Forbidden", "You do not have access.");
      router.replace("/home");
      return null;
    }
    // If ignoring errors, we return null so the component can handle the 403
    return null;
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Request failed");
  }

  return await response.json();
}
