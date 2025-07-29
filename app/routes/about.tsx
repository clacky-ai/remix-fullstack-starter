import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "About - Remix Full-Stack Template" },
    { name: "description", content: "Learn more about this Remix template" },
  ];
};

export default function About() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          About This Template
        </h1>
        
        <div className="prose prose-lg max-w-none">
          <p className="text-gray-600 mb-6">
            This is a comprehensive Remix full-stack application template designed to help you quickly start building modern web applications with best practices built-in.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Features</h2>
              <ul className="space-y-2 text-gray-600">
                <li>✅ TypeScript support</li>
                <li>✅ Tailwind CSS styling</li>
                <li>✅ Server-side rendering</li>
                <li>✅ Data loading with loaders</li>
                <li>✅ Form handling with actions</li>
                <li>✅ Error boundaries</li>
                <li>✅ Responsive design</li>
                <li>✅ SEO optimized</li>
              </ul>
            </div>

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Tech Stack</h2>
              <ul className="space-y-2 text-gray-600">
                <li><strong>Framework:</strong> Remix</li>
                <li><strong>Language:</strong> TypeScript</li>
                <li><strong>Styling:</strong> Tailwind CSS</li>
                <li><strong>Build Tool:</strong> Vite</li>
                <li><strong>Runtime:</strong> Node.js</li>
                <li><strong>Package Manager:</strong> npm</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Getting Started
            </h3>
            <p className="text-blue-800">
              This template includes everything you need to start building a full-stack application. 
              Check out the contact page for form handling examples, or explore the data example page to see how loaders work.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}