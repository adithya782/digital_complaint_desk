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
  Button,
  Alert,
} from "react-native";
import * as SecureStore from "expo-secure-store";
import { router } from "expo-router";
export default function ProfileScreen() {
  async function logout() {
    await SecureStore.deleteItemAsync("access_token");
    router.replace("/home" as any);
  }
  const showConfirmDialog = () => {
    Alert.alert(
      "Logout", // Title
      "Are you sure you want to Logout?", // Message
      [
        {
          text: "Cancel",
          style: "cancel", // Applies default iOS cancellation styling
        },
        {
          text: "Logout",
          onPress: logout,
          style: "destructive", // Colors button text red on iOS
        },
      ],
      { cancelable: true }, // Allows tapping outside to dismiss on Android
    );
  };
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Admin Settings</Text>
      <Button title="Logout" color="red" onPress={showConfirmDialog} />
    </View>
  );
}
