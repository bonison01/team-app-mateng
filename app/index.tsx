// app/index.tsx
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function Index() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data } = await supabase.auth.getSession();

    if (data.session) {
      // ✅ MUST BE INSIDE (tabs)
      router.replace("/(tabs)/dashboard");
    } else {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#14710F" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.appTitle}>Attendance & Task Manager</Text>

      <Pressable
        style={styles.teamBtn}
        onPress={() => router.push("/auth/teamlogin")}
      >
        <Text style={styles.btnText}>Team Login</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { flex: 1, justifyContent: "center" },
  container: { flex: 1, justifyContent: "center", padding: 24 },
  appTitle: { fontSize: 26, fontWeight: "800", textAlign: "center" },
  teamBtn: {
    backgroundColor: "#14710F",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
