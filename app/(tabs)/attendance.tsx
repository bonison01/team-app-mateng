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
  Pressable,
  Text,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import type { AttendanceRow } from "../../types/app";
import { styles } from "./attendance.styles";

type ClockType = "in" | "out";

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];
const todayDate = new Date().toISOString().slice(0, 10);

/* ================= TIME HELPERS (IST SAFE) ================= */

// ALWAYS display in IST
const formatTime = (iso?: string | null) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Kolkata",
  });
};

// Current time in UTC (safe for DB)
const nowUTC = () => new Date();

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
    if (!auth.user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("user_id", auth.user.id)
      .order("date", { ascending: false });

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
    return Array.from(
      { length: new Date(y, m + 1, 0).getDate() },
      (_, i) => new Date(y, m, i + 1).toISOString().slice(0, 10)
    );
  };

  const getDayStyle = (d: string) => {
    const r = attendanceMap[d];
    if (!r) return styles.dayAbsent;
    if (r.check_in_time && !r.check_out_time)
      return styles.dayIncomplete;
    return styles.dayPresent;
  };

  /* ================= CAMERA ================= */
  const openCamera = async (type: ClockType) => {
    if (!isToday) {
      Alert.alert("Clock allowed only for today");
      return;
    }

    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;

    const res = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
    });

    if (res.canceled) return;

    setPhotoUri(res.assets[0].uri);
    setClockType(type);
    setCurrentTime(nowUTC()); // ✅ UTC reference
    setClockModal(true);
  };

  /* ================= CONFIRM ================= */
  const confirmClock = async () => {
    if (!photoUri || !currentTime) return;

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    const loc = await Location.getCurrentPositionAsync({});

    if (clockType === "in") {
      await supabase.from("attendance").insert({
        user_id: auth.user.id,
        date: todayDate,
        check_in_time: currentTime.toISOString(), // ✅ UTC ISO
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        status: "present",
      });
    } else {
      const checkInMs = new Date(
        todayRecord!.check_in_time!
      ).getTime();
      const checkOutMs = currentTime.getTime();

      const hours =
        (checkOutMs - checkInMs) / (1000 * 60 * 60);

      await supabase
        .from("attendance")
        .update({
          check_out_time: currentTime.toISOString(), // ✅ UTC ISO
          working_hours: Number(hours.toFixed(2)),
        })
        .eq("id", todayRecord!.id);
    }

    setClockModal(false);
    setPhotoUri(null);
    fetchAttendance();
  };

  /* ================= UI ================= */
  return (
    <View style={styles.container}>
      {/* TOP BAR */}
      <View style={styles.topBar}>
        <Text style={styles.topDate}>{selectedDate}</Text>
        <Pressable onPress={() => setCalendarVisible(true)}>
          <Ionicons name="calendar" size={22} color="#34D399" />
        </Pressable>
      </View>

      {/* LIST */}
      {loading ? (
        <ActivityIndicator />
      ) : (
        <FlatList
          data={filteredAttendance}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
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
          )}
        />
      )}

      {/* CLOCK IN */}
      <Pressable
        style={[
          styles.fab,
          {
            bottom: 90,
            backgroundColor:
              !isToday || clockedIn || completedToday
                ? "#374151"
                : "#34D399",
          },
        ]}
        disabled={!isToday || clockedIn || completedToday}
        onPress={() => openCamera("in")}
      >
        <Ionicons name="log-in" size={24} color="#000" />
      </Pressable>

      {/* CLOCK OUT */}
      <Pressable
        style={[
          styles.fab,
          {
            bottom: 20,
            backgroundColor:
              !clockedIn || completedToday ? "#374151" : "#EF4444",
          },
        ]}
        disabled={!clockedIn || completedToday}
        onPress={() => openCamera("out")}
      >
        <Ionicons name="log-out" size={24} color="#fff" />
      </Pressable>

      {/* CAMERA MODAL */}
      <Modal transparent visible={clockModal}>
        <View style={styles.modal}>
          {photoUri && (
            <Image source={{ uri: photoUri }} style={styles.preview} />
          )}
          <Text style={styles.timeText}>
            {formatTime(currentTime?.toISOString())}
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
              <Text style={styles.calendarTitle}>
                {new Date(selectedDate).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
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
