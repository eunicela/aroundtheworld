import { AdminPanel } from "@/components/admin/AdminPanel";
import { isAdminEnabled } from "@/lib/admin";

export const metadata = {
  title: "Admin — Photos Around the World",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminPanel enabled={isAdminEnabled()} />;
}
