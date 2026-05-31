import { View, Text, StyleSheet } from "react-native";
import { FontAwesome } from "@expo/vector-icons"; // Expo's built-in icons

const FeatureCard = ({ icon, title, desc, color }) => (
  <View style={styles.card}>
    <View style={[styles.iconBox, { backgroundColor: color }]}>
      <FontAwesome name={icon} size={20} color="white" />
    </View>
    <View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.desc}>{desc}</Text>
    </View>
  </View>
);

export default function FeatureList() {
  return (
    <View style={styles.listContainer}>
      <FeatureCard
        icon="file-text"
        title="Report Issues"
        desc="Report problems in your area"
        color="#8b5cf6"
      />
      <FeatureCard
        icon="map-marker"
        title="Track Status"
        desc="Track your complaints"
        color="#3b82f6"
      />
      <FeatureCard
        icon="bell"
        title="Emergency Help"
        desc="Get help in emergency"
        color="#ef4444"
      />
      <FeatureCard
        icon="users"
        title="Safe Community"
        desc="Build a safer community"
        color="#10b981"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: { padding: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
  },
  iconBox: { padding: 10, borderRadius: 8, marginRight: 15 },
  title: { fontWeight: "700", fontSize: 16 },
  desc: { color: "#666" },
});
