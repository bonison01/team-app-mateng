import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

type Task = {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  status: string;
  due_date: string | null;
  from_name?: string;
  to_name?: string;
};

type Tab = "received" | "assigned";

export default function TaskList() {
  const [tab, setTab] = useState<Tab>("received");
  const [received, setReceived] = useState<Task[]>([]);
  const [assigned, setAssigned] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [r1, r2] = await Promise.all([
      supabase.rpc("get_tasks_received", { p_user_id: user.id }),
      supabase.rpc("get_tasks_assigned_by_me", { p_user_id: user.id }),
    ]);

    setReceived(r1.data || []);
    setAssigned(r2.data || []);
    setLoading(false);
  };

  const priorityColor = (p: string) =>
    p === "high" ? "#e74c3c" : p === "medium" ? "#f1c40f" : "#2ecc71";

  const data = tab === "received" ? received : assigned;

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Tasks</Text>

      {/* TAB SWITCH */}
      <View style={styles.tabs}>
        <Pressable onPress={() => setTab("received")}>
          <Text style={tab === "received" ? styles.active : styles.inactive}>
            Received
          </Text>
        </Pressable>
        <Pressable onPress={() => setTab("assigned")}>
          <Text style={tab === "assigned" ? styles.active : styles.inactive}>
            Assigned
          </Text>
        </Pressable>
      </View>

      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No tasks</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>

            <Text style={{ color: priorityColor(item.priority) }}>
              Priority: {item.priority.toUpperCase()}
            </Text>

            <Text>Status: {item.status}</Text>

            {tab === "received" && (
              <Text style={styles.meta}>
                From: {item.from_name || "Unknown"}
              </Text>
            )}

            {tab === "assigned" && (
              <Text style={styles.meta}>
                To: {item.to_name || "Unknown"}
              </Text>
            )}

            {item.due_date && (
              <Text style={styles.meta}>Due: {item.due_date}</Text>
            )}

            {item.description && (
              <Text style={styles.desc}>{item.description}</Text>
            )}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },

  tabs: { flexDirection: "row", marginBottom: 12 },
  active: { fontWeight: "700", marginRight: 16 },
  inactive: { color: "#777", marginRight: 16 },

  empty: { marginTop: 20, color: "#666", textAlign: "center" },

  card: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontWeight: "700", fontSize: 16 },
  meta: { fontSize: 12, marginTop: 4 },
  desc: { fontSize: 12, color: "#555", marginTop: 6 },
});
