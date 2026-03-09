import { createServerClient } from "./supabase-server";
import { cookies } from "next/headers";

export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("session_token")?.value;
  if (!sessionToken) return null;

  const supabase = createServerClient();
  const { data: session } = await supabase
    .from("sessions")
    .select("*, users(*)")
    .eq("session_id", sessionToken)
    .eq("is_active", true)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!session) return null;

  // Extend session on activity
  await supabase
    .from("sessions")
    .update({ expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString() })
    .eq("session_id", sessionToken);

  return {
    session_id: session.session_id,
    user: session.users,
  };
}

export async function requireAuth(allowedRoles = []) {
  const session = await getSession();
  if (!session) {
    return { error: "Unauthorized", status: 401 };
  }
  if (allowedRoles.length > 0 && !allowedRoles.includes(session.user.role)) {
    return { error: "Forbidden", status: 403 };
  }
  return { session };
}
