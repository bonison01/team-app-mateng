import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { HelloWave } from "@/components/hello-wave";
import ParallaxScrollView from "@/components/parallax-scroll-view";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Link } from "expo-router";

import { supabase } from "@/lib/supabase";
import type { Role } from "@/types/app";

/* ================= TYPES ================= */

type Profile = {
  id?: string;
  full_name: string | null;
  role: Role;
  email: string;
};

/* ================= COMPONENT ================= */

export default function HomeScreen() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  /* ================= LOAD DATA ================= */

  const loadData = async () => {
    const { data: session } = await supabase.auth.getSession();

    // 🔐 Redirect if not logged in
    if (!session.session) {
      router.replace("/auth/teamlogin");
      return;
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return;

    /* ---------- CURRENT USER ---------- */
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", auth.user.id)
      .maybeSingle();

    setProfile({
      full_name: myProfile?.full_name ?? "User",
      role: (myProfile?.role as Role) ?? "staff",
      email: auth.user.email ?? "",
    });

    /* ---------- ALL TEAM PROFILES ---------- */
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("id, full_name, role, email")
      .order("role", { ascending: false });

    setProfiles(allProfiles ?? []);
    setLoading(false);
  };

  /* ================= LOGOUT ================= */

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/teamlogin");
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#A1CEDC", dark: "#1D3D47" }}
      headerImage={
        <Image
          source={require("@/assets/images/partial-react-logo.png")}
          style={styles.reactLogo}
        />
      }
    >
      {/* ================= TITLE ================= */}
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* ================= USER CARD ================= */}
      {!loading && profile && (
        <ThemedView style={styles.userCard}>
          <ThemedText type="subtitle">
            👋 Hi, {profile.full_name}
          </ThemedText>

          <ThemedText type="default">
            📧 {profile.email}
          </ThemedText>

          <View
            style={[
              styles.roleBadge,
              profile.role === "admin" ? styles.admin : styles.staff,
            ]}
          >
            <ThemedText style={styles.roleText}>
              {profile.role.toUpperCase()}
            </ThemedText>
          </View>

          {/* LOGOUT BUTTON */}
          <View style={styles.logoutWrapper}>
            <ThemedText
              onPress={handleLogout}
              style={styles.logoutText}
            >
              🚪 Logout
            </ThemedText>
          </View>
        </ThemedView>
      )}

      {/* ================= TEAM MEMBERS ================= */}
      {!loading && profiles.length > 0 && (
        <ThemedView style={styles.teamContainer}>
          <ThemedText type="subtitle">👥 Team Members</ThemedText>

          {profiles.map((item) => (
            <View key={item.id} style={styles.teamCard}>
              <View>
                <ThemedText type="defaultSemiBold">
                  {item.full_name ?? "Unnamed"}
                </ThemedText>
                <ThemedText type="default">
                  {item.email}
                </ThemedText>
              </View>

              <View
                style={[
                  styles.roleBadge,
                  item.role === "admin" ? styles.admin : styles.staff,
                ]}
              >
                <ThemedText style={styles.roleText}>
                  {item.role.toUpperCase()}
                </ThemedText>
              </View>
            </View>
          ))}
        </ThemedView>
      )}

      {/* ================= EXISTING CONTENT ================= */}
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit{" "}
          <ThemedText type="defaultSemiBold">
            app/(tabs)/index.tsx
          </ThemedText>{" "}
          to see changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <Link href="/modal">
          <Link.Trigger>
            <ThemedText type="subtitle">Step 2: Explore</ThemedText>
          </Link.Trigger>
        </Link>

        <ThemedText>
          Tap the Explore tab to learn more about what's included.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  userCard: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    gap: 6,
  },

  logoutWrapper: {
    marginTop: 10,
    alignSelf: "flex-start",
  },

  logoutText: {
    color: "#c62828",
    fontSize: 14,
    fontWeight: "700",
  },

  teamContainer: {
    marginTop: 16,
    gap: 10,
  },

  teamCard: {
    padding: 12,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },

  admin: {
    backgroundColor: "#c62828",
  },

  staff: {
    backgroundColor: "#14710F",
  },

  roleText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },

  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },

  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
