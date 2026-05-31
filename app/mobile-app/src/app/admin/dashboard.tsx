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

interface Department {
  department_id: number;
  department_name: string;
}

interface ComplaintData {
  all_complaints: any[];
  pending: any[];
  departments: Department[]; // Use the interface here
}

export default function AdminDashboard() {
  const [selectedDept, setSelectedDept] = useState<number | null>(null);
  const [data, setData] = useState<ComplaintData>({
    all_complaints: [],
    pending: [],
    departments: [],
  });

  async function submitVerification(complaintId: Number) {
    if (!selectedDept) {
      Alert.alert("Please select a department!");
      return;
    }
    const payload = {
      complaint_id: complaintId,
      actual_dept_id: selectedDept,
    };

    console.log("Sending Payload:", JSON.stringify(payload));

    try {
      const data = await apiClient("/api/admin/verify_complaint", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setData((prev) => {
        const updatedAll = prev.all_complaints.map((c) =>
          c.complaint_id === complaintId
            ? { ...c, is_verified: true, department_id: selectedDept }
            : c,
        );
        return { ...prev, all_complaints: updatedAll };
      });
      setModalVisible(false);
      await onRefresh();
      Alert.alert("Message", data.message);
    } catch (error) {
      console.error("Fetch failed:", error);
    }
  }

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);

  const openModal = (item: any) => {
    console.log("Opening modal for item:", item.complaint_id);
    setSelectedComplaint(item);
    const deptId = item.department_id ? Number(item.department_id) : null;
    setSelectedDept(deptId);
    setModalVisible(true);
  };

  const [viewMode, setViewMode] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const result = await apiClient("/api/admin/verify_complaint", {
        method: "GET",
      });
      setData(result);
    } catch (err) {
      console.error(err);
    }
  }
  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };
  const displayedList =
    viewMode === "pending" ? data.pending : data.all_complaints;

  const stats = [
    {
      id: "1",
      title: "Total Staff",
      value: "120",
      color: "#8b5cf6",
      icon: "users",
    },
    {
      id: "2",
      title: "Total Admins",
      value: "15",
      color: "#3b82f6",
      icon: "user-shield",
    },
    {
      id: "3",
      title: "AI Verified",
      value: "340",
      color: "#10b981",
      icon: "robot",
    },
    {
      id: "4",
      title: "Audit Reports",
      value: "28",
      color: "#f97316",
      icon: "clipboard-check",
    },
  ];

  const logs = [
    { id: "#1001", title: "Fraud Detection", status: "Verified" },
    { id: "#1002", title: "Image Analysis", status: "Pending" },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 80 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Statistics Grid */}
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

        {/* Switch Header */}
        <View style={styles.tableHeader}>
          <Text style={styles.headerTitle}>AI Verification Logs</Text>
        </View>

        <View style={styles.switchContainer}>
          <TouchableOpacity
            style={[styles.switchBtn, viewMode === "all" && styles.activeBtn]}
            onPress={() => setViewMode("all")}
          >
            <Text
              style={
                viewMode === "all" ? styles.activeText : styles.inactiveText
              }
            >
              View All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.switchBtn,
              viewMode === "pending" && styles.activeBtn,
            ]}
            onPress={() => setViewMode("pending")}
          >
            <Text
              style={
                viewMode === "pending" ? styles.activeText : styles.inactiveText
              }
            >
              Pending Only
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tableHeaderRow}>
          <Text style={[styles.headerText, { width: 50 }]}>ID</Text>
          <Text style={[styles.headerText, { flex: 1 }]}>Title</Text>
          <Text style={[styles.headerText, { width: 100, textAlign: "right" }]}>
            Status
          </Text>
        </View>
        {displayedList.map((item: any) => (
          <View key={item.complaint_id.toString()} style={styles.row}>
            <Text style={styles.id}>#{item.complaint_id}</Text>
            <Text style={styles.title}>{item.title}</Text>

            <TouchableOpacity onPress={() => openModal(item)}>
              <Text
                style={item.is_verified ? styles.verified : styles.pendingText}
              >
                {item.is_verified ? "Processed" : "Process Now"}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </ScrollView>
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selectedComplaint?.title}</Text>
            <Text
              style={{
                fontWeight: "bold",
                textDecorationLine: "underline",
              }}
            >
              Description:
            </Text>
            <Text style={styles.modalDesc}>
              {selectedComplaint?.description}
            </Text>

            {/* Department Selector */}
            {!selectedComplaint?.is_verified ? (
              /* Use a standard button to trigger a picker, or a simple text input for now */
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  placeholder={{ label: "Select a Department...", value: null }}
                  value={selectedDept}
                  onValueChange={(value) => setSelectedDept(value)}
                  items={data.departments.map((d) => ({
                    label: d.department_name,
                    value: d.department_id,
                  }))}
                  style={{
                    inputIOS: styles.pickerInput,
                    inputAndroid: styles.pickerInput,
                  }}
                />
              </View>
            ) : (
              <View style={styles.deptDisplay}>
                <Text style={styles.label}>Department:</Text>
                <Text style={styles.deptValue}>
                  {data.departments.find(
                    (d) => d.department_id === selectedComplaint?.department_id,
                  )?.department_name || "Unassigned"}
                </Text>
              </View>
            )}

            {!selectedComplaint?.is_verified && (
              <TouchableOpacity
                style={styles.submitBtn}
                onPress={async () => {
                  if (!selectedDept) {
                    alert("Please select a department first");
                    return;
                  }
                  // Perform your API call here using selectedDept
                  submitVerification(selectedComplaint.complaint_id);
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <FontAwesome6
                    name="check"
                    size={16}
                    color="#fff"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.btnText}>Submit Verification</Text>
                </View>
              </TouchableOpacity>
            )}
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
  tableRow: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    alignItems: "center",
  },
  colId: { width: 50, fontWeight: "bold" },
  colInfo: { flex: 2, paddingHorizontal: 5 },
  colDept: { flex: 1.5, alignItems: "center" },
  colAction: { flex: 1.5, alignItems: "flex-end" },

  // 1. Update the style in your StyleSheet
  submitBtn: {
    backgroundColor: "#3b82f6", // Clean professional blue
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12, // Rounded corners are modern
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    // Add a subtle shadow for depth
    shadowColor: "#3b82f6",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5, // For Android shadow
  },
  btnText: {
    color: "#fff",
    fontSize: 16, // Increased size for readability
    fontWeight: "600", // Semi-bold
  },
  deptText: { fontSize: 12 },
  container: { flex: 1, padding: 15, backgroundColor: "#f1f5f9" },
  // Card Styles
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

  // Table Header & Switch
  tableHeader: { marginBottom: 10 },
  headerTitle: { fontSize: 18, fontWeight: "bold" },
  switchContainer: {
    flexDirection: "row",
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: "#e2e8f0",
  },
  switchBtn: { flex: 1, padding: 10, alignItems: "center" },
  activeBtn: { backgroundColor: "#3b82f6", borderRadius: 8 },
  activeText: { color: "#fff", fontWeight: "bold" },
  inactiveText: { color: "#475569" },

  // List Rows
  //   row: {
  //     flexDirection: "row",
  //     padding: 15,
  //     backgroundColor: "#fff",
  //     marginBottom: 8,
  //     borderRadius: 8,
  //     alignItems: "center",
  //   },
  id: { width: 50, fontWeight: "bold" },
  info: { flex: 1, paddingHorizontal: 10 },
  title: { fontWeight: "bold" },
  desc: { fontSize: 12, color: "#64748b" },
  statusBox: { width: 80, alignItems: "flex-end" },

  // Status Colors
  verified: { color: "green", fontSize: 12, fontWeight: "bold" },
  pendingText: { color: "orange", fontSize: 12, fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalBox: { backgroundColor: "#fff", padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  modalDesc: { fontSize: 14, color: "#666", marginBottom: 20 },
  label: { marginBottom: 20, fontWeight: "bold" },
  closeText: { marginTop: 15, textAlign: "center", color: "#64748b" },
  // Update your row style to remove flex for description
  row: {
    flexDirection: "row",
    padding: 15,
    backgroundColor: "#fff",
    marginBottom: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  pickerInput: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    fontSize: 16,
    color: "#333",
  },
  deptDisplay: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 8,
  },
  deptValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#334155",
  },
  tableHeaderRow: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: "#f1f5f9", // Slightly darker than the row background
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    marginBottom: 5,
  },
  headerText: {
    fontWeight: "bold",
    color: "#475569",
    fontSize: 14,
    textAlign: "center",
  },
});
