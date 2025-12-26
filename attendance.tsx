import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { supabase } from "./lib/supabase";
import type { AttendanceRow } from "./types/app";

type ClockType = "in" | "out";
const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

const todayDate = new Date().toISOString().slice(0, 10);

/* ================= HELPERS ================= */

const formatTime = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

/* ================= COMPONENT ================= */

export default function AttendanceScreen() {
  const [attendance, setAttendance] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(false);

  const [selectedDate, setSelectedDate] = useState(todayDate);
  const [calendarVisible, setCalendarVisible] = useState(false);

  const [clockModal, setClockModal] = useState(false);
  const [clockType, setClockType] = useState<ClockType>("in");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  useEffect(() => {
    fetchAttendance();
  }, []);

  /* ================= FETCH ================= */

  const fetchAttendance = async () => {
    setLoading(true);
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return setLoading(false);

    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("date", { ascending: false });

    if (error) Alert.alert("Error", error.message);
    setAttendance(data || []);
    setLoading(false);
  };

  /* ================= FILTER ================= */

  const filteredAttendance = useMemo(
    () => attendance.filter((a) => a.date === selectedDate),
    [attendance, selectedDate]
  );

  const todayRecord = filteredAttendance[0];
  const clockedIn =
    !!todayRecord?.check_in_time && !todayRecord?.check_out_time;
  const completedToday =
    !!todayRecord?.check_in_time && !!todayRecord?.check_out_time;

  const isToday = selectedDate === todayDate;

  /* ================= CALENDAR ================= */

  const attendanceMap = useMemo(() => {
    const map: Record<string, AttendanceRow> = {};
    attendance.forEach((a) => a.date && (map[a.date] = a));
    return map;
  }, [attendance]);

  const getMonthDays = () => {
    const d = new Date(selectedDate);
    const y = d.getFullYear();
    const m = d.getMonth();
    const days = new Date(y, m + 1, 0).getDate();

    return Array.from({ length: days }, (_, i) => {
      const day = new Date(y, m, i + 1);
      return day.toISOString().slice(0, 10);
    });
  };

  const getDayStyle = (date: string) => {
    const r = attendanceMap[date];
    if (!r) return styles.dayAbsent;
    if (r.check_in_time && !r.check_out_time)
      return styles.dayIncomplete;
    return styles.dayPresent;
  };

  const monthLabel = new Date(selectedDate).toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  /* ================= CAMERA ================= */

  const openCamera = async (type: ClockType) => {
    if (!isToday)
      return Alert.alert("Clock allowed only for today");

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return Alert.alert("Camera permission required");

    const res = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.7,
    });

    if (res.canceled) return;

    setPhotoUri(res.assets[0].uri);
    setClockType(type);
    setCurrentTime(new Date());
    setClockModal(true);
  };

  /* ================= CONFIRM ================= */

  const confirmClock = async () => {
    if (!photoUri || !currentTime) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const loc = await Location.getCurrentPositionAsync({});

    if (clockType === "in") {
      const { error } = await supabase.from("attendance").insert({
        user_id: auth.user.id,
        date: todayDate,
        check_in_time: currentTime.toISOString(),
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        status: "present",
      });
      if (error) return Alert.alert(error.message);
    } else {
      const checkInMs = new Date(
        todayRecord!.check_in_time!
      ).getTime();
      const checkOutMs = currentTime.getTime();

      const hours =
        (checkOutMs - checkInMs) / (1000 * 60 * 60);

      const { error } = await supabase
        .from("attendance")
        .update({
          check_out_time: currentTime.toISOString(),
          working_hours: Number(hours.toFixed(2)),
        })
        .eq("id", todayRecord!.id);

      if (error) return Alert.alert(error.message);
    }

    setClockModal(false);
    setPhotoUri(null);
    fetchAttendance();
  };

  /* ================= RENDER ITEM ================= */

  const renderItem = ({ item }: { item: AttendanceRow }) => (
    <View style={styles.card}>
      <Text style={styles.cardDate}>{item.date}</Text>

      <Text style={styles.text}>
        In: {formatTime(item.check_in_time)}
      </Text>

      <Text style={styles.text}>
        Out: {formatTime(item.check_out_time)}
      </Text>

      {item.working_hours && (
        <Text style={styles.hours}>
          ⏱ {item.working_hours} hrs
        </Text>
      )}
    </View>
  );

  /* ================= UI ================= */

  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={styles.topDate}>{selectedDate}</Text>

        <Pressable onPress={() => setCalendarVisible(true)}>
          <Ionicons name="calendar" size={22} color="#2ecc71" />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#2ecc71" />
      ) : (
        <FlatList
          data={filteredAttendance}
          keyExtractor={(i) => i.id}
          renderItem={renderItem}
        />
      )}

      {/* FLOATING BUTTONS */}
      <Pressable
        style={[
          styles.fab,
          {
            bottom: 90,
            backgroundColor:
              !isToday || clockedIn || completedToday
                ? "#555"
                : "#2ecc71",
          },
        ]}
        disabled={!isToday || clockedIn || completedToday}
        onPress={() => openCamera("in")}
      >
        <Ionicons name="log-in" size={24} color="#fff" />
      </Pressable>

      <Pressable
        style={[
          styles.fab,
          {
            bottom: 20,
            backgroundColor:
              !clockedIn || completedToday
                ? "#555"
                : "#e74c3c",
          },
        ]}
        disabled={!clockedIn || completedToday}
        onPress={() => openCamera("out")}
      >
        <Ionicons name="log-out" size={24} color="#fff" />
      </Pressable>

      {/* CLOCK MODAL */}
      <Modal transparent visible={clockModal}>
        <View style={styles.modal}>
          {photoUri &&
            (Platform.OS === "web" ? (
              <img src={photoUri} style={styles.webImg} />
            ) : (
              <Image source={{ uri: photoUri }} style={styles.preview} />
            ))}

          <Text style={styles.timeText}>
            {currentTime?.toLocaleTimeString("en-IN")}
          </Text>

          <Pressable style={styles.confirmBtn} onPress={confirmClock}>
            <Text style={styles.confirmText}>Confirm</Text>
          </Pressable>
        </View>
      </Modal>

      {/* CALENDAR MODAL */}
      <Modal transparent visible={calendarVisible}>
        <View style={styles.calendarOverlay}>
          <View style={styles.calendarCard}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>{monthLabel}</Text>
              <Pressable onPress={() => setCalendarVisible(false)}>
                <Ionicons name="close" size={22} color="#fff" />
              </Pressable>
            </View>

            <View style={styles.weekRow}>
              {WEEKDAYS.map((d) => (
                <Text key={d} style={styles.weekDay}>
                  {d}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {getMonthDays().map((d) => (
                <Pressable
                  key={d}
                  onPress={() => {
                    setSelectedDate(d);
                    setCalendarVisible(false);
                  }}
                  style={[
                    styles.dayCell,
                    getDayStyle(d),
                    d === selectedDate && styles.daySelected,
                  ]}
                >
                  <Text style={styles.dayText}>
                    {Number(d.slice(8))}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0b0b0b" },

  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 14,
  },
  topDate: { color: "#fff", fontSize: 16 },

  card: {
    backgroundColor: "#151515",
    padding: 16,
    margin: 10,
    borderRadius: 14,
  },
  cardDate: { color: "#2ecc71", fontWeight: "600" },
  text: { color: "#fff", marginTop: 6 },
  hours: { color: "#f1c40f", marginTop: 6 },

  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
  },

  modal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  preview: { width: 120, height: 120, borderRadius: 60 },
  webImg: {
    width: 120,
    height: 120,
    borderRadius: "50%",
    objectFit: "cover",
  },
  timeText: { color: "#fff", marginTop: 10 },
  confirmBtn: {
    backgroundColor: "#2ecc71",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 20,
  },
  confirmText: { color: "#000", fontWeight: "600" },

  calendarOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "center",
    alignItems: "center",
  },
  calendarCard: {
    backgroundColor: "#1a1a1a",
    width: "85%",
    padding: 14,
    borderRadius: 16,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  calendarTitle: {
    color: "#2ecc71",
    fontWeight: "700",
    fontSize: 18,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  weekDay: {
    width: "13%",
    textAlign: "center",
    color: "#777",
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 6,
  },
  dayCell: {
    width: "13%",
    aspectRatio: 1,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  dayText: { color: "#fff" },

  dayPresent: { backgroundColor: "#2ecc71" },
  dayIncomplete: { backgroundColor: "#f1c40f" },
  dayAbsent: { backgroundColor: "#e74c3c" },
  daySelected: { borderWidth: 2, borderColor: "#3498db" },
});
