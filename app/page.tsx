import { getCurrentUser, getClerkUserId } from "@/lib/auth";
import { getProjects } from "@/lib/shape";
import { publicUser } from "@/lib/user";
import { clerkEnabled } from "@/lib/clerk";
import SparkleApp from "@/components/SparkleApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const userId = await getClerkUserId();
  const user = userId ? await getCurrentUser() : null;
  const projects = await getProjects({ viewerId: user?.id ?? null });
  return (
    <SparkleApp
      clerkEnabled={clerkEnabled}
      authed={!!userId}
      initialUser={user ? publicUser(user) : null}
      initialProjects={projects}
    />
  );
}
