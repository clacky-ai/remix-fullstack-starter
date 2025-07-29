import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { data, redirect } from "react-router";
import { useLoaderData, useFetcher, useSearchParams, Form } from "react-router";
import { requireAdmin, createAuditLog } from "~/lib/auth.server";
import { getUsersWithPagination, toggleUserActive, deleteUser, searchUsers } from "~/lib/db.server";
import { AdminLayout } from "~/components/AdminLayout";

export const meta: MetaFunction = () => {
  return [
    { title: "User Management - Admin Panel" },
    { name: "description", content: "Manage user accounts" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  
  const page = Number(url.searchParams.get("page")) || 1;
  const search = url.searchParams.get("search") || "";
  const limit = 10;

  let users;
  if (search) {
    const searchResults = await searchUsers(search);
    users = {
      users: searchResults,
      pagination: {
        total: searchResults.length,
        page: 1,
        limit: searchResults.length,
        totalPages: 1,
      },
    };
  } else {
    users = await getUsersWithPagination(page, limit, search);
  }

  return data({ admin, users, currentPage: page, searchQuery: search });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();
  const userId = Number(formData.get("userId"));

  if (intent === "toggle-active") {
    const isActive = formData.get("isActive") === "true";
    
    await toggleUserActive(userId, !isActive);
    
    await createAuditLog({
      adminId: admin.id,
      action: isActive ? "DEACTIVATE" : "ACTIVATE",
      resource: "USER",
      resourceId: userId,
      details: { isActive: !isActive },
      request,
    });
    
    return data({ success: true });
  }

  if (intent === "delete") {
    await deleteUser(userId);
    
    await createAuditLog({
      adminId: admin.id,
      action: "DELETE",
      resource: "USER",
      resourceId: userId,
      details: {},
      request,
    });
    
    return data({ success: true });
  }

  return data({ error: "Invalid action" }, { status: 400 });
}

export default function AdminUsers() {
  const { admin, users, currentPage, searchQuery } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search")?.toString() || "";
    
    const newSearchParams = new URLSearchParams();
    if (search) newSearchParams.set("search", search);
    setSearchParams(newSearchParams);
  };

  const handleToggleActive = (userId: number, isActive: boolean) => {
    fetcher.submit(
      {
        intent: "toggle-active",
        userId: userId.toString(),
        isActive: isActive.toString(),
      },
      { method: "post" }
    );
  };

  const handleDelete = (userId: number) => {
    if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
      fetcher.submit(
        {
          intent: "delete",
          userId: userId.toString(),
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="mt-2 text-gray-600">
              Manage user accounts, view user information, and control user access.
            </p>
          </div>
          <div className="flex space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Total: {users.pagination.total} users
            </span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <Form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search Users
            </label>
            <input
              type="text"
              name="search"
              id="search"
              defaultValue={searchQuery}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by name or email..."
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchParams({})}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Clear
            </button>
          )}
        </Form>
      </div>

      {/* Users Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {users.users.map((user) => (
            <li key={user.id}>
              <div className="px-4 py-4 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img
                      className="h-10 w-10 rounded-full"
                      src={user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`}
                      alt={user.name}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">
                        {user.name}
                      </div>
                      {!user.isActive && (
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.email}
                    </div>
                    <div className="text-xs text-gray-400">
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleToggleActive(user.id, user.isActive)}
                    className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                      user.isActive
                        ? "text-red-700 bg-red-100 hover:bg-red-200 focus:ring-red-500"
                        : "text-green-700 bg-green-100 hover:bg-green-200 focus:ring-green-500"
                    }`}
                    disabled={fetcher.state !== "idle"}
                  >
                    {user.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDelete(user.id)}
                    className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-full text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    disabled={fetcher.state !== "idle"}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {users.pagination.totalPages > 1 && !searchQuery && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-md shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            {currentPage > 1 && (
              <a
                href={`?page=${currentPage - 1}`}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </a>
            )}
            {currentPage < users.pagination.totalPages && (
              <a
                href={`?page=${currentPage + 1}`}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Next
              </a>
            )}
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(currentPage - 1) * users.pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * users.pagination.limit, users.pagination.total)}
                </span>{" "}
                of <span className="font-medium">{users.pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: users.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <a
                    key={page}
                    href={`?page=${page}`}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      page === currentPage
                        ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                        : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </a>
                ))}
              </nav>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}