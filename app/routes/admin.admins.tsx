import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useFetcher, Form, useActionData } from "react-router";
import { requireSuperAdmin, createAuditLog, hashPassword } from "~/lib/auth.server";
import { getAdminUsers, toggleAdminActive, deleteAdmin, createAdmin, updateAdminRole } from "~/lib/db.server";
import { AdminLayout } from "~/components/AdminLayout";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "Admin Management - Admin Panel" },
    { name: "description", content: "Manage administrator accounts" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireSuperAdmin(request);
  const admins = await getAdminUsers();
  
  return data({ admin, admins });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireSuperAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();

  if (intent === "create") {
    const name = formData.get("name")?.toString();
    const email = formData.get("email")?.toString();
    const password = formData.get("password")?.toString();
    const role = formData.get("role")?.toString() as "ADMIN" | "SUPER_ADMIN";

    if (!name || !email || !password) {
      return data({ error: "All fields are required" }, { status: 400 });
    }

    try {
      const hashedPassword = await hashPassword(password);
      const newAdmin = await createAdmin({
        name,
        email,
        password: hashedPassword,
        role: role || "ADMIN",
      });

      await createAuditLog({
        adminId: admin.id,
        action: "CREATE",
        resource: "ADMIN",
        resourceId: newAdmin.id,
        details: { name, email, role: role || "ADMIN" },
        request,
      });

      return data({ success: true, message: "Admin created successfully" });
    } catch (error: any) {
      if (error.code === "P2002") {
        return data({ error: "Email already exists" }, { status: 400 });
      }
      return data({ error: "Failed to create admin" }, { status: 500 });
    }
  }

  if (intent === "toggle-active") {
    const adminId = Number(formData.get("adminId"));
    const isActive = formData.get("isActive") === "true";
    
    await toggleAdminActive(adminId, !isActive);
    
    await createAuditLog({
      adminId: admin.id,
      action: isActive ? "DEACTIVATE" : "ACTIVATE",
      resource: "ADMIN",
      resourceId: adminId,
      details: { isActive: !isActive },
      request,
    });
    
    return data({ success: true });
  }

  if (intent === "update-role") {
    const adminId = Number(formData.get("adminId"));
    const role = formData.get("role")?.toString() as "ADMIN" | "SUPER_ADMIN";
    
    await updateAdminRole(adminId, role);
    
    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      resource: "ADMIN",
      resourceId: adminId,
      details: { role },
      request,
    });
    
    return data({ success: true });
  }

  if (intent === "delete") {
    const adminId = Number(formData.get("adminId"));
    
    // Prevent deleting self
    if (adminId === admin.id) {
      return data({ error: "Cannot delete your own account" }, { status: 400 });
    }
    
    await deleteAdmin(adminId);
    
    await createAuditLog({
      adminId: admin.id,
      action: "DELETE",
      resource: "ADMIN",
      resourceId: adminId,
      details: {},
      request,
    });
    
    return data({ success: true });
  }

  return data({ error: "Invalid action" }, { status: 400 });
}

export default function AdminAdmins() {
  const { admin, admins } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleToggleActive = (adminId: number, isActive: boolean) => {
    fetcher.submit(
      {
        intent: "toggle-active",
        adminId: adminId.toString(),
        isActive: isActive.toString(),
      },
      { method: "post" }
    );
  };

  const handleRoleChange = (adminId: number, role: string) => {
    fetcher.submit(
      {
        intent: "update-role",
        adminId: adminId.toString(),
        role,
      },
      { method: "post" }
    );
  };

  const handleDelete = (adminId: number) => {
    if (confirm("Are you sure you want to delete this admin? This action cannot be undone.")) {
      fetcher.submit(
        {
          intent: "delete",
          adminId: adminId.toString(),
        },
        { method: "post" }
      );
    }
  };

  return (
    <AdminLayout admin={admin}>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Management</h1>
            <p className="mt-2 text-gray-600">
              Manage administrator accounts and permissions. Only Super Admins can access this page.
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {showCreateForm ? "Cancel" : "Create Admin"}
            </button>
          </div>
        </div>
      </div>

      {/* Create Admin Form */}
      {showCreateForm && (
        <div className="mb-8 bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Admin</h3>
          <Form method="post" className="space-y-4">
            <input type="hidden" name="intent" value="create" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  id="password"
                  required
                  minLength={6}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  name="role"
                  id="role"
                  defaultValue="ADMIN"
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
            </div>
            
            {actionData && 'error' in actionData && (actionData as any).error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-700">{(actionData as any).error}</div>
              </div>
            )}
            
            {actionData && 'success' in actionData && (actionData as any).success && (actionData as any).message && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="text-sm text-green-700">{(actionData as any).message}</div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Create Admin
              </button>
            </div>
          </Form>
        </div>
      )}

      {/* Admins Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Admin
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admins.map((adminUser) => (
                <tr key={adminUser.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img
                          className="h-10 w-10 rounded-full"
                          src={adminUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(adminUser.name)}&background=6366f1&color=fff`}
                          alt={adminUser.name}
                        />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {adminUser.name}
                          {adminUser.id === admin.id && (
                            <span className="ml-2 text-xs text-blue-600">(You)</span>
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {adminUser.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={adminUser.role}
                      onChange={(e) => handleRoleChange(adminUser.id, e.target.value)}
                      className="text-sm border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      disabled={fetcher.state !== "idle" || adminUser.id === admin.id}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      adminUser.isActive 
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}>
                      {adminUser.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {adminUser.lastLogin 
                      ? new Date(adminUser.lastLogin).toLocaleDateString()
                      : "Never"
                    }
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <button
                        onClick={() => handleToggleActive(adminUser.id, adminUser.isActive)}
                        className={`text-xs ${
                          adminUser.isActive 
                            ? "text-red-600 hover:text-red-900"
                            : "text-green-600 hover:text-green-900"
                        }`}
                        disabled={fetcher.state !== "idle" || adminUser.id === admin.id}
                      >
                        {adminUser.isActive ? "Deactivate" : "Activate"}
                      </button>
                      {adminUser.id !== admin.id && (
                        <button
                          onClick={() => handleDelete(adminUser.id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                          disabled={fetcher.state !== "idle"}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Stats */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-900">
              {admins.length}
            </div>
            <div className="text-sm text-blue-700">Total Admins</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-900">
              {admins.filter(a => a.isActive).length}
            </div>
            <div className="text-sm text-green-700">Active Admins</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-900">
              {admins.filter(a => a.role === "SUPER_ADMIN").length}
            </div>
            <div className="text-sm text-purple-700">Super Admins</div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}