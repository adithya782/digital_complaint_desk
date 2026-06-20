import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
// We use 'export default' so we can import it without curly braces
export default function Hero() {
  const router = useRouter();

  return (
    <View style={styles.heroContainer}>
      <View style={styles.logoContainer}>
        <FontAwesome6 name="shield-halved" size={24} color="black" />
        <Text style={styles.logoText}>SafeCity</Text>
      </View>
      <Text style={styles.title}>Together for a{"\n"}Safer Community</Text>
      <Text style={styles.subtitle}>
        Report issues, get help, and stay informed. We are here to help you
        24/7.
      </Text>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => router.push("/home/login")}
        >
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() => router.push("/home/register")}
        >
          <Text style={styles.btnText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  heroContainer: {
    padding: 20,
    alignItems: "center",
    marginTop: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#666",
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 15,
  },
  loginBtn: {
    backgroundColor: "#4F46E5",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  registerBtn: {
    backgroundColor: "#10B981",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
  },
  btnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  logoContainer: {
    flexDirection: "row", // Aligns icon and text horizontally
    alignItems: "center", // Vertically centers them
    marginBottom: 20, // Space between logo and title
    gap: 10, // Space between icon and text
  },
  logoText: {
    fontSize: 40,
    fontWeight: "bold",
  },
});
