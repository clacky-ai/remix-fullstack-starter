import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Remix Full-Stack Template" },
    { name: "description", content: "Welcome to the Remix full-stack template!" },
  ];
};

export default function Index() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to Remix Full-Stack Template
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            A complete template with TypeScript, Tailwind CSS, routing, data loading, and form handling
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">TypeScript Ready</h3>
              <p className="text-gray-600">Full TypeScript support with proper type checking and IntelliSense</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Tailwind CSS</h3>
              <p className="text-gray-600">Utility-first CSS framework with custom components and utilities</p>
            </div>
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Full-Stack Ready</h3>
              <p className="text-gray-600">Server-side rendering, data loading, and form handling examples</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/about" className="btn-primary px-6 py-3">
              Learn More
            </Link>
            <Link to="/contact" className="btn-outline px-6 py-3">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}