import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import { Form, useActionData, useNavigation } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "Contact - Remix Full-Stack Template" },
    { name: "description", content: "Contact form example with validation" },
  ];
};

type ActionData = {
  errors?: {
    name?: string;
    email?: string;
    message?: string;
  };
  success?: boolean;
};

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");

  const errors: ActionData["errors"] = {};

  if (typeof name !== "string" || name.length < 2) {
    errors.name = "Name must be at least 2 characters long";
  }

  if (typeof email !== "string" || !email.includes("@")) {
    errors.email = "Please enter a valid email address";
  }

  if (typeof message !== "string" || message.length < 10) {
    errors.message = "Message must be at least 10 characters long";
  }

  if (Object.keys(errors).length > 0) {
    return json<ActionData>({ errors }, { status: 400 });
  }

  // In a real app, you would save the data to a database
  // For now, we'll just simulate a successful submission
  await new Promise(resolve => setTimeout(resolve, 1000));

  return json<ActionData>({ success: true });
}

export default function Contact() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  if (actionData?.success) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-2xl font-semibold text-green-900 mb-2">
              Message Sent Successfully!
            </h1>
            <p className="text-green-800 mb-6">
              Thank you for your message. We'll get back to you soon.
            </p>
            <a href="/contact" className="btn-primary">
              Send Another Message
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Contact Us
        </h1>
        
        <div className="card">
          <p className="text-gray-600 mb-6">
            This is a demo contact form that shows how to handle form submissions with validation in Remix. 
            Try submitting the form with invalid data to see error handling in action.
          </p>

          <Form method="post" className="space-y-6">
            <div>
              <label htmlFor="name" className="form-label">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="form-input"
                placeholder="Enter your name"
              />
              {actionData?.errors?.name && (
                <div className="form-error">{actionData.errors.name}</div>
              )}
            </div>

            <div>
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="form-input"
                placeholder="Enter your email"
              />
              {actionData?.errors?.email && (
                <div className="form-error">{actionData.errors.email}</div>
              )}
            </div>

            <div>
              <label htmlFor="message" className="form-label">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                rows={5}
                className="form-input"
                placeholder="Enter your message"
              />
              {actionData?.errors?.message && (
                <div className="form-error">{actionData.errors.message}</div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full disabled:opacity-50"
            >
              {isSubmitting ? "Sending..." : "Send Message"}
            </button>
          </Form>
        </div>
      </div>
    </div>
  );
}