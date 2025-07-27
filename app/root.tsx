import type {
  LinksFunction,
  LoaderFunctionArgs,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
  isRouteErrorResponse,
} from "@remix-run/react";
import Layout from "~/components/Layout";
import stylesheet from "./tailwind.css";

export const meta: MetaFunction = () => {
  return [
    { title: "Remix Full-Stack Template" },
    { name: "description", content: "A complete Remix application template with TypeScript and Tailwind CSS" },
  ];
};

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  return json({
    ENV: {
      NODE_ENV: process.env.NODE_ENV,
    },
  });
}



export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    return (
      <html lang="en" className="h-full">
        <head>
          <Meta />
          <Links />
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </head>
        <body className="h-full bg-gray-50">
          <Layout>
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
              <div className="max-w-md w-full text-center">
                <div className="bg-white rounded-lg shadow-md p-8">
                  <div className="text-6xl font-bold text-red-500 mb-4">
                    {error.status}
                  </div>
                  <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                    {error.status === 404 ? "Page Not Found" : "Error"}
                  </h1>
                  <p className="text-gray-600 mb-6">
                    {error.statusText || error.data?.message || "Something went wrong"}
                  </p>
                  <a
                    href="/"
                    className="btn-primary px-6 py-3 inline-block"
                  >
                    Go Home
                  </a>
                </div>
              </div>
            </div>
          </Layout>
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    );
  }

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="h-full bg-gray-50">
        <Layout>
          <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="text-6xl font-bold text-red-500 mb-4">
                  💥
                </div>
                <h1 className="text-2xl font-semibold text-gray-900 mb-2">
                  Something went wrong
                </h1>
                <p className="text-gray-600 mb-6">
                  {error instanceof Error ? error.message : "An unexpected error occurred"}
                </p>
                <a
                  href="/"
                  className="btn-primary px-6 py-3 inline-block"
                >
                  Go Home
                </a>
              </div>
            </div>
          </div>
        </Layout>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export default function App() {
  const data = useLoaderData<typeof loader>();

  return (
    <html lang="en" className="h-full">
      <head>
        <Meta />
        <Links />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="h-full bg-gray-50">
        <Layout>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(data.ENV)}`,
          }}
        />
        <LiveReload />
      </body>
    </html>
  );
}