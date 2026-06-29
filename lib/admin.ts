import type { User } from "@prisma/client";
import { getCurrentUser } from "./auth";

// Admins are designated by email in the ADMIN_EMAILS env var (comma-separated).
// e.g. ADMIN_EMAILS="you@example.com,mod@example.com"
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isAdminUser(user: { email: string | null } | null): boolean {
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}

/** Returns the current user if they're an admin, else null. */
export async function getAdmin(): Promise<User | null> {
  const user = await getCurrentUser();
  return isAdminUser(user) ? user : null;
}
