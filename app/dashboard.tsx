//Users/apple/attendance-app/app/dashboard.tsx
import * as Location from "expo-location";
import { Alert, Button, Text, View } from "react-native";
import { supabase } from "../lib/supabase";

export default function Dashboard() {
  const checkIn = async () => {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      Alert.alert("Permission denied");
      return;
    }

    const location = await Location.getCurrentPositionAsync({});
    const { latitude, longitude } = location.coords;

    const user = (await supabase.auth.getUser()).data.user;

    if (!user) return;

    await supabase.from("attendance").insert({
      user_id: user.id,
      latitude,
      longitude,
      check_in_time: new Date(),
    });

    Alert.alert("Checked In Successfully");
  };

  return (
    <View style={{ padding: 20, marginTop: 100 }}>
      <Text style={{ fontSize: 22, marginBottom: 20 }}>
        Attendance
      </Text>

      <Button title="Check In (GPS)" onPress={checkIn} />
    </View>
  );
}
