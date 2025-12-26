import { Stack } from "expo-router";

export default function TasksLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{ title: "Tasks" }}
      />
      <Stack.Screen
        name="list"
        options={{ title: "My Tasks" }}
      />
      <Stack.Screen
        name="assign-task"
        options={{ title: "Assign Task" }}
      />
    </Stack>
  );
}
