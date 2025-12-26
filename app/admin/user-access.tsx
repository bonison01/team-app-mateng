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

/* ================= TYPES ================= */

type User = {
  id: string;
  full_name: string | null;
  role: string | null;
};

/* ================= COMPONENT ================= */

export default function UserAccessManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<User | null>(null);
  const [allowedTargets, setAllowedTargets] = useState<string[]>([]);
  const [loadingAccess, setLoadingAccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  /* ================= INIT ================= */

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setCurrentUserId(user.id);
    await loadUsers(user.id);
  };

  /* ================= LOAD ALL USERS (RPC) ================= */

  const loadUsers = async (loggedInUserId: string) => {
    const { data, error } = await supabase.rpc(
      "get_all_profiles_for_admin"
    );

    if (error) {
      console.error("❌ Load users error:", error);
      Alert.alert("Error", "Failed to load users");
      return;
    }

    // ⛔ Exclude logged-in user
    setUsers((data || []).filter((u: User) => u.id !== loggedInUserId));
  };

  /* ================= LOAD USER ACCESS (RPC) ================= */

  const loadAccess = async (ownerId: string) => {
    setLoadingAccess(true);

    const { data, error } = await supabase.rpc(
      "admin_get_user_access",
      { p_owner_id: ownerId }
    );

    if (error) {
      console.error("❌ Load access error:", error);
      setLoadingAccess(false);
      return;
    }

    setAllowedTargets(data.map((d: any) => d.target_id));
    setLoadingAccess(false);
  };

  /* ================= AUTO LOAD ACCESS ON USER CHANGE ================= */

  useEffect(() => {
    if (selectedOwner?.id) {
      loadAccess(selectedOwner.id);
    }
  }, [selectedOwner]);

  /* ================= TOGGLE TARGET ================= */

  const toggleTarget = (targetId: string) => {
    if (!selectedOwner) return;

    setAllowedTargets((prev) =>
      prev.includes(targetId)
        ? prev.filter((id) => id !== targetId)
        : [...prev, targetId]
    );
  };

  /* ================= SAVE ACCESS (RPC) ================= */

  const saveAccess = async () => {
    if (!selectedOwner) return;

    setSaving(true);
    setSuccess(false);

    const { error } = await supabase.rpc(
      "admin_save_user_access",
      {
        p_owner_id: selectedOwner.id,
        p_target_ids: allowedTargets,
      }
    );

    if (error) {
      console.error("❌ Save access error:", error);
      setSaving(false);
      return Alert.alert("Error", "Failed to save access");
    }

    // 🔑 Reload from DB
    await loadAccess(selectedOwner.id);

    setSaving(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2000);
  };

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <Text style={styles.title}>User Access Control</Text>

      {/* SUCCESS MESSAGE */}
      {success && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            ✅ Access updated successfully
          </Text>
        </View>
      )}

      {/* OWNER SELECTION */}
      <Text style={styles.sub}>Select User (Assigner)</Text>
      <FlatList
        horizontal
        data={users}
        keyExtractor={(i) => i.id}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.userCard,
              selectedOwner?.id === item.id && styles.active,
            ]}
            onPress={() => setSelectedOwner(item)}
          >
            <Text style={styles.name}>
              {item.full_name || "Unnamed"}
            </Text>
            <Text style={styles.role}>{item.role}</Text>
          </Pressable>
        )}
      />

      {/* TARGET USERS */}
      {selectedOwner && (
        <>
          <Text style={styles.sub}>
            {selectedOwner.full_name || "This user"} can assign tasks to:
          </Text>

          {loadingAccess ? (
            <ActivityIndicator style={{ marginTop: 10 }} />
          ) : (
            <FlatList
              data={users}
              keyExtractor={(i) => i.id}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.memberRow}
                  onPress={() => toggleTarget(item.id)}
                >
                  <Text>
                    {item.full_name || "Unnamed"} ({item.role})
                  </Text>
                  <Text>
                    {allowedTargets.includes(item.id) ? "✅" : "⬜"}
                  </Text>
                </Pressable>
              )}
            />
          )}

          <Pressable
            style={[
              styles.saveBtn,
              saving && { opacity: 0.6 },
            ]}
            onPress={saveAccess}
            disabled={saving}
          >
            <Text style={styles.saveText}>
              {saving ? "Saving..." : "Save Access"}
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

  successBox: {
    backgroundColor: "#e8f8f0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#2ecc71",
  },
  successText: {
    color: "#1e8449",
    fontWeight: "700",
    textAlign: "center",
  },

  userCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginRight: 10,
    borderColor: "#ccc",
  },
  active: {
    backgroundColor: "#3498db",
    borderColor: "#3498db",
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

  saveBtn: {
    backgroundColor: "#3498db",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontWeight: "700" },
});
