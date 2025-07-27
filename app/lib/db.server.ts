import { PrismaClient } from "@prisma/client";

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
  role?: string;
  avatar?: string;
}) {
  return prisma.user.create({
    data,
  });
}

export async function updateUser(id: number, data: {
  name?: string;
  email?: string;
  role?: string;
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