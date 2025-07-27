import { PrismaClient, PostStatus } from "@prisma/client";

declare global {
  var __db__: PrismaClient;
}

let prisma: PrismaClient;

// This is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.__db__) {
    global.__db__ = new PrismaClient();
  }
  prisma = global.__db__;
  prisma.$connect();
}

export { prisma };

// User operations
export async function getUsers() {
  return prisma.user.findMany({
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getUserById(id: number) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      posts: true,
    },
  });
}

export async function createUser(data: {
  name: string;
  email: string;
  avatar?: string;
}) {
  return prisma.user.create({
    data,
  });
}

export async function updateUser(id: number, data: {
  name?: string;
  email?: string;
  avatar?: string;
}) {
  return prisma.user.update({
    where: { id },
    data,
  });
}

export async function deleteUser(id: number) {
  return prisma.user.delete({
    where: { id },
  });
}

// Post operations
export async function getPosts() {
  return prisma.post.findMany({
    orderBy: {
      date: "desc",
    },
    include: {
      user: true,
    },
  });
}

export async function getPostById(id: number) {
  return prisma.post.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });
}

export async function createPost(data: {
  title: string;
  excerpt: string;
  author: string;
  category: string;
  date?: Date;
  userId?: number;
}) {
  return prisma.post.create({
    data,
  });
}

export async function updatePost(id: number, data: {
  title?: string;
  excerpt?: string;
  author?: string;
  category?: string;
  date?: Date;
  userId?: number;
  status?: PostStatus;
  isPublished?: boolean;
}) {
  return prisma.post.update({
    where: { id },
    data,
  });
}

export async function deletePost(id: number) {
  return prisma.post.delete({
    where: { id },
  });
}

// Admin-specific operations
export async function getAdminStats() {
  const [userCount, postCount, adminCount, recentUsers] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.admin.count(),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    userCount,
    postCount,
    adminCount,
    recentUsers,
  };
}

export async function getAdminUsers() {
  return prisma.admin.findMany({
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
      createdAt: true,
      _count: {
        select: {
          auditLogs: true,
        },
      },
    },
  });
}

export async function getUsersWithPagination(
  page: number = 1,
  limit: number = 10,
  search?: string
) {
  const offset = (page - 1) * limit;
  
  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: {
            posts: true,
          },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getPostsWithPagination(
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string
) {
  const offset = (page - 1) * limit;
  
  const where: any = {};
  
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { excerpt: { contains: search, mode: "insensitive" } },
      { author: { contains: search, mode: "insensitive" } },
    ];
  }
  
  if (status && status !== "ALL") {
    where.status = status;
  }

  const [posts, total] = await Promise.all([
    prisma.post.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.post.count({ where }),
  ]);

  return {
    posts,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getAuditLogs(
  page: number = 1,
  limit: number = 20
) {
  const offset = (page - 1) * limit;

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    }),
    prisma.auditLog.count(),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Admin management functions
export async function createAdmin(data: {
  name: string;
  email: string;
  password: string;
  role?: "ADMIN" | "SUPER_ADMIN";
}) {
  return prisma.admin.create({
    data: {
      ...data,
      role: data.role || "ADMIN",
    },
  });
}

export async function updateAdminRole(
  id: number,
  role: "ADMIN" | "SUPER_ADMIN"
) {
  return prisma.admin.update({
    where: { id },
    data: { role },
  });
}

export async function getAdminById(id: number) {
  return prisma.admin.findUnique({
    where: { id },
    include: {
      sessions: true,
      auditLogs: {
        take: 10,
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export async function toggleUserActive(id: number, isActive: boolean) {
  return prisma.user.update({
    where: { id },
    data: { isActive },
  });
}

export async function toggleAdminActive(id: number, isActive: boolean) {
  return prisma.admin.update({
    where: { id },
    data: { isActive },
  });
}

// Additional admin functions
export async function getAdminByEmail(email: string) {
  return prisma.admin.findUnique({
    where: { email },
  });
}

export async function updateAdmin(id: number, data: {
  name?: string;
  email?: string;
  avatar?: string;
  role?: "ADMIN" | "SUPER_ADMIN";
}) {
  return prisma.admin.update({
    where: { id },
    data,
  });
}

export async function deleteAdmin(id: number) {
  // Clean up related sessions first
  await prisma.adminSession.deleteMany({
    where: { adminId: id },
  });
  
  return prisma.admin.delete({
    where: { id },
  });
}

// Enhanced post management
export async function getPostsWithAuthor() {
  return prisma.post.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function updatePostStatus(id: number, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") {
  return prisma.post.update({
    where: { id },
    data: {
      status,
      isPublished: status === "PUBLISHED",
    },
  });
}

// Stats functions
export async function getDashboardStats() {
  const [userCount, postCount, adminCount, publishedPosts, recentUsers, recentPosts] = await Promise.all([
    prisma.user.count(),
    prisma.post.count(),
    prisma.admin.count(),
    prisma.post.count({ where: { isPublished: true } }),
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    }),
    prisma.post.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  return {
    userCount,
    postCount,
    adminCount,
    publishedPosts,
    recentUsers,
    recentPosts,
  };
}

export async function searchUsers(query: string) {
  return prisma.user.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
      ],
    },
    take: 20,
  });
}

export async function searchPosts(query: string) {
  return prisma.post.findMany({
    where: {
      OR: [
        { title: { contains: query, mode: "insensitive" } },
        { excerpt: { contains: query, mode: "insensitive" } },
        { content: { contains: query, mode: "insensitive" } },
      ],
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
    take: 20,
  });
}