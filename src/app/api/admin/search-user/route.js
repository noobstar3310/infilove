import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request) {
  const auth = await requireAuth(["admin"]);
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ users: [] });
  }

  const supabase = createServerClient();

  const { data: users } = await supabase
    .from("users")
    .select("user_id, name, email, role")
    .or(`email.ilike.%${query}%,name.ilike.%${query}%`)
    .limit(10);

  // Get balances for found users
  const usersWithBalance = await Promise.all(
    (users || []).map(async (u) => {
      const { data: wallet } = await supabase
        .from("wallets")
        .select("balance")
        .eq("user_id", u.user_id)
        .single();
      return { ...u, balance: wallet?.balance || "0.00" };
    })
  );

  return NextResponse.json({ users: usersWithBalance });
}
