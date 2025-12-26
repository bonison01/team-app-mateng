//Users/apple/attendance-app/app/(tabs)/tasks/[id].tsx
import Slider from "@react-native-community/slider";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { supabase } from "../../../lib/supabase";

/* ================= TYPES ================= */

type TaskUpdate = {
  id: string;
  user_name: string;
  progress: number;
  comment: string | null;
  links: string[] | null;
  images: string[] | null;
  created_at: string;
};

/* ================= HELPERS ================= */

const normalizeUrl = (url: string) => {
  const t = url.trim();
  if (!t) return null;
  if (!/^https?:\/\//i.test(t)) return `https://${t}`;
  return t;
};

const openLink = async (url: string) => {
  const fixed = normalizeUrl(url);
  if (!fixed) return;
  const supported = await Linking.canOpenURL(fixed);
  if (supported) Linking.openURL(fixed);
};

/* ================= COMPONENT ================= */

export default function TaskDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [comment, setComment] = useState("");
  const [progress, setProgress] = useState(0);
  const [links, setLinks] = useState<string[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    init();
  }, []);

  const init = async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    setUserId(data.user.id);
    loadUpdates();
  };

  const loadUpdates = async () => {
    const { data } = await supabase.rpc("get_task_updates", {
      p_task_id: id,
    });

    if (data) {
      setUpdates(data);
      if (data.length > 0) setProgress(data[0].progress);
    }
  };

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!res.canceled) {
      setImages((p) => [...p, res.assets[0].uri]);
    }
  };

  const submitUpdate = async () => {
    await supabase.rpc("add_task_update", {
      p_task_id: id,
      p_user_id: userId,
      p_progress: progress,
      p_comment: comment,
      p_links: links.map(normalizeUrl).filter(Boolean),
      p_images: images,
    });

    setComment("");
    setLinks([]);
    setImages([]);
    loadUpdates();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* BACK BUTTON */}
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>← Back</Text>
      </Pressable>

      <Text style={styles.title}>Task Progress</Text>

      <Text style={styles.label}>Progress: {progress}%</Text>
      <Slider
        value={progress}
        step={5}
        minimumValue={0}
        maximumValue={100}
        onValueChange={setProgress}
      />

      <TextInput
        placeholder="Comment"
        value={comment}
        onChangeText={setComment}
        style={styles.input}
        multiline
      />

      {/* LINKS */}
      <View style={styles.row}>
        <TextInput
          placeholder="Add link"
          value={linkInput}
          onChangeText={setLinkInput}
          style={[styles.input, { flex: 1 }]}
        />
        <Pressable
          onPress={() => {
            const fixed = normalizeUrl(linkInput);
            if (!fixed) return;
            setLinks((p) => [...p, fixed]);
            setLinkInput("");
          }}
        >
          <Text style={styles.addBtn}>➕</Text>
        </Pressable>
      </View>

      <View style={styles.linkWrap}>
        {links.map((l, i) => (
          <Pressable key={i} onPress={() => openLink(l)}>
            <Text style={styles.linkText}>🔗 {l.replace(/^https?:\/\//, "")}</Text>
          </Pressable>
        ))}
      </View>

      {/* IMAGES */}
      <Pressable onPress={pickImage}>
        <Text>📷 Add Photo</Text>
      </Pressable>

      <View style={styles.imageRow}>
        {images.map((uri, i) => (
          <View key={i} style={styles.imageWrap}>
            <Image source={{ uri }} style={styles.image} />
            <Pressable
              style={styles.removeImg}
              onPress={() =>
                setImages((prev) => prev.filter((_, idx) => idx !== i))
              }
            >
              <Text style={{ color: "#fff" }}>✕</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <Pressable style={styles.saveBtn} onPress={submitUpdate}>
        <Text style={{ color: "#fff" }}>Update Progress</Text>
      </Pressable>

      {/* TIMELINE */}
      <FlatList
        data={updates}
        keyExtractor={(i) => i.id}
        renderItem={({ item }) => (
          <View style={styles.updateCard}>
            <Text style={styles.user}>{item.user_name}</Text>
            <Text>Progress: {item.progress}%</Text>
            <Text style={styles.meta}>
              {new Date(item.created_at).toDateString()}
            </Text>

            {item.comment && <Text>{item.comment}</Text>}

            {item.links?.map((l, i) => (
              <Pressable key={i} onPress={() => openLink(l)}>
                <Text style={styles.linkText}>
                  🔗 {l.replace(/^https?:\/\//, "")}
                </Text>
              </Pressable>
            ))}

            {item.images?.map((img, i) => (
              <Image key={i} source={{ uri: img }} style={styles.image} />
            ))}
          </View>
        )}
      />
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { padding: 16 },
  backBtn: { marginBottom: 8 },
  backText: { fontSize: 14, color: "#3498db" },
  title: { fontSize: 22, fontWeight: "700" },
  label: { fontWeight: "600", marginTop: 10 },
  input: { borderWidth: 1, borderRadius: 8, padding: 10, marginVertical: 6 },
  row: { flexDirection: "row", alignItems: "center" },
  addBtn: { fontSize: 22, marginLeft: 8 },
  linkWrap: { marginVertical: 6 },
  linkText: { color: "#2980b9", fontSize: 12, marginTop: 4 },
  imageRow: { flexDirection: "row", marginTop: 6 },
  imageWrap: { position: "relative", marginRight: 6 },
  image: { width: 70, height: 70, borderRadius: 8 },
  removeImg: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "red",
    borderRadius: 10,
    padding: 2,
  },
  saveBtn: {
    backgroundColor: "#3498db",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
  },
  updateCard: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
  },
  user: { fontWeight: "700" },
  meta: { fontSize: 11, color: "#555" },
});
