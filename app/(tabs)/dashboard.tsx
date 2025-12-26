//Users/apple/attendance-app/app/(tabs)/dashboard.tsx
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

/* ================= HELPERS ================= */

const normalizeStatus = (status: string) =>
  status === "done" ? "done" : "pending";

const todayDate = new Date().toISOString().slice(0, 10);

/* ================= COMPONENT ================= */

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  const [pendingCount, setPendingCount] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);
  const [attendanceAlert, setAttendanceAlert] = useState<
    "ok" | "clock_in" | "clock_out"
  >("ok");

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const userId = auth.user.id;

    /* ================= TASKS ================= */

    const [receivedRes, assignedRes] = await Promise.all([
      supabase.rpc("get_tasks_received", { p_user_id: userId }),
      supabase.rpc("get_tasks_assigned_by_me", { p_user_id: userId }),
    ]);

    const allTasks = [
      ...(receivedRes.data || []),
      ...(assignedRes.data || []),
    ];

    // ✅ Pending count (same logic as list screen)
    const pending = allTasks.filter(
      (t) => normalizeStatus(t.status) === "pending"
    ).length;

    setPendingCount(pending);

    /* ================= TASK UPDATES (LAST 7 DAYS) ================= */

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: updates } = await supabase
      .from("task_updates")
      .select("created_at")
      .in(
        "task_id",
        allTasks.map((t) => t.id)
      )
      .gte("created_at", sevenDaysAgo.toISOString());

    setUpdateCount(updates?.length || 0);

    /* ================= ATTENDANCE ================= */

    const { data: attendance } = await supabase
      .from("attendance")
      .select("check_in_time, check_out_time")
      .eq("user_id", userId)
      .eq("date", todayDate)
      .single();

    if (!attendance) {
      setAttendanceAlert("clock_in");
    } else if (
      attendance.check_in_time &&
      !attendance.check_out_time
    ) {
      setAttendanceAlert("clock_out");
    } else {
      setAttendanceAlert("ok");
    }

    setLoading(false);
  };

  if (loading) {
    return <ActivityIndicator style={{ marginTop: 40 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>

      {/* TASK CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📌 Tasks</Text>

        <Text style={styles.metric}>
          Pending Tasks:{" "}
          <Text style={styles.bold}>{pendingCount}</Text>
        </Text>

        <Text style={styles.metric}>
          Updates (last 7 days):{" "}
          <Text style={styles.bold}>{updateCount}</Text>
        </Text>

        <Pressable
          style={styles.link}
          onPress={() => router.push("/tasks/list")}
        >
          <Text style={styles.linkText}>Open Tasks →</Text>
        </Pressable>
      </View>

      {/* ATTENDANCE CARD */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>⏰ Attendance</Text>

        {attendanceAlert === "clock_in" && (
          <Text style={styles.alert}>
            ❌ Clock-in required today
          </Text>
        )}

        {attendanceAlert === "clock_out" && (
          <Text style={styles.alert}>
            ⚠️ Clock-out pending
          </Text>
        )}

        {attendanceAlert === "ok" && (
          <Text style={styles.ok}>✅ Attendance completed</Text>
        )}

        <Pressable
          style={styles.link}
          onPress={() => router.push("/attendance")}
        >
          <Text style={styles.linkText}>Open Attendance →</Text>
        </Pressable>
      </View>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#f9fafb",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
    marginBottom: 16,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  metric: {
    fontSize: 14,
    marginBottom: 6,
  },

  bold: {
    fontWeight: "700",
  },

  alert: {
    color: "#dc2626",
    fontWeight: "700",
    marginBottom: 6,
  },

  ok: {
    color: "#16a34a",
    fontWeight: "700",
    marginBottom: 6,
  },

  link: {
    marginTop: 10,
  },

  linkText: {
    color: "#2563eb",
    fontWeight: "600",
  },
});
