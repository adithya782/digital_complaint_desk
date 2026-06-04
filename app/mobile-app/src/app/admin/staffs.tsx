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
  FlatList,
} from "react-native";
import * as Location from "expo-location";
import { WebView } from "react-native-webview";
import { apiClient } from "@/services/api";

interface Department {
  department_id: number;
  department_name: string;
}

interface staff {
  staff_id: number;
  staff_name: string;
  department_id: number;
}
interface office {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
}

export default function OfficeRegistration() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  // Change this:
  const [selectedDept, setSelectedDepts] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [offices, setOffices] = useState<office[]>([]);
  const [staffs, setStaffs] = useState<staff[]>([]);
  const [password, setPassword] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
  const webviewRef = useRef<WebView>(null);
  // Inside your component
  const departmentLookup = departments.reduce(
    (acc, dept) => {
      acc[dept.department_id] = dept.department_name;
      return acc;
    },
    {} as Record<number, string>,
  );
  const onRefresh = async () => {
    setRefreshing(true);
    setName("");
    setEmail("");
    setPhone("");
    setPassword("");
    setSelectedDepts(null);
    await Promise.all([loadStaffs()]);
    setRefreshing(false);
  };
  useEffect(() => {
    loadStaffs();
  }, []);
  useEffect(() => {
    if (selectedDept) {
      setSelectedOfficeId(null); // Reset chosen office on department change
      loadOffices(selectedDept);
    } else {
      setOffices([]);
    }
  }, [selectedDept]);
  async function loadOffices(dept_id: number) {
    try {
      const data = await apiClient(`/api/offices?department_id=${dept_id}`, {
        method: "GET",
      });
      setOffices(data.offices);
    } catch (err: any) {
      Alert.alert(err);
    }
  }

  //   async function loadDepartments() {
  //     try {
  //       const data = await apiClient("/api/department/create", { method: "GET" });
  //       setDepartments(data.departments || []);
  //     } catch (err) {
  //       Alert.alert("Error", "Failed to load departments");
  //     }
  //   }
  async function loadStaffs() {
    try {
      const data = await apiClient("/api/admin/delete_staff", {
        method: "GET",
      });
      setStaffs(data.staffs || []);
      setDepartments(data.departments || []);
    } catch (err) {
      Alert.alert("Error", "Failed to Load Staffs");
    }
  }
  const currentlySelectedOffice = offices.find(
    (o) => o.id === selectedOfficeId,
  );

  async function handleStaffSubmission(confirmed = false) {
    const staffData = {
      fullname: name,
      email: email,
      password: password,
      phone: phone,
      department_id: selectedDept,
      office_id: selectedOfficeId,
      confirm_upgrade: confirmed, // Send this flag to the backend
    };

    try {
      const response = await apiClient("/api/auth/register_staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(staffData),
      });

      // If server asks for confirmation
      if (response.requires_confirmation) {
        Alert.alert("Upgrade Required", response.message, [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => handleStaffSubmission(true) }, // Retry with confirm = true
        ]);
        return;
      }

      Alert.alert(
        "Success",
        response.message || "Operation completed successfully!",
      );
      // ... reset form state ...
    } catch (err: any) {
      Alert.alert("Error", err.message);
    }
  }

  async function handleDelete(staff_id: number) {
    // Optional: Add a confirmation dialog for better UX
    Alert.alert(
      "Confirm Downgrade",
      "Are you sure you want to revert this staff member to a regular user?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Downgrade",
          style: "destructive",
          onPress: async () => {
            try {
              // Note: Your backend route is /api/admin/delete_staff/<staff_id>
              // We append the ID to the URL path
              const response = await apiClient(
                `/api/admin/delete_staff/${staff_id}`,
                {
                  method: "POST", // Required since your backend uses 'def post'
                },
              );

              Alert.alert(
                "Success",
                response.message || "Staff downgraded successfully.",
              );

              // Refresh the list to reflect changes
              await loadStaffs();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to downgrade staff.");
            }
          },
        },
      ],
    );
  }

  const mapHtml = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body, #map { margin:0; padding:0; height: 100%; width: 100%; }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      // 1. Initialize Leaflet default icon path (prevents missing icon images)
      L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

      // 2. Define the data safely
      const offices = ${JSON.stringify(offices)};
      const defaultLat = offices.length > 0 ? offices[0].latitude : 16.5;
      const defaultLng = offices.length > 0 ? offices[0].longitude : 80.6;

      // 3. Create Map
      const map = L.map('map', {zoomControl: true}).setView([defaultLat, defaultLng], 12);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
      }).addTo(map);

      // 4. Add Markers
      offices.forEach(function(office) {
        if (!office.latitude || !office.longitude) return;
        
        const popupContent = "<b>" + office.name + "</b><br/>" +
                             "<button onclick='selectOffice(" + office.id + ")' " +
                             "style='width:100%; padding:5px; background:#007AFF; color:white; border:none; border-radius:4px; margin-top:5px;'>" +
                             "SELECT</button>";

        L.marker([office.latitude, office.longitude])
         .addTo(map)
         .bindPopup(popupContent);
      });

      // 5. WebView Communication
      function selectOffice(id) {
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: "selectOffice",
            office_id: id
          }));
        }
      }

      // 6. Force size update
      setTimeout(function() {
        map.invalidateSize();
      }, 500);
    </script>
  </body>
  </html>
