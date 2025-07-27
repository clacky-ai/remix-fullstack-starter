import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Data Example - Remix Full-Stack Template" },
    { name: "description", content: "Example of data loading with Remix loaders" },
  ];
};

type User = {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar: string;
};

type Post = {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  category: string;
};

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function loader({ request }: LoaderFunctionArgs) {
  // Simulate fetching data from an API
  await delay(500);

  const users: User[] = [
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

  const posts: Post[] = [
    {
      id: 1,
      title: "Getting Started with Remix",
      excerpt: "Learn how to build modern web applications with Remix framework...",
      author: "John Doe",
      date: "2024-01-15",
      category: "Tutorial"
    },
    {
      id: 2,
      title: "TypeScript Best Practices",
      excerpt: "Explore advanced TypeScript patterns and techniques for better code...",
      author: "Jane Smith",
      date: "2024-01-20",
      category: "Development"
    },
    {
      id: 3,
      title: "Tailwind CSS Tips",
      excerpt: "Discover useful Tailwind CSS utilities and customization options...",
      author: "Bob Johnson",
      date: "2024-01-25",
      category: "Design"
    }
  ];

  return json({
    users,
    posts,
    loadedAt: new Date().toISOString()
  });
}

export default function DataExample() {
  const { users, posts, loadedAt } = useLoaderData<typeof loader>();

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Data Loading Example
        </h1>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <p className="text-blue-800">
            This page demonstrates how to use Remix loaders to fetch data on the server before rendering. 
            The data below was loaded at: <strong>{new Date(loadedAt).toLocaleString()}</strong>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Users Section */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Users</h2>
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="card flex items-center space-x-4">
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-12 h-12 rounded-full"
                  />
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{user.name}</h3>
                    <p className="text-gray-600">{user.email}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'Admin' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
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
                      {new Date(post.date).toLocaleDateString()}
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