import type { ActionFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { logoutAdmin } from "~/lib/auth.server";

export async function action({ request }: ActionFunctionArgs) {
  const cookie = await logoutAdmin(request);
  
  return redirect("/admin/login", {
    headers: {
      "Set-Cookie": cookie,
    },
  });
}

export async function loader() {
  return redirect("/admin/dashboard");
}