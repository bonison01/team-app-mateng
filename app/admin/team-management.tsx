import { useEffect, useState } from "react";
import {
    Alert,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { supabase } from "../../lib/supabase";

type User = {
  id: string;
  full_name: string | null;
  role: string | null;
};

export default function TeamManagement() {
  const [managers, setManagers] = useState<User[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [selectedManager, setSelectedManager] = useState<User | null>(null);
  const [allowedMembers, setAllowedMembers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  /* ================= LOAD USERS ================= */
  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, role");

    if (error) {
      console.error("Load users error:", error);
      return;
    }

    setManagers(data.filter((u) => u.role !== "staff"));
    setMembers(data.filter((u) => u.role === "staff"));
  };

  /* ================= LOAD PERMISSIONS ================= */
  const loadPermissions = async (managerId: string) => {
    setLoading(true);

    const { data, error } = await supabase
      .from("team_permissions")
      .select("member_id")
      .eq("manager_id", managerId);

    if (error) {
      console.error("Load permissions error:", error);
      setLoading(false);
      return;
    }

    setAllowedMembers(data.map((d) => d.member_id));
    setLoading(false);
  };

  /* ================= TOGGLE MEMBER ================= */
  const toggleMember = (memberId: string) => {
    if (!selectedManager) return;
    if (memberId === selectedManager.id) return;

    setAllowedMembers((prev) =>
      prev.includes(memberId)
        ? prev.filter((id) => id !== memberId)
        : [...prev, memberId]
    );
  };

  /* ================= SAVE PERMISSIONS ================= */
  const savePermissions = async () => {
    if (!selectedManager) return;

    setLoading(true);

    const { error: deleteError } = await supabase
      .from("team_permissions")
      .delete()
      .eq("manager_id", selectedManager.id);

    if (deleteError) {
      console.error(deleteError);
      setLoading(false);
      return Alert.alert("Error", "Failed to update permissions");
    }

    const rows = allowedMembers.map((memberId) => ({
      manager_id: selectedManager.id,
      member_id: memberId,
    }));

    if (rows.length > 0) {
      const { error: insertError } = await supabase
        .from("team_permissions")
        .insert(rows);

      if (insertError) {
        console.error(insertError);
        setLoading(false);
        return Alert.alert("Error", "Failed to save permissions");
      }
    }

    setLoading(false);
    Alert.alert("Success", "Team access updated ✅");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Team Management</Text>

      {/* MANAGERS */}
      <Text style={styles.sub}>Select Manager</Text>
      <FlatList
        horizontal
        data={managers}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.managerCard,
              selectedManager?.id === item.id && styles.active,
            ]}
            onPress={() => {
              setSelectedManager(item);
              loadPermissions(item.id);
            }}
          >
            <Text style={styles.name}>
              {item.full_name || "Unnamed"}
            </Text>
            <Text style={styles.role}>{item.role}</Text>
          </Pressable>
        )}
      />

      {/* MEMBERS */}
      {selectedManager && (
        <>
          <Text style={styles.sub}>
            Team members for {selectedManager.full_name}
          </Text>

          {members.length === 0 ? (
            <Text style={styles.empty}>No staff users found</Text>
          ) : (
            <FlatList
              data={members}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.memberRow}
                  onPress={() => toggleMember(item.id)}
                >
                  <Text>{item.full_name || "Unnamed"}</Text>
                  <Text>
                    {allowedMembers.includes(item.id) ? "✅" : "⬜"}
                  </Text>
                </Pressable>
              )}
            />
          )}

          <Pressable
            style={[styles.saveBtn, loading && { opacity: 0.6 }]}
            onPress={savePermissions}
            disabled={loading}
          >
            <Text style={styles.saveText}>
              {loading ? "Saving..." : "Save Access"}
            </Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  sub: { marginTop: 14, fontWeight: "600" },

  managerCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    borderColor: "#ccc",
  },
  active: {
    backgroundColor: "#2ecc71",
    borderColor: "#2ecc71",
  },
  name: { fontWeight: "600" },
  role: { fontSize: 12 },

  memberRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
    borderBottomWidth: 0.5,
    borderColor: "#ddd",
  },

  empty: { marginTop: 10, color: "#888" },

  saveBtn: {
    backgroundColor: "#2ecc71",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
});
