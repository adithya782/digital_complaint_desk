import { useEffect, useState, useCallback } from "react";
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
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { apiClient } from "../../services/api";

export default function TrackComplaint() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [key, setKey] = useState("");
  const [needsKey, setNeedsKey] = useState(false);
  const [loading, setLoading] = useState(true);
  useFocusEffect(
    useCallback(() => {
      return () => {
        setKey("");
      };
    }, []),
  );
  const loadData = async (trackingKey = "") => {
    setLoading(true);
    try {
      const response = await apiClient(
        `/api/complaint/timeline/${id}${trackingKey ? `?key=${trackingKey}` : ""}`,
        { method: "GET" },
        true,
      );

      if (response) {
        setData(response);
        setNeedsKey(false);
        setKey("");
      }
    } catch (err: any) {
      // Check if the error returned from the server is 403
      if (err.status === 403) {
        // If the server explicitly says a key is required, show the input
        if (err.data?.requires_key === true) {
          setNeedsKey(true);
        } else {
          // PERMISSION DENIED: This is a restricted complaint you cannot access
          Alert.alert(
            "Access Denied",
            "You do not have permission to view this complaint.",
          );
          router.back(); // Kick the user out to the previous screen
        }
      } else {
        // General network/server error
        Alert.alert("Error", err.message || "Failed to load complaint data.");
        router.back();
      }
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
