import bcrypt from "bcryptjs";
import { createCookieSessionStorage, redirect } from "react-router";
import { prisma } from "./db.server";

// Session storage configuration
const sessionSecret = process.env.SESSION_SECRET || "default-secret-key";

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: "admin_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
  },
});

export { getSession, commitSession, destroySession };

// Admin authentication functions
export async function authenticateAdmin(email: string, password: string) {
  const admin = await prisma.admin.findUnique({
    where: { email },
  });

  if (!admin || !admin.isActive) {
    return null;
  }

  const isValid = await bcrypt.compare(password, admin.password);
  if (!isValid) {
    return null;
  }

  // Update last login
  await prisma.admin.update({
    where: { id: admin.id },
    data: { lastLogin: new Date() },
  });

  return admin;
}

export async function createAdminSession(adminId: number, request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  session.set("adminId", adminId);
  
  // Create admin session record
  const token = generateSessionToken();
  await prisma.adminSession.create({
    data: {
      adminId,
      token,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
  });

  return commitSession(session);
}

export async function getAdminFromSession(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const adminId = session.get("adminId");

  if (!adminId) {
    return null;
  }

  const admin = await prisma.admin.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      isActive: true,
      lastLogin: true,
    },
  });

  if (!admin || !admin.isActive) {
    return null;
  }

  return admin;
}

export async function requireAdmin(request: Request) {
  const admin = await getAdminFromSession(request);
  if (!admin) {
    throw redirect("/admin/login");
  }
  return admin;
}

export async function requireSuperAdmin(request: Request) {
  const admin = await requireAdmin(request);
  if (admin.role !== "SUPER_ADMIN") {
    throw redirect("/admin/dashboard?error=insufficient_permissions");
  }
  return admin;
}

export async function logoutAdmin(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const adminId = session.get("adminId");

  if (adminId) {
    // Clean up session records
    await prisma.adminSession.deleteMany({
      where: { adminId },
    });
  }

  return destroySession(session);
}

export async function createAuditLog({
  adminId,
  action,
  resource,
  resourceId,
  details,
  request,
}: {
  adminId: number;
  action: string;
  resource: string;
  resourceId?: number;
  details?: any;
  request: Request;
}) {
  const userAgent = request.headers.get("User-Agent") || undefined;
  const forwarded = request.headers.get("X-Forwarded-For");
  const ipAddress = forwarded?.split(",")[0]?.trim() || 
                   request.headers.get("X-Real-IP") || 
                   "unknown";

  return prisma.auditLog.create({
    data: {
      adminId,
      action,
      resource,
      resourceId,
      details,
      ipAddress,
      userAgent,
    },
  });
}

function generateSessionToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Hash password helper
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Check if user has permission to access a resource
export function hasPermission(
  adminRole: string,
  requiredRole: "ADMIN" | "SUPER_ADMIN" = "ADMIN"
): boolean {
  if (requiredRole === "ADMIN") {
    return adminRole === "ADMIN" || adminRole === "SUPER_ADMIN";
  }
  return adminRole === "SUPER_ADMIN";
}