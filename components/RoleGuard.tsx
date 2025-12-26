import { ReactNode, useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { supabase } from "../lib/supabase";
import type { Role } from "../types/app";

type Props = {
  allowed: Role[];
  children: ReactNode;
};

export default function RoleGuard({ allowed, children }: Props) {
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRole();
  }, []);

  const loadRole = async () => {
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .single();

    if (error || !data) {
      setLoading(false);
      return;
    }

    setRole(data.role as Role);
    setLoading(false);
  };

  /* -------- Loading -------- */
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* -------- Not allowed -------- */
  if (!role || !allowed.includes(role)) {
    return (
      <View style={{ padding: 20 }}>
        <Text style={{ color: "red", fontWeight: "600" }}>
          You don’t have permission to access this page.
        </Text>
      </View>
    );
  }

  /* -------- Allowed -------- */
  return <>{children}</>;
}
