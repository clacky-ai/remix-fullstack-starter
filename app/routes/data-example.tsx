import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { data } from "react-router";
import { useLoaderData } from "react-router";
import { getUsers, getPosts, getAdminUsers } from "~/lib/db.server";

export const meta: MetaFunction = () => {
  return [
    { title: "Data Example - Remix Full-Stack Template" },
    { name: "description", content: "Example of data loading with Remix loaders" },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Fetch data from the database
    const [users, posts, admins] = await Promise.all([
      getUsers(),
      getPosts(),
      getAdminUsers()
    ]);

    // Format posts to match the expected structure
    const formattedPosts = posts.map(post => ({
      ...post,
      date: post.date.toISOString().split('T')[0] // Format date as YYYY-MM-DD
    }));

    // Combine users and admins for display, adding a userType field and unique keys
    const allUsers = [
      ...users.map(user => ({ ...user, userType: 'User' as const, uniqueKey: `user-${user.id}` })),
      ...admins.map(admin => ({ ...admin, userType: 'Admin' as const, adminRole: admin.role, uniqueKey: `admin-${admin.id}` }))
    ];

    // Format date as a consistent format for SSR/client consistency
    const loadedAtFormatted = new Date().toISOString().replace('T', ' ').slice(0, -5) + ' UTC';

    return data({
      users: allUsers,
      posts: formattedPosts,
      loadedAt: loadedAtFormatted
    });
  } catch (error) {
    console.error('Database error:', error);
    throw new Response('Database error', { status: 500 });
  }
}

export default function DataExample() {
  const { users, posts, loadedAt } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Data Loading Example
        </h1>
        
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <p className="text-green-800">
            This page demonstrates how to use Remix loaders to fetch data from a PostgreSQL database using Prisma ORM. 
            The data below was loaded from the database at: <strong>{loadedAt}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users Section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Users</h2>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.uniqueKey} className="card flex items-center space-x-4">
                  <img
                    src={user.avatar || ''}
                    alt={user.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      user.userType === 'Admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.userType === 'Admin' ? `Admin (${user.adminRole})` : user.userType}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Posts Section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Recent Posts</h2>
            <div className="space-y-4">
              {posts.map((post) => (
                <div key={post.id} className="card">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                    <span className="text-sm text-gray-500">
                      {post.date}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                  <p className="text-gray-600 text-sm mb-3">{post.excerpt}</p>
                  <div className="text-sm text-gray-500">
                    By {post.author}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}