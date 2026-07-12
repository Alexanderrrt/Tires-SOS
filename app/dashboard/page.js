import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import SimplifiedDashboard from "../components/dashboard/SimplifiedDashboard";

export const metadata = {
  title: "Dashboard - AI Ads Manager",
  description: "Internal dashboard for managing client ad campaigns",
};

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/dashboard");
  }

  return <SimplifiedDashboard />;
}
