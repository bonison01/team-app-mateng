//Users/apple/attendance-app/app/(tabs)/tasks/assign-task.tsx
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "../../../lib/supabase";

/* ================= TYPES ================= */

type User = {
  id: string;
  full_name: string | null;
  role: string | null;
  expo_push_token?: string | null;
};

const PRIORITIES = ["low", "medium", "high"];

/* ================= COMPONENT ================= */

export default function AssignTask() {
  const router = useRouter();

  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState<string | null>(null);

  const [showCalendar, setShowCalendar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  /* ================= INIT ================= */

  const init = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;

    setCurrentUserId(data.user.id);

    const { data: usersData, error } = await supabase.rpc(
      "get_assignable_users",
      { p_user_id: data.user.id }
    );

    if (error) {
      Alert.alert("Error", "Failed to load users");
    } else {
      setUsers(usersData || []);
    }

    setLoading(false);
  };

  /* ================= PUSH ================= */

  const sendPushNotification = async (
    expoPushToken: string,
    taskTitle: string
  ) => {
    await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: expoPushToken,
        sound: "default",
        title: "📌 New Task Assigned",
        body: taskTitle,
      }),
    });
  };

  /* ================= ASSIGN TASK ================= */

  const assignTask = async () => {
    if (!title || !selectedUser || !currentUserId || !dueDate) {
      return Alert.alert("Missing data", "Fill all required fields");
    }

    setSaving(true);

    const { error } = await supabase.rpc("create_task_rpc", {
      p_assigned_by: currentUserId,
      p_assigned_to: selectedUser.id,
      p_title: title,
      p_description: description,
      p_priority: priority,
      p_due_date: dueDate,
    });

    if (error) {
      Alert.alert("Error", "Failed to assign task");
      setSaving(false);
      return;
    }

    // 🔔 Push
    if (selectedUser.expo_push_token) {
      await sendPushNotification(selectedUser.expo_push_token, title);
    }

    setSuccess(true);

    // ✅ Redirect to task list
    setTimeout(() => {
      router.replace("/tasks/list");
    }, 800);
  };

  /* ================= LOADING ================= */

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#3498db" />
        <Text style={{ marginTop: 10 }}>Loading users…</Text>
      </View>
    );
  }

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* 🔙 BACK BUTTON */}
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Assign Task</Text>

      {success && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>
            ✅ Task created, redirecting…
          </Text>
        </View>
      )}

      <TextInput
        placeholder="Task title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        multiline
        style={[styles.input, { height: 80 }]}
      />

      <Pressable
        style={styles.input}
        onPress={() => setShowCalendar(true)}
      >
        <Text style={{ color: dueDate ? "#000" : "#888" }}>
          {dueDate || "Select due date"}
        </Text>
      </Pressable>

      <Text style={styles.label}>Priority</Text>
      <View style={styles.row}>
        {PRIORITIES.map((p) => (
          <Pressable
            key={p}
            style={[
              styles.priorityBtn,
              priority === p && styles.priorityActive,
            ]}
            onPress={() => setPriority(p)}
          >
            <Text style={styles.priorityText}>{p.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Assign To</Text>
      <FlatList
        data={users}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.userRow,
              selectedUser?.id === item.id && styles.activeRow,
            ]}
            onPress={() => setSelectedUser(item)}
          >
            <Text>{item.full_name || "Unnamed"}</Text>
            <Text style={styles.role}>{item.role}</Text>
          </Pressable>
        )}
      />

      <Pressable
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={assignTask}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>Assign Task</Text>
        )}
      </Pressable>

      {/* 📅 CALENDAR */}
      <Modal visible={showCalendar} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Calendar
              onDayPress={(day) => {
                setDueDate(day.dateString);
                setShowCalendar(false);
              }}
            />
            <Pressable
              style={styles.modalClose}
              onPress={() => setShowCalendar(false)}
            >
              <Text style={{ fontWeight: "700" }}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { padding: 16 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },

  back: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
  },

  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },

  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },

  label: { fontWeight: "600", marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 12 },

  priorityBtn: {
    borderWidth: 1,
    padding: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  priorityActive: { backgroundColor: "#3498db" },
  priorityText: { fontWeight: "700" },

  userRow: { padding: 12, borderBottomWidth: 0.5 },
  activeRow: { backgroundColor: "#eaf3ff" },
  role: { fontSize: 12, color: "#555" },

  saveBtn: {
    backgroundColor: "#3498db",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 10,
  },
  saveText: { color: "#fff", fontWeight: "700" },

  successBox: {
    backgroundColor: "#e8f8f0",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  successText: {
    color: "#1e8449",
    fontWeight: "700",
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    margin: 20,
    borderRadius: 12,
    padding: 10,
  },
  modalClose: {
    alignItems: "center",
    padding: 10,
  },
});
