export type Task = {
  id: string;
  title: string;
  description: string | null;
  assigned_by: string;
  assigned_to: string;
  status: "pending" | "completed";
  report: string | null;
  created_at: string;
};
