import { getCurrentUser } from "@/lib/auth";
import { getProjects } from "@/lib/shape";
import { publicUser } from "@/lib/user";
import SparkleApp from "@/components/SparkleApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const projects = await getProjects({ viewerId: user?.id ?? null });
  return <SparkleApp initialUser={user ? publicUser(user) : null} initialProjects={projects} />;
}
