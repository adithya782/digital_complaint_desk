import { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { apiClient } from "../../services/api";

interface Complaint {
  complaint_id: number;
  title: string;
  status: string;
}

export default function TrackPortal() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [manualId, setManualId] = useState("");
  const router = useRouter();

  useEffect(() => {
    apiClient("/api/user/dashboard").then((data) => {
      if (data?.complaints) setComplaints(data.complaints);
    });
  }, []);

  // Function to handle manual tracking
  const trackById = () => {
    if (!manualId.trim()) {
      Alert.alert("Input Required", "Please enter a Complaint ID.");
      return;
    }
    router.push(`/user/track_complaint?id=${manualId.trim()}` as any);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Track Complaint</Text>

      {/* Manual Entry Section */}
      <View style={styles.inputGroup}>
        <TextInput
          style={styles.input}
          placeholder="Enter Complaint ID"
          keyboardType="numeric"
          value={manualId}
          onChangeText={setManualId}
        />
        <TouchableOpacity style={styles.trackBtn} onPress={trackById}>
          <Text style={styles.trackBtnText}>Track</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionHeader}>Your Recent Complaints</Text>

      <FlatList
        data={complaints}
        keyExtractor={(item) => item.complaint_id.toString()}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() =>
              router.push(
                `/user/track_complaint?id=${item.complaint_id}` as any,
              )
            }
          >
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.itemStatus}>Status: {item.status}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f9f9" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20 },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    marginTop: 10,
  },
  inputGroup: { flexDirection: "row", gap: 10, marginBottom: 20 },
  input: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  trackBtn: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 10,
    justifyContent: "center",
  },
  trackBtnText: { color: "#fff", fontWeight: "bold" },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 10,
    elevation: 2,
  },
  itemTitle: { fontSize: 16, fontWeight: "bold" },
  itemStatus: { color: "#666", marginTop: 5 },
});
