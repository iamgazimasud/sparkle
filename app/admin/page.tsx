import { redirect } from "next/navigation";
import { getClerkUserId } from "@/lib/auth";
import { getAdmin } from "@/lib/admin";
import AdminDashboard from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Moderation — Sparkle" };

export default async function AdminPage() {
  const userId = await getClerkUserId();
  if (!userId) redirect("/sign-in");
  const admin = await getAdmin();
  if (!admin) {
    return (
      <main className="wrap">
        <div className="hero" style={{ display: "block" }}>
          <h1>🛡️ Moderation</h1>
          <p>This page is for moderators only. <a href="/">← Back to Sparkle</a></p>
        </div>
      </main>
    );
  }
  return <AdminDashboard adminName={admin.name} />;
}
