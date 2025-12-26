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
import { supabase } from "../lib/supabase";

export default function Signup() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // 🔒 HARD LOCK to prevent double signup
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

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        Alert.alert(
          "Signup failed",
          error.message.includes("rate")
            ? "Too many attempts. Please wait a few minutes and try again."
            : error.message
        );
        return;
      }

      // ✅ SUCCESS
      Alert.alert(
        "Account created 🎉",
        "Your account has been created successfully.",
        [
          {
            text: "Login",
            onPress: () => router.replace("/login"),
          },
        ]
      );
    } catch (e) {
      Alert.alert(
        "Error",
        "Unable to create account right now. Please try later."
      );
    } finally {
      isSubmitting.current = false;
      setLoading(false);
    }
  };

  return (
    <View style={{ padding: 20, marginTop: 100 }}>
      <Text style={{ fontSize: 26, marginBottom: 20 }}>
        Employee Sign Up
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
        <Button title="Create Account" onPress={signup} />
      )}
    </View>
  );
}
