import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

type User = {
  id: string;
  full_name: string | null;
  role: string | null;
};

const PRIORITIES = ["low", "medium", "high"];

export default function AssignTask() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    const { data, error } = await supabase.rpc(
      "get_assignable_users",
      { p_user_id: user.id }
    );

    if (error) {
      Alert.alert("Error", "Failed to load users");
    } else {
      setUsers(data || []);
    }

    setLoading(false);
  };

  const assignTask = async () => {
    if (!title || !selectedUser || !currentUserId) {
      return Alert.alert("Missing data", "Fill all required fields");
    }

    setSaving(true);
    setSuccess(false);

    const { error } = await supabase.rpc("create_task_rpc", {
      p_title: title,
      p_description: description,
      p_priority: priority,
      p_due_date: dueDate || null,
      p_assigned_by: currentUserId,
      p_assigned_to: selectedUser.id,
    });

    if (error) {
      console.error(error);
      Alert.alert("Error", "Failed to assign task");
      setSaving(false);
      return;
    }

    setSaving(false);
    setSuccess(true);
    setTitle("");
    setDescription("");
    setDueDate("");
    setPriority("medium");
    setSelectedUser(null);

    setTimeout(() => setSuccess(false), 2000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Assign Task</Text>

      {success && (
        <View style={styles.successBox}>
          <Text style={styles.successText}>✅ Task assigned</Text>
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

      <TextInput
        placeholder="Due date (YYYY-MM-DD)"
        value={dueDate}
        onChangeText={setDueDate}
        style={styles.input}
      />

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

      {loading ? (
        <ActivityIndicator />
      ) : (
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
      )}

      <Pressable
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={assignTask}
        disabled={saving}
      >
        <Text style={styles.saveText}>
          {saving ? "Assigning..." : "Assign Task"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
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

  userRow: {
    padding: 12,
    borderBottomWidth: 0.5,
  },
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
});
