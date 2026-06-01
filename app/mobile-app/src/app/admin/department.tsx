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
      await apiClient("/api/admin/departments", {
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
      <TextInput
        placeholder="Department Name"
        value={deptName}
        onChangeText={setDeptName}
        style={styles.input}
      />
      <Button title="Create Department" onPress={handleCreate} />

      <Text style={styles.headerText}>List of Departments: </Text>
      <FlatList
        data={departments}
        keyExtractor={(item: any) => item.department_id.toString()}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Text style={styles.cell}>ID: {item.department_id}</Text>
            <Text style={styles.cell}>{item.department_name}</Text>
            <Button
              title="Delete"
              onPress={() => delete_dept(item.department_id)}
            />
          </View>
        )}
      />
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
  row: {
    flexDirection: "row",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  cell: { marginRight: 20 },
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
});
