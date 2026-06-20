import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiClient } from "../../../services/api"; // Ensure you use your existing apiClient

export default function ComplaintDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionDesc, setActionDesc] = useState("");
  const [timeline, setTimeline] = useState<any[]>([]);

  useEffect(() => {
    fetchDetails();
  }, [id]);

  const fetchDetails = async () => {
    try {
      if (!id) throw new Error("No complaint ID provided");

      // Fetch both main details and timeline
      const [details, timelineData] = await Promise.all([
        apiClient(`/api/complaints/${id}`, { method: "GET" }),
        apiClient(`/api/complaint/timeline/${id}`, { method: "GET" }),
      ]);

      setComplaint(details[0]);
      setTimeline(timelineData.timeline || []);
    } catch (err: any) {
      const msg =
        err && typeof err === "object" && "message" in err
          ? err.message
          : "An unexpected error occurred.";

      console.log("DEBUG ERROR:", err);
      Alert.alert("Error", `Failed to load: ${msg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (newStatus: string, isFinal: boolean) => {
    if (!actionDesc)
      return Alert.alert("Required", "Please enter inspection details.");

    try {
      await apiClient(`/api/complaints/${id}`, {
        method: "PUT",
        body: { status: newStatus, description: actionDesc, is_final: isFinal },
      });
      Alert.alert("Success", "Action recorded!");
      setActionDesc("");
      isFinal ? router.replace("/staff/dashboard" as any) : fetchDetails();
    } catch (err: any) {
      Alert.alert("Error", "Failed to update status");
    }
  };

  if (loading) return <ActivityIndicator style={{ flex: 1 }} size="large" />;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
      keyboardVerticalOffset={100}
    >
      <ScrollView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>{complaint?.title}</Text>
          <Text>Description: {complaint?.description}</Text>

          {/* Updated Evidence logic to show a message if null */}
          <Text>
            Evidence:{" "}
            {complaint?.evidence_url ? "Provided" : "No evidence provided."}
          </Text>
          {complaint?.evidence_url && (
            <Image
              source={{ uri: complaint.evidence_url }}
              style={styles.image}
            />
          )}

          <Text>Latitude: {complaint?.latitude}</Text>
          <Text>Longitude: {complaint?.longitude}</Text>
          <Text>Anonymous: {complaint?.anonymous ? "Yes" : "No"}</Text>
          <Text>Status: {complaint?.status}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.subtitle}>History</Text>
          {timeline.map((step, index) => (
            <View key={index} style={styles.timelineItem}>
              <Text style={styles.date}>{step.date}</Text>
              <Text style={{ fontWeight: "bold" }}>{step.step}</Text>
              <Text>{step.note}</Text>
            </View>
          ))}
        </View>

        <View style={styles.card}>
          <Text style={styles.subtitle}>Update Status</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter details..."
            value={actionDesc}
            onChangeText={setActionDesc}
            multiline
          />
          <TouchableOpacity
            style={styles.btn}
            onPress={() => handleUpdate("In Progress", false)}
          >
            <Text style={styles.btnText}>Update Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, { backgroundColor: "#28a745" }]}
            onPress={() => handleUpdate("Resolved", true)}
          >
            <Text style={styles.btnText}>Mark Resolved</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f4f7ff" },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 3,
  },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
  subtitle: { fontSize: 18, marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 10,
    borderRadius: 8,
    height: 80,
    marginBottom: 10,
  },
  image: { width: "100%", height: 200, borderRadius: 8, marginVertical: 10 },
  btn: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: "#6d52ff",
    alignItems: "center",
    marginTop: 10,
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  timelineItem: {
    borderLeftWidth: 3,
    borderLeftColor: "#6d52ff",
    paddingLeft: 10,
    marginBottom: 15,
  },
  date: { fontSize: 11, color: "#888" },
});
