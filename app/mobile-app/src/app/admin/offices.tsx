import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import { apiClient } from "@/services/api";

interface Department {
  department_id: number;
  department_name: string;
}

export default function OfficeRegistration() {
  const [refreshing, setRefreshing] = useState(false);
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepts, setSelectedDepts] = useState<number[]>([]);
  const [offices, setOffices] = useState([]);

  const webviewRef = useRef<WebView>(null);
  const defaultLat = 16.7;
  const defaultLon = 80.8;

  const onRefresh = async () => {
    setRefreshing(true);
    setLat("");
    setLon("");
    setName("");
    setSelectedDepts([]);
    await Promise.all([loadOffices(), loadDepartments()]);
    setRefreshing(false);
  };

  // 1. Unified Setup Effect Loop
  useEffect(() => {
    loadOffices();
    loadDepartments();
  }, []);

  async function loadOffices() {
    try {
      const data = await apiClient("/api/office/create", { method: "GET" });
      setOffices(data.offices || []);
    } catch (err) {
      console.log("Failed to sync office data grid maps", err);
    }
  }

  async function loadDepartments() {
    try {
      const data = await apiClient("/api/department/create", { method: "GET" });
      setDepartments(data.departments || []);
    } catch (err) {
      Alert.alert("Error", "Failed to load departments");
    }
  }

  async function getGPS() {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return Alert.alert("Permission denied");

    let location = await Location.getCurrentPositionAsync({});
    const baseLat = location.coords.latitude;
    const baseLon = location.coords.longitude;

    setLat(baseLat.toFixed(6));
    setLon(baseLon.toFixed(6));

    // Send the fresh GPS message to Leaflet instantly
    const dataMessage = JSON.stringify({
      type: "gps",
      latitude: baseLat,
      longitude: baseLon,
    });
    webviewRef.current?.postMessage(dataMessage);
  }

  async function handleDeleteOffice(id: number) {
    try {
      await apiClient(`/api/office/delete/${id}`, { method: "DELETE" });
      Alert.alert("Success", "Office Deleted!");
      loadOffices(); // Triggers UI re-render updates automatically
    } catch (err) {
      Alert.alert("Error", "Delete failed");
    }
  }

  async function handleCreate() {
    if (!name || !lat || !lon) {
      return Alert.alert("Error", "Please fill in Name and get GPS location");
    }
    try {
      await apiClient("/api/office/create", {
        method: "POST",
        body: JSON.stringify({
          name,
          latitude: lat,
          longitude: lon,
          department_ids: selectedDepts,
        }),
      });
      Alert.alert("Success", "Office Created!");

      setName("");
      setLat("");
      setLon("");
      setSelectedDepts([]);
      webviewRef.current?.postMessage(JSON.stringify({ type: "clearGPSPin" }));
      await loadOffices(); // Re-sync the new marker to the canvas map
    } catch (err) {
      Alert.alert("Error", "Registration failed");
    }
  }

  const currentLatitude = lat ? parseFloat(lat) : defaultLat;
  const currentLongitude = lon ? parseFloat(lon) : defaultLon;

  // Fully managed map script framework code
  // Fully managed map script framework code
  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body { margin:0; padding:0; height:100%; width:100%; }
    #map { height:100%; width:100%; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const offices = ${JSON.stringify(offices)};
    
    const redIcon = L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const map = L.map('map', {zoomControl: false}).setView([${currentLatitude}, ${currentLongitude}], ${lat ? 16 : 10});
    
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: 'Map data © OpenStreetMap'
    }).addTo(map);

    // 1. ADD ALL EXISTING OFFICES BACK
    offices.forEach(office => {
  if (!office.latitude || !office.longitude) return;

  const deptList = (office.departments || [])
    .map(d => d.department_name)
    .join(", ");

  const popup =
    "<div style='min-width:180px'>" +
      "<b>" + (office.office_name || "No Name") + "</b><br/>" +
      "<small>Departments: " + (deptList || "None") + "</small>" +
      "<br/><br/>" +
      "<button onclick='deleteOffice(" + office.office_id + ")' " +
        "style='background:#e53935;color:white;border:none;padding:6px 10px;" +
        "border-radius:4px;width:100%;cursor:pointer;'>" +
        "DELETE" +
      "</button>" +
    "</div>";

  L.marker([office.latitude, office.longitude])
    .addTo(map)
    .bindPopup(popup);
});
function deleteOffice(id) {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: "deleteOffice",
          office_id: id
        }));
      }
    }

    // 2. INITIALIZE GPS MARKER EMPTY VARIABLE
    let gpsMarker = null;

    // FIXED: Only place the red pin on load if coordinates actually exist in your state
    if (${lat ? "true" : "false"}) {
      gpsMarker = L.marker([${currentLatitude}, ${currentLongitude}], {icon: redIcon}).addTo(map);
    }

    // 3. LISTEN FOR UPDATES (Runs when pressing "Get GPS" button)
    window.addEventListener("message", function(event) {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "gps") {
          const latVal = parseFloat(data.latitude);
          const lngVal = parseFloat(data.longitude);
          
          if (gpsMarker) {
            gpsMarker.setLatLng([latVal, lngVal]);
          } else {
            // Drop a brand new pin instance if it didn't exist
            gpsMarker = L.marker([latVal, lngVal], { icon: redIcon }).addTo(map);
          }
          map.invalidateSize();
          map.flyTo([latVal, lngVal], 16, { animate: true });
        }
      } catch(e) {}
    });
  </script>
</body>
</html>
`;

  return (
    <View style={{ flex: 1 }}>
      {/* Dynamic key mapping updates layout state parameters */}
      <View style={styles.mapContainer}>
        <WebView
          ref={webviewRef}
          originWhitelist={["*"]}
          source={{ html: mapHtml }}
          style={styles.map}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          onMessage={(event) => {
            try {
              const data = JSON.parse(event.nativeEvent.data);
              if (data.type === "deleteOffice") {
                handleDeleteOffice(data.office_id);
              }
            } catch (err) {
              console.log(err);
            }
          }}
        />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <TextInput
          placeholder="Office Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />

        <View style={styles.row}>
          <Text>
            Lat: {lat || "Not set"} | Lon: {lon || "Not set"}
          </Text>
          <Button title="Get GPS" onPress={getGPS} />
        </View>

        <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
          Assign Departments:
        </Text>

        {departments.map((d) => (
          <TouchableOpacity
            key={d.department_id}
            style={styles.checkbox}
            onPress={() =>
              setSelectedDepts((prev) =>
                prev.includes(d.department_id)
                  ? prev.filter((id) => id !== d.department_id)
                  : [...prev, d.department_id],
              )
            }
          >
            <Text
              style={{
                color: selectedDepts.includes(d.department_id)
                  ? "blue"
                  : "black",
              }}
            >
              {selectedDepts.includes(d.department_id) ? "☑" : "☐"}{" "}
              {d.department_name}
            </Text>
          </TouchableOpacity>
        ))}

        <Button title="Create Office" onPress={handleCreate} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 10,
    borderRadius: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center",
  },
  mapContainer: {
    height: 300,
    width: "100%",
    borderBottomWidth: 1,
    borderColor: "#ccc",
    backgroundColor: "#e0e0e0",
  },
  map: {
    flex: 1,
  },
  checkbox: {
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: "#eee",
  },
});
