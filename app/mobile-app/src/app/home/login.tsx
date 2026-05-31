import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { apiClient } from "../../services/api";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleGoogleLogin = () => {
    console.log("Google Login pressed - implement Firebase/Auth here");
  };
  async function manualLogin() {
    try {
      const endpoint = "/api/auth/login";
      const body = JSON.stringify({
        email: email,
        password: password,
      });
      const options = {
        method: "POST",
        headers: "",
        body: body,
      };
      const data = await apiClient(endpoint, options);
      if (data.success) {
        await SecureStore.setItemAsync("access_token", data.access_token);

        // Navigation logic
        if (data.role === "admin") {
          router.replace("/admin/dashboard" as any);
        } else if (data.role === "staff") {
          router.replace("/staff/dashboard" as any);
        } else {
          router.replace("/user/dashboard" as any);
        }
      } else {
        alert(data.error || "Login failed");
      }
    } catch (err: any) {
      alert(err.message);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.loginBox}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <FontAwesome6 name="shield-halved" size={24} color="#2563eb" />
          <Text style={styles.logoText}>SafeCity</Text>
        </View>

        <Text style={styles.title}>Login</Text>
        <Text style={styles.subtitle}>Enter your details to login</Text>

        {/* Email Input */}
        <View style={styles.inputBox}>
          <FontAwesome6 name="envelope" size={16} color="#888" />
          <TextInput
            style={styles.input}
            placeholder="Enter Email"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputBox}>
          <FontAwesome6 name="lock" size={16} color="#888" />
          <TextInput
            style={styles.input}
            placeholder="Enter Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Login Button */}
        <TouchableOpacity style={styles.loginBtn} onPress={manualLogin}>
          <Text style={styles.loginBtnText}>Login</Text>
        </TouchableOpacity>
        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>
        <TouchableOpacity style={styles.googleBtn} onPress={handleGoogleLogin}>
          <FontAwesome6 name="google" size={18} color="#db4437" />
          <Text style={styles.googleBtnText}>Continue with Google</Text>
        </TouchableOpacity>
        {/* Register Link */}
        <Text style={styles.registerText}>
          Don't have an account?
          <Text
            style={styles.link}
            onPress={() => router.push("/home/register" as any)}
          >
            {" "}
            Register
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    padding: 20,
  },
  loginBox: {
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 15,
    elevation: 5,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    gap: 10,
  },
  logoText: { fontSize: 24, fontWeight: "bold" },
  title: { fontSize: 28, fontWeight: "bold", textAlign: "center" },
  subtitle: { textAlign: "center", color: "#888", marginBottom: 20 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    gap: 10,
  },
  input: { flex: 1 },
  loginBtn: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  loginBtnText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  registerText: { textAlign: "center", marginTop: 20, color: "#555" },
  link: { color: "#2563eb", fontWeight: "bold" },
  divider: { flexDirection: "row", alignItems: "center", marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: "#ddd" },
  orText: { marginHorizontal: 10, color: "#888" },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    gap: 10,
  },
  googleBtnText: { fontWeight: "bold", fontSize: 16, color: "#555" },
});
