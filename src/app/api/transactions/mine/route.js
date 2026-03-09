import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request) {
  const auth = await requireAuth();
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
  const offset = (page - 1) * limit;
  const userId = auth.session.user.user_id;

  const supabase = createServerClient();

  const { data: transactions, count } = await supabase
    .from("transactions")
    .select(
      "tx_id, type, from_user_id, to_user_id, amount, status, notes, created_at, from_user:users!transactions_from_user_id_fkey(name, stall_name), to_user:users!transactions_to_user_id_fkey(name, stall_name)",
      { count: "exact" }
    )
    .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  return NextResponse.json({
    transactions: (transactions || []).map((tx) => ({
      ...tx,
      direction:
        tx.type === "topup" && tx.to_user_id === userId
          ? "credit"
          : tx.type === "payment" && tx.from_user_id === userId
          ? "debit"
          : tx.type === "payment" && tx.to_user_id === userId
          ? "credit"
          : tx.type === "donation"
          ? "debit"
          : "debit",
    })),
    total_count: count || 0,
  });
}
