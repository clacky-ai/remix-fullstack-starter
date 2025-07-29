import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData, useFetcher, useSearchParams, Form } from "react-router";
import { requireAdmin, createAuditLog } from "~/lib/auth.server";
import { getPostsWithPagination, updatePostStatus, deletePost, searchPosts } from "~/lib/db.server";
import { AdminLayout } from "~/components/AdminLayout";

export const meta: MetaFunction = () => {
  return [
    { title: "Post Management - Admin Panel" },
    { name: "description", content: "Manage posts and content" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const admin = await requireAdmin(request);
  const url = new URL(request.url);
  
  const page = Number(url.searchParams.get("page")) || 1;
  const search = url.searchParams.get("search") || "";
  const status = url.searchParams.get("status") || "";
  const limit = 10;

  let posts;
  if (search) {
    const searchResults = await searchPosts(search);
    posts = {
      posts: searchResults,
      pagination: {
        total: searchResults.length,
        page: 1,
        limit: searchResults.length,
        totalPages: 1,
      },
    };
  } else {
    posts = await getPostsWithPagination(page, limit, search, status);
  }

  return data({ admin, posts, currentPage: page, searchQuery: search, statusFilter: status });
}

export async function action({ request }: ActionFunctionArgs) {
  const admin = await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent")?.toString();
  const postId = Number(formData.get("postId"));

  if (intent === "update-status") {
    const status = formData.get("status")?.toString() as "DRAFT" | "PUBLISHED" | "ARCHIVED";
    
    await updatePostStatus(postId, status);
    
    await createAuditLog({
      adminId: admin.id,
      action: "UPDATE",
      resource: "POST",
      resourceId: postId,
      details: { status },
      request,
    });
    
    return data({ success: true });
  }

  if (intent === "delete") {
    await deletePost(postId);
    
    await createAuditLog({
      adminId: admin.id,
      action: "DELETE",
      resource: "POST",
      resourceId: postId,
      details: {},
      request,
    });
    
    return json({ success: true });
  }

  return json({ error: "Invalid action" }, { status: 400 });
}

export default function AdminPosts() {
  const { admin, posts, currentPage, searchQuery, statusFilter } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const search = formData.get("search")?.toString() || "";
    const status = formData.get("status")?.toString() || "";
    
    const newSearchParams = new URLSearchParams();
    if (search) newSearchParams.set("search", search);
    if (status) newSearchParams.set("status", status);
    setSearchParams(newSearchParams);
  };

  const handleStatusChange = (postId: number, status: string) => {
    fetcher.submit(
      {
        intent: "update-status",
        postId: postId.toString(),
        status,
      },
      { method: "post" }
    );
  };

  const handleDelete = (postId: number) => {
    if (confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      fetcher.submit(
        {
          intent: "delete",
          postId: postId.toString(),
        },
        { method: "post" }
      );
    }
  };

  const getStatusBadge = (status: string, isPublished: boolean) => {
    if (status === "PUBLISHED" && isPublished) {
      return "bg-green-100 text-green-800";
    } else if (status === "DRAFT") {
      return "bg-yellow-100 text-yellow-800";
    } else if (status === "ARCHIVED") {
      return "bg-gray-100 text-gray-800";
    }
    return "bg-blue-100 text-blue-800";
  };

  return (
    <AdminLayout admin={admin}>
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Post Management</h1>
            <p className="mt-2 text-gray-600">
              Manage posts, update publication status, and moderate content.
            </p>
          </div>
          <div className="flex space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Total: {posts.pagination.total} posts
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="mb-6">
        <Form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700">
              Search Posts
            </label>
            <input
              type="text"
              name="search"
              id="search"
              defaultValue={searchQuery}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              placeholder="Search by title, content, or author..."
            />
          </div>
          <div className="w-48">
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Filter by Status
            </label>
            <select
              name="status"
              id="status"
              defaultValue={statusFilter}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Search
          </button>
          {(searchQuery || statusFilter) && (
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

      {/* Posts Table */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Author
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts.posts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                        {post.title}
                      </div>
                      <div className="text-sm text-gray-500 max-w-xs truncate">
                        {post.excerpt}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        Category: {post.category}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {post.user?.name || post.author}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(post.status, post.isPublished)}`}>
                      {post.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>
                      {new Date(post.date).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      Created: {new Date(post.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <select
                        value={post.status}
                        onChange={(e) => handleStatusChange(post.id, e.target.value)}
                        className="text-xs border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                        disabled={fetcher.state !== "idle"}
                      >
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="text-red-600 hover:text-red-900 text-xs"
                        disabled={fetcher.state !== "idle"}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {posts.pagination.totalPages > 1 && !searchQuery && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-md shadow">
          <div className="flex-1 flex justify-between sm:hidden">
            {currentPage > 1 && (
              <a
                href={`?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Previous
              </a>
            )}
            {currentPage < posts.pagination.totalPages && (
              <a
                href={`?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ""}`}
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
                  {(currentPage - 1) * posts.pagination.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(currentPage * posts.pagination.limit, posts.pagination.total)}
                </span>{" "}
                of <span className="font-medium">{posts.pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                {Array.from({ length: posts.pagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <a
                    key={page}
                    href={`?page=${page}${statusFilter ? `&status=${statusFilter}` : ""}`}
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