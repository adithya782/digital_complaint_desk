import { Drawer } from "expo-router/drawer";

export default function DrawerLayout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="index" // This matches index.tsx
        options={{
          drawerLabel: "Home",
          title: "SafeCity",
        }}
      />
      <Drawer.Screen
        name="explore" // This matches explore.tsx
        options={{
          drawerLabel: "Explore",
          title: "Find More",
        }}
      />
      <Drawer.Screen
        name="login"
        options={{
          drawerLabel: "Login",
          title: "Sign In",
        }}
      />
    </Drawer>
  );
}
