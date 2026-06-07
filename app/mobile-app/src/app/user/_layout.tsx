import { Tabs } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";

export default function StaffLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#2563eb",
        // Force the tab bar to have a specific height and background
        tabBarStyle: {
          backgroundColor: "#ffffff",
          height: 60, // Standard height
          paddingBottom: 5,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="house" size={20} color={color} />
          ),
        }}
      />
      {/* Add your other tabs here */}
      <Tabs.Screen
        name="file_complaint"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
