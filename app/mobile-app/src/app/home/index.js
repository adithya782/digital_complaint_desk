import { ScrollView, StyleSheet } from "react-native";
import Hero from "../../components/Hero";
import FeatureList from "../../components/FeatureList";

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container}>
      {/* 1. Hero Section Component */}
      <Hero />

      {/* 2. Feature Boxes Component */}
      <FeatureList />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
});
