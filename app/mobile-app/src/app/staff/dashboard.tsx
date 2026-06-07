import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Modal,
  Alert,
} from "react-native";
import { FontAwesome6 } from "@expo/vector-icons";
import { apiClient } from "@/services/api";
import RNPickerSelect from "react-native-picker-select";

export default function StaffDashboard() {
  const [data, setData] = useState<any>(null); // Main state for all dashboard data
  const [viewMode, setViewMode] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Unified Fetch Function
  async function loadData() {
    try {
      // Fetching the staff dashboard data
      const result = await apiClient("/api/staff/dashboard", { method: "GET" });
      setData(result);
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openModal = (item: any) => {
    setSelectedComplaint(item);
    setModalVisible(true);
  };

  // Helper to determine list
  const complaintsList = data?.slots?.todays_focus_slot || [];
  const stats = [
    {
      id: "1",
      title: "Today's Issues",
      value: dashboardData?.slots?.todays_focus_slot?.length?.toString() || "0",
      color: "#3b82f6",
      icon: "file-circle-plus",
    },
    {
      id: "2",
      title: "Total Pending",
      value: "5",
      color: "#f97316",
      icon: "clock",
    },
    {
      id: "3",
      title: "Resolved",
      value: "8",
      color: "#10b981",
      icon: "circle-check",
    },
    {
      id: "4",
      title: "Active Reports",
      value: "156",
      color: "#8b5cf6",
      icon: "chart-line",
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 1. Header/User Info */}
        <Text style={styles.headerTitle}>
          Welcome, {data?.fullname || "Staff"}
        </Text>
        <View style={styles.cardsGrid}>
          {stats.map((stat) => (
            <View
              key={stat.id}
              style={[styles.card, { backgroundColor: stat.color }]}
            >
              <FontAwesome6 name={stat.icon as any} size={24} color="#fff" />
              <Text style={styles.cardValue}>{stat.value}</Text>
              <Text style={styles.cardText}>{stat.title}</Text>
            </View>
          ))}
        </View>
        {/* 2. Today's Focus List (The list you wanted) */}
        <View style={styles.tableHeader}>
          <Text style={styles.headerTitle}>Today's Focus Issues</Text>
        </View>

        {complaintsList.map((complaint: any) => {
          const status = complaint.status.toLowerCase();
          const statusStyle = status.includes("progress")
            ? styles.progressText
            : status.includes("resolved")
              ? styles.resolvedText
              : styles.pendingText;

          return (
            <TouchableOpacity
              key={complaint.complaint_id}
              style={styles.complaintItem}
              onPress={() => openModal(complaint)}
            >
              <Text style={styles.strong}>{complaint.title}</Text>
              <Text style={styles.desc1}>{complaint.description}</Text>
              <Text style={styles.priority}>
                Priority: {complaint.priority}
              </Text>
              <Text style={[styles.statusBadge, statusStyle]}>
                {complaint.status}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Modal for Details */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selectedComplaint?.title}</Text>
            <Text style={styles.modalDesc}>
              {selectedComplaint?.description}
            </Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#f1f5f9" },
  headerTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 15 },
  complaintItem: {
    padding: 15,
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
  },
  strong: { fontWeight: "bold", fontSize: 16 },
  desc1: { color: "#666", marginVertical: 5 },
  statusBadge: {
    fontWeight: "bold",
    alignSelf: "flex-start",
    padding: 4,
    borderRadius: 4,
  },
  pendingText: { color: "orange" },
  progressText: { color: "blue" },
  resolvedText: { color: "green" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: { backgroundColor: "#fff", padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  modalDesc: { marginVertical: 15 },
  closeText: { textAlign: "center", color: "red", fontWeight: "bold" },
  priority: {
    fontSize: 12,
    color: "#475569",
    marginTop: 5,
    fontStyle: "italic",
  },
  tableHeader: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: "#f8fafc", // Subtle light grey background
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  card: { padding: 15, borderRadius: 10, width: "47%", alignItems: "center" },
  cardValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginVertical: 5,
  },
  cardText: { color: "#fff", fontSize: 12 },
});
