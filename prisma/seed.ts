import { PrismaClient, AdminRole, PostStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seeding...");

  // Create admin users in the Admin table
  const adminPassword = await bcrypt.hash("admin123", 12);
  
  const admins = [
    {
      name: "Super Admin",
      email: "admin@example.com",
      password: adminPassword,
      role: AdminRole.SUPER_ADMIN,
      avatar: "https://ui-avatars.com/api/?name=Super+Admin&background=6366f1&color=fff",
      isActive: true
    },
    {
      name: "John Admin",
      email: "john@example.com",
      password: adminPassword,
      role: AdminRole.ADMIN,
      avatar: "https://ui-avatars.com/api/?name=John+Admin&background=3b82f6&color=fff",
      isActive: true
    }
  ];

  for (const adminData of admins) {
    await prisma.admin.upsert({
      where: { email: adminData.email },
      update: {
        name: adminData.name,
        password: adminData.password,
        role: adminData.role,
        avatar: adminData.avatar,
        isActive: adminData.isActive,
      },
      create: adminData,
    });
    console.log(`✅ Created/updated admin: ${adminData.name} (${adminData.email})`);
  }

  // Create regular users in the User table (no role or type fields)
  const userPassword = await bcrypt.hash("user123", 12);
  
  const users = [
    {
      name: "Jane Smith",
      email: "jane@example.com",
      avatar: "https://ui-avatars.com/api/?name=Jane+Smith&background=10b981&color=fff",
      isActive: true
    },
    {
      name: "Bob Johnson",
      email: "bob@example.com",
      avatar: "https://ui-avatars.com/api/?name=Bob+Johnson&background=f59e0b&color=fff",
      isActive: true
    },
    {
      name: "Alice Cooper",
      email: "alice@example.com",
      avatar: "https://ui-avatars.com/api/?name=Alice+Cooper&background=8b5cf6&color=fff",
      isActive: true
    }
  ];

  for (const userData of users) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        avatar: userData.avatar,
        isActive: userData.isActive,
      },
      create: userData,
    });
    console.log(`✅ Created/updated user: ${userData.name} (${userData.email})`);
  }

  // Get created users for post associations
  const janeUser = await prisma.user.findUnique({ where: { email: "jane@example.com" } });
  const bobUser = await prisma.user.findUnique({ where: { email: "bob@example.com" } });
  const aliceUser = await prisma.user.findUnique({ where: { email: "alice@example.com" } });

  // Get admin users for audit log associations
  const superAdmin = await prisma.admin.findUnique({ where: { email: "admin@example.com" } });
  const johnAdmin = await prisma.admin.findUnique({ where: { email: "john@example.com" } });

  // Create posts
  const posts = [
    {
      title: "Getting Started with Remix Admin Panel",
      excerpt: "Learn how to use the new admin panel features and manage your application effectively...",
      content: "This comprehensive guide will walk you through all the features of the admin panel.",
      author: "Super Admin",
      date: new Date("2024-01-15"),
      category: "Tutorial",
      status: PostStatus.PUBLISHED,
      isPublished: true,
      userId: null, // Posts created by admins don't need userId
    },
    {
      title: "User Management Best Practices",
      excerpt: "Explore advanced user management techniques and security considerations for administrators...",
      content: "Managing users effectively is crucial for maintaining a secure and organized system.",
      author: "John Admin",
      date: new Date("2024-01-20"),
      category: "Administration", 
      status: PostStatus.PUBLISHED,
      isPublished: true,
      userId: null,
    },
    {
      title: "Content Creation Guidelines",
      excerpt: "Discover the best practices for creating engaging content through the admin interface...",
      content: "Creating quality content is essential for user engagement and platform success.",
      author: "Jane Smith",
      date: new Date("2024-01-25"),
      category: "Content",
      status: PostStatus.DRAFT,
      isPublished: false,
      userId: janeUser?.id,
    },
    {
      title: "Community Guidelines",
      excerpt: "Understanding the importance of community standards and user interaction guidelines...",
      content: "Building a positive community environment is essential for platform success.",
      author: "Bob Johnson",
      date: new Date("2024-01-28"),
      category: "Community",
      status: PostStatus.PUBLISHED,
      isPublished: true,
      userId: bobUser?.id,
    },
    {
      title: "Tips for New Users",
      excerpt: "A comprehensive guide for new users to get started with the platform...",
      content: "Welcome to our platform! Here are some tips to help you get started.",
      author: "Alice Cooper",
      date: new Date("2024-02-01"),
      category: "Tutorial",
      status: PostStatus.PUBLISHED,
      isPublished: true,
      userId: aliceUser?.id,
    }
  ];

  for (const postData of posts) {
    const existingPost = await prisma.post.findFirst({
      where: { title: postData.title }
    });
    
    if (!existingPost) {
      await prisma.post.create({
        data: {
          title: postData.title,
          excerpt: postData.excerpt,
          content: postData.content,
          author: postData.author,
          date: postData.date,
          category: postData.category,
          status: postData.status,
          isPublished: postData.isPublished,
          userId: postData.userId,
        },
      });
      console.log(`✅ Created post: ${postData.title}`);
    } else {
      console.log(`⚠️  Post already exists: ${postData.title}`);
    }
  }

  // Create some sample audit logs
  if (superAdmin && johnAdmin) {
    const auditLogs = [
      {
        adminId: superAdmin.id,
        action: "LOGIN",
        resource: "ADMIN",
        resourceId: superAdmin.id,
        details: { ip: "192.168.1.1", userAgent: "Mozilla/5.0..." },
        ipAddress: "192.168.1.1",
        userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      {
        adminId: johnAdmin.id,
        action: "CREATE",
        resource: "POST",
        resourceId: 1,
        details: { title: "User Management Best Practices" },
        ipAddress: "192.168.1.2",
        userAgent: "Mozilla/5.0 (Mac OS X 10_15_7) AppleWebKit/537.36"
      }
    ];

    for (const logData of auditLogs) {
      await prisma.auditLog.create({
        data: logData,
      });
    }
    console.log(`✅ Created ${auditLogs.length} audit log entries`);
  }

  console.log("\n🎉 Database seeding completed!");
  console.log("\n📋 Admin Login Credentials:");
  console.log("  Super Admin: admin@example.com / admin123");
  console.log("  John Admin: john@example.com / admin123");
  console.log("\n👥 Regular Users (no login system implemented yet):");
  console.log("  Jane Smith: jane@example.com");
  console.log("  Bob Johnson: bob@example.com");
  console.log("  Alice Cooper: alice@example.com");
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