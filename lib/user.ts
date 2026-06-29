import type { User } from "@prisma/client";
import { isAdminUser } from "./admin";

// Shape sent to the browser — never includes pinHash or Stripe internals.
export type PublicUser = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  sparks: number;
  email: string | null;
  plan: string;
  consented: boolean; // parental consent given (or 13+)
  isAdmin: boolean;
  isBanned: boolean;
};

export function publicUser(u: User): PublicUser {
  return {
    id: u.id,
    name: u.name,
    age: u.age,
    avatar: u.avatar,
    sparks: u.sparks,
    email: u.email,
    plan: u.plan,
    consented: u.age >= 13 || !!u.consentAt,
    isAdmin: isAdminUser(u),
    isBanned: u.isBanned,
  };
}
