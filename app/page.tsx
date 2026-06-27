import { getCurrentUser } from "@/lib/auth";
import { getProjects } from "@/lib/shape";
import SparkleApp from "@/components/SparkleApp";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  const projects = await getProjects({ viewerId: user?.id ?? null });
  const safeUser = user
    ? { id: user.id, name: user.name, age: user.age, avatar: user.avatar, sparks: user.sparks }
    : null;
  return <SparkleApp initialUser={safeUser} initialProjects={projects} />;
}
