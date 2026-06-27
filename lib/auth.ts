import { cookies } from "next/headers";
import crypto from "node:crypto";
import { prisma } from "./db";

export { hashPin, verifyPin } from "./hash";

const SECRET = process.env.SESSION_SECRET || "dev-secret-change-me";
const COOKIE = "sparkle_session";

/** Create a signed token: userId.signature */
function sign(userId: string): string {
  const sig = crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
  return `${userId}.${sig}`;
}

function unsign(token: string): string | null {
  const [userId, sig] = token.split(".");
  if (!userId || !sig) return null;
  const expected = crypto.createHmac("sha256", SECRET).update(userId).digest("hex");
  try {
    if (crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return userId;
  } catch {
    return null;
  }
  return null;
}

export async function setSession(userId: string) {
  const jar = await cookies();
  jar.set(COOKIE, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getCurrentUser() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  const userId = unsign(token);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}
