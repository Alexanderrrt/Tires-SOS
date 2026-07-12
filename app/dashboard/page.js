import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import SimplifiedDashboard from "@/components/dashboard/SimplifiedDashboard";

export const metadata = {
  title: "Dashboard - AI Ads Manager",
  description: "Internal dashboard for managing client ad campaigns",
};

export default async function DashboardPage() {
  // Check authentication
  const cookieStore = cookies();
  const token = cookieStore.get("dashboard_token");

  if (!token) {
    redirect("/dashboard/login");
  }

  return <SimplifiedDashboard />;
}
