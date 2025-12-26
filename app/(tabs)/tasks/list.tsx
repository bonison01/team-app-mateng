//Users/apple/attendance-app/app/(tabs)/tasks/list.tsx
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

/* ================= TYPES ================= */

type Task = {
  id: string;
  title: string;
  status: "in_progress" | "done" | "pending";
  priority: "high" | "medium" | "low";
  created_at?: string;
  due_date?: string | null;
  progress?: number;
  from_name?: string;
  to_name?: string;
};

type Tab = "received" | "assigned";
type StatusFilter = "all" | "pending" | "done";
type SortOrder = "asc" | "desc";

/* ================= HELPERS ================= */

const normalizeStatus = (status: string): "pending" | "done" =>
  status === "done" ? "done" : "pending";

const formatDate = (d?: string | null) =>
  d ? new Date(d.replace(" ", "T")).toDateString() : "—";

const priorityColor: Record<string, string> = {
  high: "#e74c3c",
  medium: "#f1c40f",
  low: "#2ecc71",
};

/* ================= COMPONENT ================= */

export default function TaskList() {
  const [tab, setTab] = useState<Tab>("received");
  const [received, setReceived] = useState<Task[]>([]);
  const [assigned, setAssigned] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  /* SEARCH / FILTER / SORT */
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
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

  /* ================= FILTERED DATA ================= */

  const data = useMemo(() => {
    let base = tab === "received" ? received : assigned;

    // SEARCH
    if (search.trim()) {
      const q = search.toLowerCase();
      base = base.filter((t) => t.title.toLowerCase().includes(q));
    }

    // STATUS FILTER
    if (statusFilter !== "all") {
      base = base.filter(
        (t) => normalizeStatus(t.status) === statusFilter
      );
    }

    // SORT BY DUE DATE
    base = [...base].sort((a, b) => {
      if (!a.due_date && !b.due_date) return 0;
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;

      const da = new Date(a.due_date).getTime();
      const db = new Date(b.due_date).getTime();
      return sortOrder === "asc" ? da - db : db - da;
    });

    return base;
  }, [received, assigned, tab, search, statusFilter, sortOrder]);

  if (loading) return <ActivityIndicator style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.title}>My Tasks</Text>

        <View style={styles.headerRight}>
          <Pressable
            style={styles.iconBtn}
            onPress={() => setShowFilters((p) => !p)}
          >
            <Text style={styles.icon}>☰</Text>
          </Pressable>

          <Pressable
            style={styles.assignBtn}
            onPress={() => router.push("/tasks/assign-task")}
          >
            <Text style={styles.assignText}>＋</Text>
          </Pressable>
        </View>
      </View>

      {/* SEARCH */}
      <TextInput
        placeholder="Search tasks..."
        value={search}
        onChangeText={setSearch}
        style={styles.search}
      />

      {/* FILTER PANEL (HIDDEN / TOGGLE) */}
      {showFilters && (
        <View style={styles.filterPanel}>
          <View style={styles.filterRow}>
            {["all", "pending", "done"].map((s) => (
              <Pressable
                key={s}
                style={[
                  styles.filterBtn,
                  statusFilter === s && styles.filterActive,
                ]}
                onPress={() => setStatusFilter(s as StatusFilter)}
              >
                <Text>{s.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            style={styles.sortBtn}
            onPress={() =>
              setSortOrder((p) => (p === "asc" ? "desc" : "asc"))
            }
          >
            <Text>Due Date {sortOrder === "asc" ? "↑" : "↓"}</Text>
          </Pressable>
        </View>
      )}

      {/* TABS */}
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tabBtn, tab === "received" && styles.tabActive]}
          onPress={() => setTab("received")}
        >
          <Text>Received</Text>
        </Pressable>
        <Pressable
          style={[styles.tabBtn, tab === "assigned" && styles.tabActive]}
          onPress={() => setTab("assigned")}
        >
          <Text>Assigned</Text>
        </Pressable>
      </View>

      {/* LIST */}
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ paddingBottom: 40 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No tasks found</Text>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => router.push(`/tasks/${item.id}`)}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>

            <Text style={styles.meta}>
              {tab === "received"
                ? `From: ${item.from_name ?? "—"}`
                : `To: ${item.to_name ?? "—"}`}
            </Text>

            <Text style={styles.meta}>
              Progress: {item.progress ?? 0}%
            </Text>

            <Text style={styles.meta}>
              Assigned: {formatDate(item.created_at)}
            </Text>

            {item.due_date && (
              <Text style={styles.meta}>
                Due: {formatDate(item.due_date)}
              </Text>
            )}

            <View style={styles.badgeRow}>
              <Text
                style={[
                  styles.badge,
                  { backgroundColor: priorityColor[item.priority] },
                ]}
              >
                {item.priority.toUpperCase()}
              </Text>

              <Text
                style={[
                  styles.status,
                  normalizeStatus(item.status) === "done"
                    ? styles.done
                    : styles.pending,
                ]}
              >
                {normalizeStatus(item.status).toUpperCase()}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#fafafa" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerRight: { flexDirection: "row", alignItems: "center" },

  title: { fontSize: 24, fontWeight: "700" },

  iconBtn: {
    padding: 8,
    marginRight: 6,
    borderRadius: 8,
    borderWidth: 1,
  },

  icon: { fontSize: 16 },

  assignBtn: {
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },

  assignText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  search: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginVertical: 10,
    backgroundColor: "#fff",
  },

  filterPanel: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },

  filterRow: { flexDirection: "row", marginBottom: 8 },

  filterBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: 8,
    marginRight: 6,
  },

  filterActive: {
    backgroundColor: "#eaf4ff",
    borderColor: "#3498db",
  },

  sortBtn: {
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: "center",
  },

  tabs: { flexDirection: "row", marginBottom: 10 },

  tabBtn: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderRadius: 10,
    marginRight: 6,
    alignItems: "center",
    backgroundColor: "#fff",
  },

  tabActive: {
    backgroundColor: "#eaf4ff",
    borderColor: "#3498db",
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    elevation: 2,
  },

  cardTitle: { fontSize: 16, fontWeight: "700" },

  meta: { fontSize: 12, color: "#666", marginTop: 4 },

  badgeRow: { flexDirection: "row", marginTop: 8 },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginRight: 8,
    fontSize: 11,
  },

  status: { fontSize: 11, fontWeight: "700" },
  done: { color: "#2ecc71" },
  pending: { color: "#e67e22" },

  empty: {
    textAlign: "center",
    marginTop: 40,
    color: "#777",
  },
});
