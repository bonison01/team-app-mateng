import { router } from "expo-router";
import type { Role } from "../types/app";
import { supabase } from "./supabase";

export const redirectByRole = async () => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle(); // ✅ FIXES 406

  if (error || !profile) {
    // fallback: treat as staff
    router.replace("/(tabs)/dashboard");
    return;
  }

  const role = profile.role as Role;

  if (role === "admin" || role === "manager") {
    router.replace("/admin/dashboard");
  } else {
    router.replace("/(tabs)/dashboard");
  }
};
