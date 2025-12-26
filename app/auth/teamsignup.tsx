import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Button,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import SuccessModal from "../../components/SuccessModal";
import { supabase } from "../../lib/supabase";

export default function TeamSignup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const isSubmitting = useRef(false);

  const signup = async () => {
    if (loading || isSubmitting.current) return;

    if (!email || !password) {
      Alert.alert("Missing fields", "Please enter email and password.");
      return;
    }

    if (password.length < 6) {
      Alert.alert(
        "Weak password",
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      isSubmitting.current = true;
      setLoading(true);

      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert(
          "Signup failed",
          error.message.includes("rate")
            ? "Too many attempts. Please wait and try again."
            : error.message
        );
        return;
      }

      setSuccessVisible(true);
    } catch {
      Alert.alert(
        "Error",
        "Unable to create account right now."
      );
    } finally {
      isSubmitting.current = false;
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 100 }}>
      <Text style={{ fontSize: 26, marginBottom: 20 }}>
        Team Sign Up
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        editable={!loading}
        style={{
          borderWidth: 1,
          padding: 12,
          marginBottom: 12,
        }}
      />

      {/* PASSWORD */}
      <View
        style={{
          borderWidth: 1,
          paddingHorizontal: 12,
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 12,
        }}
      >
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
          editable={!loading}
          style={{ flex: 1, paddingVertical: 12 }}
        />

        <Pressable onPress={() => setShowPassword(!showPassword)}>
          <Text style={{ color: "#14710F", fontWeight: "600" }}>
            {showPassword ? "Hide" : "Show"}
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#14710F" />
      ) : (
        <Button title="Create Team Account" onPress={signup} />
      )}

      <Pressable
        onPress={() => router.replace("/auth/teamlogin")}
        style={{ marginTop: 20 }}
      >
        <Text style={{ textAlign: "center", color: "#14710F" }}>
          Already have an account? Login
        </Text>
      </Pressable>

      {/* SUCCESS POPUP */}
      <SuccessModal
        visible={successVisible}
        title="Account Created 🎉"
        message="Your team account has been created successfully."
        buttonText="Go to Login"
        onClose={() => {
          setSuccessVisible(false);
          router.replace("/auth/teamlogin");
        }}
      />
    </View>
  );
}
