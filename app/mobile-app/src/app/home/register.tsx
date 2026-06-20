import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { apiClient } from "../../services/api";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

export default function RegisterScreen() {
  const router = useRouter();
  const [fullname, setFullname] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (!fullname || !phone || !email || !password) {
      return Alert.alert("Error", "Please fill in all fields.");
    }

    try {
      const data = await apiClient("/api/auth/register", {
        method: "POST",
        body: { fullname, phone, email, password },
      });

      if (data.success) {
        // 1. Clear the fields
        setFullname("");
        setPhone("");
        setEmail("");
        setPassword("");

        // 2. Alert and Navigate
        Alert.alert("Success", "Account created successfully!");
        router.replace("/home/login" as any);
      }
    } catch (err: any) {
      Alert.alert(
        "Registration Failed",
        err.data?.error || err.message || "Could not connect to server.",
      );
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.box}>
        <Text style={styles.title}>Create Account</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={fullname}
          onChangeText={setFullname}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
        />
        <TextInput
          style={styles.input}
          placeholder="Phone Number"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.btn} onPress={handleRegister}>
          <Text style={styles.btnText}>Create Account</Text>
        </TouchableOpacity>

        <Text
          style={styles.link}
          onPress={() => router.replace("/home/login" as any)}
        >
          Already have an account? Login
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#f9f9f9",
  },
  box: { backgroundColor: "#fff", padding: 25, borderRadius: 15, elevation: 5 },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
  },
  btn: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  link: { textAlign: "center", marginTop: 15, color: "#2563eb" },
});
