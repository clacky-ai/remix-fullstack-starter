import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData, useSearchParams, Form } from "@remix-run/react";
import { requireAdmin } from "~/lib/auth.server";
import { getAuditLogs } from "~/lib/db.server";
import { AdminLayout } from "~/components/AdminLayout";

export const meta: MetaFunction = () => {
  return [
    { title: "Audit Logs - Admin Panel" },
    { name: "description", content: "View system audit logs and admin activities" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  
  const page = Number(url.searchParams.get("page")) || 1;
  const limit = 20;

  const auditLogs = await getAuditLogs(page, limit);

  return json({ admin, auditLogs, currentPage: page });
}

export default function AdminAuditLogs() {
  const { admin, auditLogs, currentPage } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();

  const getActionColor = (action: string) => {
    switch (action.toUpperCase()) {
      case "LOGIN":
        return "bg-blue-100 text-blue-800";
      case "CREATE":
        return "bg-green-100 text-green-800";
      case "UPDATE":
        return "bg-yellow-100 text-yellow-800";
      case "DELETE":
        return "bg-red-100 text-red-800";
      case "ACTIVATE":
        return "bg-green-100 text-green-800";
      case "DEACTIVATE":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toUpperCase()) {
      case "LOGIN":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
          </svg>
        );
      case "CREATE":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case "UPDATE":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case "DELETE":
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        );
    }
  };

  return (
    <AdminLayout admin={admin}>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="mt-2 text-gray-600">
              Monitor all administrative actions and system activities. Track who did what and when.
            </p>
          </div>
          <div className="flex space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Total: {auditLogs.pagination.total} entries
            </span>
          </div>
        </div>
      </div>

      {/* Audit Logs List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        <ul className="divide-y divide-gray-200">
          {auditLogs.logs.map((log) => (
            <li key={log.id}>
              <div className="px-4 py-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        <span className="mr-1">{getActionIcon(log.action)}</span>
                        {log.action}
                      </div>
                    </div>
                    <div className="ml-4 flex-1 min-w-0">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {log.admin.name}
                        </p>
                        <p className="ml-2 text-sm text-gray-500">
                          {log.action.toLowerCase()}d {log.resource.toLowerCase()}
                          {log.resourceId && ` #${log.resourceId}`}
                        </p>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500">
                        <p className="truncate">
                          {log.admin.email}
                        </p>
                        {log.ipAddress && (
                          <>
                            <span className="mx-1">•</span>
                            <p className="truncate">
                              IP: {log.ipAddress}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <p className="text-sm text-gray-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {/* Details Section */}
                {log.details && Object.keys(log.details as object).length > 0 && (
                  <div className="mt-3">
                    <details className="group">
                      <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600 focus:outline-none">
                        View details
                        <span className="ml-1 transform transition-transform group-open:rotate-180 inline-block">
                          ▼
                        </span>
                      </summary>
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap">
                          {JSON.stringify(log.details, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                )}

                {/* User Agent (truncated) */}
                {log.userAgent && (
                  <div className="mt-2 text-xs text-gray-400 truncate">
                    User Agent: {log.userAgent}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {auditLogs.pagination.totalPages > 1 && (
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
            {currentPage < auditLogs.pagination.totalPages && (
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
                  {(currentPage - 1) * auditLogs.pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * auditLogs.pagination.limit, auditLogs.pagination.total)}
                </span>{" "}
                of <span className="font-medium">{auditLogs.pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: auditLogs.pagination.totalPages }, (_, i) => i + 1).map((page) => (
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

      {/* Legend */}
      <div className="mt-8 bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Action Legend</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {[
            { action: "LOGIN", description: "User login" },
            { action: "CREATE", description: "Resource created" },
            { action: "UPDATE", description: "Resource updated" },
            { action: "DELETE", description: "Resource deleted" },
            { action: "ACTIVATE", description: "Account activated" },
            { action: "DEACTIVATE", description: "Account deactivated" },
          ].map(({ action, description }) => (
            <div key={action} className="flex items-center space-x-2">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getActionColor(action)}`}>
                <span className="mr-1">{getActionIcon(action)}</span>
                {action}
              </span>
              <span className="text-xs text-gray-500">{description}</span>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}