`;
  return (
    <View style={styles.container}>
      <FlatList
        data={staffs}
        keyExtractor={(item: any) => item.staff_id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        // 1. Everything that was in the ScrollView is now the header
        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            <Text style={styles.headerText}>Staff Registration</Text>
            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              style={styles.input}
            />
            <TextInput
              placeholder="Phone"
              value={phone}
              onChangeText={setPhone}
              style={styles.input}
            />
            <TextInput
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />
            <Text>Select Department:</Text>
            {departments.map((d) => (
              <TouchableOpacity
                key={d.department_id}
                style={styles.checkbox}
                onPress={() => setSelectedDepts(d.department_id)} // Simply set the single ID
              >
                <Text
                  style={{
                    color: selectedDept === d.department_id ? "blue" : "black",
                    fontWeight:
                      selectedDept === d.department_id ? "bold" : "normal",
                  }}
                >
                  {selectedDept === d.department_id ? "◉" : "◯"}{" "}
                  {d.department_name}
                </Text>
              </TouchableOpacity>
            ))}
            {/* INTEGRATED MAP INTERFACE REPLACING DROPDOWN TABLE */}
            {selectedDept ? (
              <View style={styles.mapWrapper}>
                <Text style={styles.label}>
                  Select Office location from Pin:
                </Text>

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
                        if (data.type === "selectOffice") {
                          setSelectedOfficeId(data.office_id); // This triggers the UI update below
                        }
                      } catch (err) {
                        console.log(err);
                      }
                    }}
                  />
                </View>

                {/* Displaying selection details above pin dynamically inside React Native state */}
                {currentlySelectedOffice ? (
                  <View style={styles.selectionCard}>
                    <Text style={styles.selectionTitle}>
                      Selected Office Confirmed:
                    </Text>
                    <View style={styles.tableRow}>
                      <Text style={[styles.cell1, { flex: 1 }]}>
                        {currentlySelectedOffice.id}
                      </Text>
                      <Text style={[styles.cell1, { flex: 2 }]}>
                        {currentlySelectedOffice.name}
                      </Text>
                      <Text style={[styles.cell1, { flex: 1 }]}>
                        {currentlySelectedOffice.latitude.toFixed(2)}
                      </Text>
                      <Text style={[styles.cell1, { flex: 1 }]}>
                        {currentlySelectedOffice.longitude.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <Text style={styles.noDataText}>
                    Click a pin to select an office
                  </Text>
                )}
              </View>
            ) : (
              <Text style={styles.errorText}>Pls select a dept</Text>
            )}
            <View style={styles.submitContainer}>
              <Button
                title="Submit Staff Registration"
                onPress={() => handleStaffSubmission(false)}
                color="#28a745" // Success Green
              />
            </View>

            <Text style={styles.headerText}>List of Staffs</Text>
            <View style={[styles.row, styles.tableHeader]}>
              <Text style={[styles.headerCell, styles.idColumn]}>ID</Text>
              <Text style={[styles.headerCell, styles.nameColumn]}>Name</Text>
              <Text style={[styles.headerCell, styles.nameColumn]}>
                Department
              </Text>
              <Text style={[styles.headerCell, styles.actionColumn]}>
                Action
              </Text>
            </View>
          </View>
        }
        // 2. Render items normally
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={[styles.cell, styles.idColumn]}>{item.staff_id}</Text>
            <Text style={[styles.cell, styles.nameColumn]}>
              {item.staff_name}
            </Text>
            <Text style={[styles.cell, styles.nameColumn]}>
              {departmentLookup[item.department_id]}
            </Text>
            <View style={styles.actionColumn}>
              <Button
                title="Delete"
                color="#dc3545"
                onPress={() => handleDelete(item.staff_id)}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: "#f9f9f9",
    margin: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 25,
    marginBottom: 10,
    paddingLeft: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF",
  },
  // Table Styling
  table: {
    marginHorizontal: 10,
    marginBottom: 50, // Ensures the last row isn't cut off
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#fff",
    overflow: "hidden", // Keeps the borderRadius consistent
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  headerCell: {
    color: "#ff0000",
    fontWeight: "bold",
    fontSize: 14,
    textAlign: "center",
  },
  cell: {
    color: "#333",
    fontSize: 13,
    textAlign: "center",
  },
  // Column sizing
  idColumn: { flex: 1 },
  nameColumn: { flex: 2.5 },
  actionColumn: { flex: 2 },
  checkbox: {
    paddingVertical: 8,
    paddingHorizontal: 5,
  },
  officeCard: {
    backgroundColor: "#ffffff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0", // Subtle separator
    flexDirection: "row", // Align text to the left, coordinates to the right
    justifyContent: "space-between",
    alignItems: "center",
  },
  officeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  coordText: {
    fontSize: 12,
    color: "#888",
    textAlign: "right",
  },
  noDataText: {
    textAlign: "center",
    color: "#999",
    marginTop: 20,
    fontStyle: "italic",
  },
  listContainer: {
    marginTop: 5,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#eee",
  },
  errorText: {
    color: "red",
    marginTop: 10,
  },

  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    backgroundColor: "#eee",
    borderBottomWidth: 2,
    borderBottomColor: "#ccc",
  },
  headerCell1: {
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    alignItems: "center",
  },
  cell1: {
    textAlign: "center",
    fontSize: 14,
    color: "#555",
  },
  mapWrapper: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    marginVertical: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android shadow
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#555",
    marginBottom: 10,
  },
  mapContainer: {
    height: 250, // Fixed height for consistency
    borderRadius: 8,
    overflow: "hidden", // Crucial to clip the map corners
    borderWidth: 1,
    borderColor: "#eee",
  },
  map: {
    flex: 1,
  },
  selectionCard: {
    marginTop: 15,
    padding: 16,
    backgroundColor: "#f0f7ff", // Light blue tint to denote selection
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#007AFF", // Highlighting the selected state
  },
  selectionTitle: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 8,
  },
  submitContainer: {
    marginTop: 30,
    marginBottom: 50,
    paddingHorizontal: 10,
  },
});
