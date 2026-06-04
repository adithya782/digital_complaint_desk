import { Tabs } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";

export default function AdminLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#2563eb" }}>
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="department"
        options={{
          title: "Departments",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="building" size={20} color={color} solid />
          ),
        }}
      />
      <Tabs.Screen
        name="offices"
        options={{
          title: "Offices",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="briefcase" size={20} color={color} solid />
          ),
        }}
      />
      <Tabs.Screen
        name="staffs"
        options={{
          title: "Staffs",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="users" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "profile",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="user-gear" size={20} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
