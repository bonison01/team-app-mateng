import RoleGuard from "../../components/RoleGuard";
import TeamManagement from "./team-management";

export default function TeamManagementPage() {
  return (
    <RoleGuard allowed={["admin"]}>
      <TeamManagement />
    </RoleGuard>
  );
}
