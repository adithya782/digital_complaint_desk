import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TextInput,
  Button, // Added missing import
  FlatList, // Added missing import
} from "react-native";
import { apiClient } from "@/services/api";

export default function DepartmentManagement() {
  const [deptName, setDeptName] = useState("");
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  async function delete_dept(id: Number) {
    const data = await apiClient(`/api/department/delete/${id}`, {
      method: "Delete",
    });
    Alert.alert(data.error || data.message);
    fetchDepartments();
  }

  async function fetchDepartments() {
    try {
      const data = await apiClient("/api/department/create", {
        method: "GET",
      });
      setDepartments(data.departments);
    } catch (error) {
      Alert.alert("Error", "Could not fetch departments");
    }
  }

  async function handleCreate() {
    if (!deptName.trim()) return Alert.alert("Error", "Enter a name");

    try {
      await apiClient("/api/department/create", {
        method: "POST",
        body: JSON.stringify({ department_name: deptName }),
      });
      Alert.alert("Success", "Department created!");
      setDeptName("");
      fetchDepartments();
    } catch (err) {
      Alert.alert("Error", "Could not create department");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Create Department</Text>
      <TextInput
        placeholder="Department Name"
        value={deptName}
        onChangeText={setDeptName}
        style={styles.input}
      />
      <Button title="Create Department" onPress={handleCreate} />
      <Text></Text>
      <Text></Text>

      <Text style={styles.headerText}>List of Departments</Text>

      <View style={styles.table}>
        {/* Table Header */}
        <View style={[styles.row, styles.tableHeader]}>
          <Text style={[styles.headerCell, styles.idColumn]}>ID</Text>
          <Text style={[styles.headerCell, styles.nameColumn]}>
            Department Name
          </Text>
          <Text style={[styles.headerCell, styles.actionColumn]}>Action</Text>
        </View>

        <FlatList
          data={departments}
          keyExtractor={(item: any) => item.department_id.toString()}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Text style={[styles.cell, styles.idColumn]}>
                {item.department_id}
              </Text>

              <Text style={[styles.cell, styles.nameColumn]}>
                {item.department_name}
              </Text>

              <View style={styles.actionColumn}>
                <Button
                  title="Delete"
                  color="#dc3545"
                  onPress={() => delete_dept(item.department_id)}
                />
              </View>
            </View>
          )}
        />
      </View>
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
    borderRadius: 5,
  },
  // row: {
  //   flexDirection: "row",
  //   padding: 15,
  //   borderBottomWidth: 1,
  //   borderBottomColor: "#eee",
  // },
  // cell: { marginRight: 20 },
  headerText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 10,
    paddingHorizontal: 5,
    borderLeftWidth: 4, // Adds a nice "accent" bar
    borderLeftColor: "#007AFF", // Change to your brand color
    paddingLeft: 10,
  },
  table: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
  },

  tableHeader: {
    backgroundColor: "#007AFF",
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  headerCell: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 15,
  },

  cell: {
    color: "#333",
    fontSize: 14,
  },

  idColumn: {
    flex: 1,
  },

  nameColumn: {
    flex: 3,
  },

  actionColumn: {
    flex: 2,
    alignItems: "center",
  },
});
