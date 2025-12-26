// ===============================
// ATTENDANCE
// ===============================
export type AttendanceRow = {
  id: string;
  user_id: string | null;

  date: string | null;

  check_in_time: string | null;
  check_out_time: string | null;

  latitude: number | null;
  longitude: number | null;

  status: string | null;
  working_hours: number | null;

  selfie_out_url: string | null;

  created_at: string | null;
};


// ===============================
// ROLES
// ===============================
export type Role = "admin" | "manager" | "staff";

// ===============================
// LEAVES
// ===============================
export type LeaveRow = {
  id: string;
  user_id: string;
  reason: string;
  leave_type: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

// ===============================
// TASKS
// ===============================
export type Task = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  created_at: string;
  
};
