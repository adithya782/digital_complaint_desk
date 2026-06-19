import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { apiClient } from "../../services/api";

export default function TrackComplaint() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [key, setKey] = useState("");
  const [needsKey, setNeedsKey] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async (trackingKey = "") => {
    setLoading(true);
    try {
      // Pass 'true' to ignore global 403 redirect in apiClient
      const response = await apiClient(
        `/api/complaint/timeline/${id}${trackingKey ? `?key=${trackingKey}` : ""}`,
        { method: "GET" },
        true,
      );

      // If we get a response, the complaint is accessible
      if (response) {
        setData(response);
        setNeedsKey(false);
      } else {
        // If response is null, the backend returned 403 (Forbidden/Key Required)
        setNeedsKey(true);
      }
    } catch (err: any) {
      // If it's a genuine network error, show an alert
      Alert.alert("Error", err.message || "Failed to load complaint data.");
      setNeedsKey(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );

  if (needsKey)
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.subtitle}>
          This complaint requires a tracking key to view details.
        </Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Tracking Key"
          value={key}
          onChangeText={setKey}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.btn} onPress={() => loadData(key)}>
          <Text style={styles.btnText}>View Complaint</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{data?.title || "Complaint Details"}</Text>
      <Text style={styles.status}>Status: {data?.status || "N/A"}</Text>

      <FlatList
        data={data?.timeline || []}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View style={styles.timelineItem}>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.note}>
              <Text style={{ fontWeight: "bold" }}>{item.step}:</Text>{" "}
              {item.note}
            </Text>
          </View>
        )}
        ListEmptyComponent={<Text>No timeline updates found.</Text>}
      />

      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backBtnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f9f9f9" },
  center: { flex: 1, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 10 },
  subtitle: { color: "#666", marginBottom: 20 },
  status: {
    fontSize: 16,
    color: "#2563eb",
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 10,
  },
  btn: {
    backgroundColor: "#2563eb",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "bold" },
  timelineItem: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
  },
  date: { fontSize: 12, color: "#888" },
  note: { marginTop: 5 },
  backBtn: { marginTop: 20, alignItems: "center", padding: 10 },
  backBtnText: { color: "#666", fontWeight: "600" },
});
