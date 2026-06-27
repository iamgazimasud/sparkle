import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const USERS = [
  { name: "DragonGirl",   age: 9,  avatar: "🦄" },
  { name: "PixelPete",    age: 11, avatar: "🤖" },
  { name: "MakerMax",     age: 10, avatar: "🦖" },
  { name: "MelodyMoon",   age: 8,  avatar: "🦋" },
  { name: "BlockBuddy",   age: 12, avatar: "🐼" },
  { name: "ScienceSam",   age: 10, avatar: "🐙" },
];

async function main() {
  console.log("🌱 Seeding Sparkle...");

  // Demo makers — these are content authors only (they never log in via Clerk),
  // so their projects appear in the feed for new users to get inspired by.
  const users: Record<string, string> = {};
  for (const u of USERS) {
    const created = await prisma.user.upsert({
      where: { name: u.name },
      update: {},
      create: { ...u, sparks: 30 + Math.floor(Math.random() * 80) },
    });
    users[u.name] = created.id;
  }

  const projects = [
    { type: "art", title: "Rainbow Dragon 🐉", desc: "I drew this dragon with my new markers! He breathes rainbows instead of fire.", cover: "🐉", author: "DragonGirl" },
    { type: "code", title: "My First Platformer Game", desc: "I made a jumping game with Scratch! You collect stars and dodge the slimes.", cover: "🕹️", author: "PixelPete" },
    { type: "youtube", title: "How I Built a Cardboard Robot", desc: "Watch my step-by-step video making a robot from boxes and tape!", cover: "📺", link: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", author: "MakerMax" },
    { type: "music", title: "Space Adventure Song 🎵", desc: "I wrote a song about flying to the moon on my keyboard!", cover: "🪐", author: "MelodyMoon" },
    { type: "art", title: "My Pixel City", desc: "A whole city I built block by block. It has a roller coaster!", cover: "🏰", author: "BlockBuddy" },
    { type: "video", title: "Slime Science Experiment", desc: "I made glow-in-the-dark slime and filmed the whole thing!", cover: "🌋", author: "ScienceSam" },
    { type: "art", title: "Underwater World", desc: "Painted a coral reef with all my favourite fish. The octopus is my favourite!", cover: "🐳", author: "DragonGirl" },
    { type: "code", title: "Maze Runner Game", desc: "Use arrow keys to escape the maze before time runs out. I made 10 levels!", cover: "🎮", author: "PixelPete" },
  ];

  // Clear existing demo projects to keep the seed idempotent.
  await prisma.project.deleteMany({ where: { authorId: { in: Object.values(users) } } });

  for (const p of projects) {
    const proj = await prisma.project.create({
      data: {
        type: p.type, title: p.title, desc: p.desc, cover: p.cover,
        link: p.link ?? null, authorId: users[p.author],
      },
    });
    // A few likes & comments to make it feel alive.
    const others = Object.values(users).filter((id) => id !== users[p.author]);
    const likeCount = 5 + Math.floor(Math.random() * Math.min(others.length, 5));
    for (let i = 0; i < Math.min(likeCount, others.length); i++) {
      await prisma.like.create({ data: { userId: others[i], projectId: proj.id } });
    }
    const comments = ["So cool! 🤩", "Amazing! 🌟", "Teach me how! 🙌", "Love it! ❤️"];
    for (let i = 0; i < 2; i++) {
      await prisma.comment.create({
        data: { text: comments[(i + projects.indexOf(p)) % comments.length], authorId: others[i % others.length], projectId: proj.id },
      });
    }
  }

  console.log("✅ Seeded", USERS.length, "demo makers and", projects.length, "projects.");
  console.log("👉 Sign up with Clerk to create your own maker profile.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
