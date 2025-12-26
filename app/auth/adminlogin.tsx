import { Link, router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    console.log("🔵 [ADMIN LOGIN] Started");

    if (!email || !password) {
      console.log("❌ [ADMIN LOGIN] Missing fields");
      Alert.alert("Missing fields", "Please enter email and password");
      return;
    }

    setLoading(true);

    /* ================= AUTH ================= */

    console.log("🔐 [AUTH] Signing in...");
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      console.log("❌ [AUTH] Failed:", error);
      setLoading(false);
      Alert.alert("Login failed", error?.message || "Invalid credentials");
      return;
    }

    console.log("✅ [AUTH] Success");
    console.log("👤 User ID:", data.user.id);
    console.log("📧 Email:", data.user.email);

    /* ================= ROLE CHECK ================= */

    console.log("🔎 [ROLE] Fetching profile...");
    const { data: profile, error: roleError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (roleError) {
      console.log("❌ [ROLE] Error fetching role:", roleError);
    }

    if (!profile) {
      console.log("❌ [ROLE] Profile not found");
      await supabase.auth.signOut();
      setLoading(false);
      Alert.alert("Error", "Profile not found");
      return;
    }

    console.log("🧾 [ROLE] User role:", profile.role);

    if (profile.role !== "admin") {
      console.log("⛔ [ACCESS] Not an admin");
      await supabase.auth.signOut();
      setLoading(false);
      Alert.alert(
        "Access denied",
        "You are not authorized to access admin panel"
      );
      return;
    }

    console.log("✅ [ACCESS] Admin verified");
    setLoading(false);

    /* ================= REDIRECT ================= */

    console.log("➡️ [NAVIGATION] Redirecting to admin dashboard");
    router.replace("/admin/dashboard");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Login</Text>

      <TextInput
        placeholder="Admin Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={styles.input}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={styles.input}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#c62828" />
      ) : (
        <Pressable style={styles.btn} onPress={login}>
          <Text style={styles.btnText}>Login as Admin</Text>
        </Pressable>
      )}

      <Link href="/auth/adminsignup" style={styles.link}>
        Create admin account
      </Link>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    padding: 24,
    marginTop: 80,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: "#c62828",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "700",
  },
  link: {
    marginTop: 14,
    textAlign: "center",
    color: "#c62828",
    fontWeight: "600",
  },
});
