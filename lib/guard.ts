import type { User } from "@prisma/client";

/** Returns a blocking response detail if the user may NOT post/comment/like, else null. */
export function interactionBlock(user: User): { status: number; error: string; code?: string } | null {
  if (user.isBanned)
    return { status: 403, error: "Your account is suspended. Please contact a grown-up." };
  if (user.age < 13 && !user.consentAt)
    return {
      status: 403,
      error: "A parent or guardian needs to give permission before you can post. 🛡️",
      code: "needs_consent",
    };
  return null;
}
