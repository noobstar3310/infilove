import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (sessionToken) {
      const supabase = createServerClient();
      await supabase
        .from("sessions")
        .update({ is_active: false })
        .eq("session_id", sessionToken);

      cookieStore.delete("session_token");
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true });
  }
}
