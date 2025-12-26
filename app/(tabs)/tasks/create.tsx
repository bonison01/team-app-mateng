import { useEffect, useState } from "react";
import {
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
  full_name: string;
};

export default function CreateTask() {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  useEffect(() => {
    loadAssignableUsers();
  }, []);

  const loadAssignableUsers = async () => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (error || !profile) {
    console.error("Profile not found");
    return;
  }

  // ✅ ADMIN → can assign to everyone
  if (profile.role === "admin") {
    const { data } = await supabase
      .from("profiles")
      .select("id, full_name");

    setUsers(data || []);
  } 
  // ✅ MANAGER → only permitted team members
  else {
    const { data } = await supabase
      .from("team_permissions")
      .select("member_id, profiles(full_name)")
      .eq("manager_id", auth.user.id);

    setUsers(
      data?.map((d: any) => ({
        id: d.member_id,
        full_name: d.profiles.full_name,
      })) || []
    );
  }
};


  const createTask = async () => {
    if (!selectedUser || !title) {
      Alert.alert("Fill all fields");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    await supabase.from("tasks").insert({
      title,
      description: desc,
      assigned_by: auth.user.id,
      assigned_to: selectedUser.id,
    });

    Alert.alert("Task assigned ✅");
    setTitle("");
    setDesc("");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Create Task</Text>

      <TextInput
        placeholder="Task title"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />

      <TextInput
        placeholder="Task description"
        value={desc}
        onChangeText={setDesc}
        style={styles.input}
      />

      <Text style={styles.sub}>Assign to</Text>

      <FlatList
        data={users}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <Pressable
            style={[
              styles.user,
              selectedUser?.id === item.id && styles.selected,
            ]}
            onPress={() => setSelectedUser(item)}
          >
            <Text>{item.full_name}</Text>
          </Pressable>
        )}
      />

      <Pressable style={styles.btn} onPress={createTask}>
        <Text style={styles.btnText}>Assign Task</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  heading: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  sub: { marginTop: 10, fontWeight: "600" },
  user: {
    padding: 10,
    borderWidth: 1,
    borderRadius: 8,
    marginVertical: 4,
  },
  selected: { backgroundColor: "#2ecc71" },
  btn: {
    backgroundColor: "#2ecc71",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
