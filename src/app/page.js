import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RootPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const role = session.user.role;
  if (role === "admin") redirect("/admin");
  if (role === "vendor") redirect("/vendor");
  redirect("/home");
}
