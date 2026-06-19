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

  // 1. Always attempt to parse the body if it's not a 204 (No Content)
  let data = null;
  try {
    data = await response.json();
  } catch (e) {
    // Keep data as null if response is empty
  }

  // 2. Handle 401: Always force logout
  if (response.status === 401) {
    await SecureStore.deleteItemAsync("access_token");
    router.replace("/home/login");
    return null;
  }

  // 3. Handle 403: Throw an error object with status and data
  if (response.status === 403) {
    if (!ignoreAuthErrors) {
      Alert.alert("Forbidden", "You do not have access.");
      router.replace("/home");
      return null;
    }
    // IMPORTANT: Throw instead of returning null so the UI's catch block sees it
    const error = new Error("Forbidden");
    error.status = 403;
    error.data = data; // Attach the JSON response (e.g., {requires_key: false})
    throw error;
  }

  // 4. Handle other non-200 status codes
  if (!response.ok) {
    const error = new Error(data?.message || "Request failed");
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
