import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  const supabase = createServerClient();
  const { data: wallet } = await supabase
    .from("wallets")
    .select("balance, total_received, total_spent")
    .eq("user_id", auth.session.user.user_id)
    .single();

  return NextResponse.json({
    balance: wallet?.balance || "0.00",
    total_received: wallet?.total_received || "0.00",
    total_spent: wallet?.total_spent || "0.00",
    user: {
      user_id: auth.session.user.user_id,
      name: auth.session.user.name,
      email: auth.session.user.email,
      role: auth.session.user.role,
      stall_name: auth.session.user.stall_name,
    },
  });
}
