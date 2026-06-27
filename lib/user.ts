import type { User } from "@prisma/client";

// Shape sent to the browser — never includes pinHash or Stripe internals.
export type PublicUser = {
  id: string;
  name: string;
  age: number;
  avatar: string;
  sparks: number;
  email: string | null;
  plan: string;
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
  };
}
