import { Tabs } from "expo-router";
import { FontAwesome6 } from "@expo/vector-icons";

export default function StaffLayout() {
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
    </Tabs>
  );
}
