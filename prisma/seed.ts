import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create users
  const users = [
    {
      id: 1,
      name: "John Doe",
      email: "john@example.com",
      role: "Admin",
      avatar: "https://ui-avatars.com/api/?name=John+Doe&background=3b82f6&color=fff"
    },
    {
      id: 2,
      name: "Jane Smith",
      email: "jane@example.com",
      role: "User",
      avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=10b981&color=fff"
    },
    {
      id: 3,
      name: "Bob Johnson",
      email: "bob@example.com",
      role: "User",
      avatar: "https://ui-avatars.com/api/?name=Bob+Johnson&background=f59e0b&color=fff"
    }
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: userData,
      create: userData,
    });
  }

  // Create posts
  const posts = [
    {
      id: 1,
      title: "Getting Started with Remix",
      excerpt: "Learn how to build modern web applications with Remix framework...",
      author: "John Doe",
      date: new Date("2024-01-15"),
      category: "Tutorial",
      userId: 1,
    },
    {
      id: 2,
      title: "TypeScript Best Practices",
      excerpt: "Explore advanced TypeScript patterns and techniques for better code...",
      author: "Jane Smith",
      date: new Date("2024-01-20"),
      category: "Development",
      userId: 2,
    },
    {
      id: 3,
      title: "Tailwind CSS Tips",
      excerpt: "Discover useful Tailwind CSS utilities and customization options...",
      author: "Bob Johnson",
      date: new Date("2024-01-25"),
      category: "Design",
      userId: 3,
    }
  ];

  for (const postData of posts) {
    await prisma.post.upsert({
      where: { id: postData.id },
      update: postData,
      create: postData,
    });
  }

  console.log("Database has been seeded! 🌱");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });