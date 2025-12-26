import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type Profile = {
  id: string;
  full_name: string | null;
  role: string | null;
  department: string | null;
  is_active: boolean | null;
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  /* ================= AUTH + ADMIN CHECK ================= */

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/auth/adminlogin");
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || profile?.role !== "admin") {
      await supabase.auth.signOut();
      router.replace("/auth/adminlogin");
      return;
    }

    fetchProfiles();
  };

  /* ================= FETCH TEAM ================= */

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role, department, is_active")
      .order("created_at", { ascending: false });

    if (error) {
      Alert.alert("Error", "Failed to load team");
      setLoading(false);
      return;
    }

    setProfiles(data || []);
    setLoading(false);
  };

  /* ================= TOGGLE ACTIVE ================= */

  const toggleActive = async (id: string, current: boolean | null) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_active: !current })
      .eq("id", id);

    if (error) {
      Alert.alert("Error", "Update failed");
      return;
    }

    fetchProfiles();
  };

  /* ================= LOGOUT ================= */

  const logout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/adminlogin");
  };

  /* ================= UI ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#14710F" />
        <Text>Loading team...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Text style={styles.subtitle}>Access & Team Control</Text>

      {/* 🔐 USER ACCESS CONTROL */}
      <Pressable
        style={styles.accessBtn}
        onPress={() => router.push("/admin/user-access")}
      >
        <Text style={styles.btnTitle}>🔐 User Access Control</Text>
        <Text style={styles.btnSub}>
          Control who can assign tasks to whom
        </Text>
      </Pressable>

      {/* 👥 TEAM MANAGEMENT */}
      <Pressable
        style={styles.teamBtn}
        onPress={() => router.push("/admin/team-management-page")}
      >
        <Text style={styles.btnTitle}>👥 Team Management</Text>
        <Text style={styles.btnSub}>
          Assign staff to managers & manage hierarchy
        </Text>
      </Pressable>

      {/* TEAM LIST */}
      <Text style={styles.sectionTitle}>All Users</Text>

      <FlatList
        data={profiles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.name}>
                {item.full_name || "Unnamed User"}
              </Text>
              <Text style={styles.meta}>
                Role: {item.role || "staff"}
              </Text>
              <Text style={styles.meta}>
                Dept: {item.department || "-"}
              </Text>
            </View>

            <Pressable
              style={[
                styles.statusBtn,
                { backgroundColor: item.is_active ? "#14710F" : "#999" },
              ]}
              onPress={() => toggleActive(item.id, item.is_active)}
            >
              <Text style={styles.statusText}>
                {item.is_active ? "Active" : "Inactive"}
              </Text>
            </Pressable>
          </View>
        )}
      />

      <Pressable style={styles.logoutBtn} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 14 },
  sectionTitle: { fontWeight: "700", marginBottom: 8 },

  accessBtn: {
    backgroundColor: "#3498db",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  teamBtn: {
    backgroundColor: "#2ecc71",
    padding: 16,
    borderRadius: 14,
    marginBottom: 18,
  },
  btnTitle: { fontSize: 16, fontWeight: "800" },
  btnSub: { fontSize: 12, marginTop: 4 },

  card: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#eee",
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 12, color: "#666" },

  statusBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: { color: "#fff", fontSize: 12, fontWeight: "600" },

  logoutBtn: {
    backgroundColor: "#c62828",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  logoutText: { color: "#fff", fontWeight: "700" },
});
