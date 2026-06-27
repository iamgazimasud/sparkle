import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "./db";
import { clerkEnabled } from "./clerk";

/** The signed-in Clerk user's id, or null. Safe to call when Clerk is disabled. */
export async function getClerkUserId(): Promise<string | null> {
  if (!clerkEnabled) return null;
  const { userId } = await auth();
  return userId ?? null;
}

/** The Sparkle profile for the signed-in user, or null if not signed in / no profile yet. */
export async function getCurrentUser() {
  const userId = await getClerkUserId();
  if (!userId) return null;
  return prisma.user.findUnique({ where: { clerkId: userId } });
}

/** Clerk identity details for creating a profile during onboarding. */
export async function getClerkIdentity() {
  if (!clerkEnabled) return null;
  const { userId } = await auth();
  if (!userId) return null;
  const cu = await currentUser();
  const email =
    cu?.emailAddresses?.find((e) => e.id === cu.primaryEmailAddressId)?.emailAddress ||
    cu?.emailAddresses?.[0]?.emailAddress ||
    null;
  return { userId, email };
}
