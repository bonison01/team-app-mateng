import { useEffect, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { supabase } from "../../../lib/supabase";

/* ================= TYPES ================= */

type Task = {
  id: string;
  title: string;
  priority: string;
  due_date: string | null;
};

/* ================= COMPONENT ================= */

export default function TaskCalendar() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  useEffect(() => {
    loadTasks();
  }, []);

  /* ================= LOAD TASKS ================= */

  const loadTasks = async () => {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      console.log("User not logged in");
      return;
    }

    const userId = data.user.id;

    const { data: taskData, error: taskError } =
      await supabase.rpc("get_tasks_received", {
        p_user_id: userId,
      });

    if (taskError) {
      console.error(taskError);
      return;
    }

    setTasks(taskData || []);
  };

  /* ================= FILTER BY DATE ================= */

  const dailyTasks = tasks.filter(
    (t) => t.due_date === selectedDate
  );

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      <Calendar
        onDayPress={(day) => {
          // day.dateString is always a string: "YYYY-MM-DD"
          setSelectedDate(day.dateString);
        }}
      />

      {selectedDate ? (
        <Text style={styles.dateTitle}>
          Tasks on {selectedDate}
        </Text>
      ) : (
        <Text style={styles.dateTitle}>
          Select a date
        </Text>
      )}

      <FlatList
        data={dailyTasks}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No tasks for this date
          </Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.meta}>
              Priority: {item.priority}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },

  dateTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginVertical: 10,
  },

  card: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },

  title: {
    fontWeight: "700",
  },

  meta: {
    fontSize: 12,
    color: "#555",
    marginTop: 2,
  },

  empty: {
    marginTop: 20,
    color: "#777",
    textAlign: "center",
  },
});
