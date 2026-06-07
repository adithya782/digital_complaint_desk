import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  StyleSheet,
  Platform,
} from "react-native";
import { WebView } from "react-native-webview";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { apiClient } from "@/services/api";
import { SafeAreaView } from "react-native-safe-area-context";
import axios from "axios";
import * as SecureStore from "expo-secure-store";

export default function FileComplaint() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState({ lat: "", lon: "" });
  const [image, setImage] = useState<any>(null);

  const [isAnonymous, setIsAnonymous] = useState(false);
  const webviewRef = useRef<WebView>(null);

  const mapHtml = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
      <style>
        body, html { margin:0; padding:0; height:100%; width:100%; }
        #map { height: 100%; width: 100%; }
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script>
        const map = L.map('map').setView([18.0535, 83.4345], 14);
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
        
        let marker = null;
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          if (marker) marker.setLatLng([lat, lng]);
          else marker = L.marker([lat, lng]).addTo(map);
          window.ReactNativeWebView.postMessage(JSON.stringify({ lat, lon: lng }));
        });

        // Fixed: Added closing brace and parenthesis for the event listener
        window.addEventListener("message", (event) => {
          const data = JSON.parse(event.data);
          if (data.type === "moveMap") {
            const { lat, lon } = data;
            map.setView([lat, lon], 16);
            if (marker) marker.setLatLng([lat, lon]);
            else marker = L.marker([lat, lon]).addTo(map);
          }
        }); 
      </script>
    </body>
  </html>
`;
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      // Use the string 'images' directly if the enum is missing
      mediaTypes: "images" as any,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0]);
    }
  };

  const getGPS = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission denied");

    let loc = await Location.getCurrentPositionAsync({});
    const lat = loc.coords.latitude;
    const lon = loc.coords.longitude;

    // 1. Update the React Native State
    setCoords({ lat: lat.toFixed(6), lon: lon.toFixed(6) });

    // 2. Send the message to the WebView to move the marker
    webviewRef.current?.postMessage(
      JSON.stringify({ type: "moveMap", lat, lon }),
    );
  };

  const handleReload = () => {
    setTitle("");
    setDescription("");
    setCoords({ lat: "", lon: "" });
    setImage(null);
    Alert.alert("Reset", "Form cleared.");
  };

  const handleSubmit = async () => {
    if (!title || !coords.lat)
      return Alert.alert("Error", "Title and Location are required.");

    const token = await SecureStore.getItemAsync("access_token");

    // Create a proper request for the bridge
    const xhr = new XMLHttpRequest();
    xhr.open(
      "POST",
      `https://appear-eastbound-usable.ngrok-free.dev/api/user/complaint`,
    );
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    xhr.setRequestHeader("ngrok-skip-browser-warning", "true");

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("latitude", coords.lat);
    formData.append("longitude", coords.lon);
    formData.append("isAnonymous", isAnonymous ? "true" : "false");

    if (image) {
      formData.append("complaint_image", {
        uri: image.uri,
        type: "image/jpeg",
        name: image.uri.split("/").pop(),
      } as any);
    }

    xhr.onload = () => {
      if (xhr.status === 200 || xhr.status === 201) {
        try {
          // 1. Parse the JSON response from the server
          const response = JSON.parse(xhr.responseText);

          // 2. Access the ID (assuming your backend sends { "id": ... })
          const complaintId = response.id;

          Alert.alert("Success", `Complaint submitted! ID: ${complaintId}`);
          handleReload();
        } catch (e) {
          // Fallback if the response isn't valid JSON
          Alert.alert("Success", "Complaint submitted!");
          handleReload();
        }
      } else {
        Alert.alert("Error", "Submission failed: " + xhr.status);
      }
    };

    xhr.onerror = (e) => {
      console.log("XHR Error:", e);
      Alert.alert("Error", "Network request failed");
    };

    xhr.send(formData);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f1f5f9" }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text style={styles.label}>Complaint Title</Text>
        <TextInput style={styles.input} value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          multiline
          value={description}
          onChangeText={setDescription}
        />

        <Text style={styles.label}>Location</Text>
        <TouchableOpacity style={styles.btn} onPress={getGPS}>
          <Text style={styles.btnText}>Use Current GPS</Text>
        </TouchableOpacity>

        <View style={styles.mapContainer}>
          <WebView
            ref={webviewRef}
            source={{ html: mapHtml }}
            onMessage={(e) => {
              const data = JSON.parse(e.nativeEvent.data);
              setCoords({ lat: data.lat.toFixed(6), lon: data.lon.toFixed(6) });
            }}
          />
        </View>

        <Text style={styles.coordText}>
          Lat: {coords.lat}, Lon: {coords.lon}
        </Text>

        <TouchableOpacity style={styles.btn} onPress={pickImage}>
          <Text style={styles.btnText}>
            {image ? "Image Selected" : "Upload Evidence"}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setIsAnonymous(!isAnonymous)}
        >
          <Text style={{ fontSize: 20 }}>{isAnonymous ? "☑" : "☐"}</Text>
          <Text style={{ marginLeft: 10, fontWeight: "bold" }}>
            Submit Anonymously
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#22c55e" }]}
          onPress={handleSubmit}
        >
          <Text style={styles.btnText}>Submit Complaint</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: "#ef4444" }]}
          onPress={handleReload}
        >
          <Text style={styles.btnText}>Clear Form</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: "#f1f5f9", flex: 1 },
  label: { fontWeight: "bold", marginBottom: 5, marginTop: 15 },
  coordText: { marginTop: 10, color: "#475569", fontStyle: "italic" },
  input: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  mapContainer: {
    height: 250,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginTop: 10,
  },
  btn: {
    backgroundColor: "#3b82f6",
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 10,
  },
});
