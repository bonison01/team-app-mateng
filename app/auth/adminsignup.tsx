import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import SuccessModal from "../../components/SuccessModal";
import { supabase } from "../../lib/supabase";

const ADMIN_CODE = "2143";

export default function AdminSignup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const isSubmitting = useRef(false);

  const signupAdmin = async () => {
    if (loading || isSubmitting.current) return;

    if (!email || !password || !adminCode) {
      Alert.alert("Missing fields", "Fill all fields");
      return;
    }

    if (adminCode !== ADMIN_CODE) {
      Alert.alert("Invalid Code", "Admin code is incorrect");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Weak password", "Minimum 6 characters required");
      return;
    }

    try {
      isSubmitting.current = true;
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error || !data.user) {
        Alert.alert("Signup failed", error?.message || "Unknown error");
        return;
      }

      // ✅ CRITICAL FIX: UPSERT instead of insert
      await supabase.from("profiles").upsert({
        id: data.user.id,
        role: "admin",
        full_name: "Admin",
      });

      setSuccessVisible(true);
    } catch {
      Alert.alert("Error", "Unable to create admin account");
    } finally {
      isSubmitting.current = false;
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Signup</Text>

      <TextInput
        placeholder="Admin Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        editable={!loading}
        style={styles.input}
      />

      {/* PASSWORD */}
      <View style={styles.passwordRow}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
          style={styles.passwordInput}
        />

        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Text style={styles.toggle}>
            {showPassword ? "Hide" : "Show"}
          </Text>
        </Pressable>
      </View>

      <TextInput
        placeholder="Admin Code"
        value={adminCode}
        onChangeText={setAdminCode}
        editable={!loading}
        secureTextEntry
        style={styles.input}
      />

      {loading ? (
        <ActivityIndicator size="large" color="#c62828" />
      ) : (
        <Pressable style={styles.adminBtn} onPress={signupAdmin}>
          <Text style={styles.btnText}>Create Admin Account</Text>
        </Pressable>
      )}

      <Pressable
        onPress={() => router.replace("/auth/adminlogin")}
        style={{ marginTop: 20 }}
      >
        <Text style={styles.link}>Already admin? Login</Text>
      </Pressable>

      <SuccessModal
        visible={successVisible}
        title="Admin Created 🎉"
        message="Admin account created successfully."
        buttonText="Go to Admin Login"
        onClose={() => {
          setSuccessVisible(false);
          router.replace("/auth/adminlogin");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, marginTop: 80 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  passwordRow: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  passwordInput: { flex: 1, paddingVertical: 12 },
  toggle: { color: "#c62828", fontWeight: "600" },
  adminBtn: {
    backgroundColor: "#c62828",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  link: { textAlign: "center", color: "#c62828", fontWeight: "600" },
});
