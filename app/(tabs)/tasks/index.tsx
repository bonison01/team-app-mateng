//Users/apple/attendance-app/app/(tabs)/tasks/index.tsx
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function TasksDashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tasks</Text>

      <Pressable
        style={styles.card}
        onPress={() => router.push("/tasks/list")}
      >
        <Text style={styles.cardTitle}>My Tasks</Text>
        <Text style={styles.cardSub}>
          Tasks assigned to me & by me
        </Text>
      </Pressable>

      <Pressable
        style={styles.card}
        onPress={() => router.push("/tasks/assign-task")}
      >
        <Text style={styles.cardTitle}>Assign Task</Text>
        <Text style={styles.cardSub}>
          Create and assign tasks
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 16 },
  card: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "700" },
  cardSub: { fontSize: 12, color: "#555", marginTop: 4 },
});
