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
import { Href, router } from "expo-router";
export default function StaffDashboard() {
  const [data, setData] = useState<any>(null); // Main state for all dashboard data
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Unified Fetch Function
  async function loadData() {
    try {
      // 1. Fetch data from your backend
      const data = await apiClient("/api/user/dashboard", { method: "GET" });
      setDashboardData(data);
    } catch (err) {
      console.error("Dashboard error: ", err);
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
  const complaintsList =
    dashboardData?.complaints?.length > 0 ? dashboardData.complaints : [];
  const actions = [
    {
      id: "1",
      title: "File Complaint",
      subtitle: "Report issue",
      color: "#22c55e",
      icon: "file-circle-plus",
      route: "/user/file_complaint" as Href,
    },
    {
      id: "2",
      title: "My Complaints",
      subtitle: "View all",
      color: "#3b82f6",
      icon: "list-ul",
      route: "/user/complaints" as Href,
    },
    {
      id: "3",
      title: "Status",
      subtitle: "Track issues",
      color: "#8b5cf6",
      icon: "chart-line",
      route: "/user/complaint_status" as Href,
    },
    {
      id: "4",
      title: "SOS",
      subtitle: "Emergency help",
      color: "#ef4444",
      icon: "phone",
      route: "/user/sos" as Href,
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
          Welcome, {data?.fullname || "USER"}
        </Text>
        <View style={styles.cardsGrid}>
          {actions.map((action) => (
            <TouchableOpacity
              key={action.id}
              style={[
                styles.card,
                {
                  backgroundColor: "#fff",
                  borderColor: action.color,
                  borderWidth: 1,
                },
              ]}
              onPress={() => {
                console.log(`Navigating to ${action.title}`);
                // Add navigation logic here: router.push('/your-path')
                router.push(action.route);
              }}
            >
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: action.color },
                ]}
              >
                <FontAwesome6
                  name={action.icon as any}
                  size={20}
                  color="#fff"
                />
              </View>
              <Text style={styles.cardValue}>{action.title}</Text>
              <Text style={styles.cardText}>{action.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* 2. Today's Focus List (The list you wanted) */}
        <View style={styles.tableHeader}>
          <Text style={styles.headerTitle}>My Complaints</Text>
        </View>

        {complaintsList.map((complaint: any, index: number) => {
          const uniqueKey = complaint.complaint_id
            ? complaint.complaint_id.toString()
            : index.toString();
          const status = complaint.status?.toLowerCase() || "";
          const statusStyle = status.includes("progress")
            ? styles.progressText
            : status.includes("resolved")
              ? styles.resolvedText
              : styles.pendingText;

          return (
            <TouchableOpacity
              key={uniqueKey}
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
    justifyContent: "space-between", // Ensures buttons are neatly spaced
    gap: 12,
    paddingHorizontal: 5,
    marginBottom: 20,
  },
  card: {
    padding: 15,
    borderRadius: 16,
    width: "47%", // Perfect for 2x2 grid
    alignItems: "center",
    backgroundColor: "#fff",
    elevation: 3, // Shadow for Android
    shadowColor: "#000", // Shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardValue: {
    color: "#1e293b",
    fontSize: 14,
    fontWeight: "bold",
    textAlign: "center",
  },
  cardText: {
    color: "#64748b",
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
  },
  iconContainer: {
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
});
