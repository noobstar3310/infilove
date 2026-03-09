import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request) {
  const auth = await requireAuth(["admin"]);
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = (page - 1) * limit;
  const type = searchParams.get("type");
  const email = searchParams.get("email");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  const supabase = createServerClient();

  let query = supabase
    .from("transactions")
    .select(
      "tx_id, type, from_user_id, to_user_id, amount, status, notes, created_at, from_user:users!transactions_from_user_id_fkey(name, email, stall_name), to_user:users!transactions_to_user_id_fkey(name, email, stall_name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  query = query.range(offset, offset + limit - 1);

  const { data: transactions, count } = await query;

  // Filter by email if needed (post-query since it's on a joined table)
  let filtered = transactions || [];
  if (email) {
    const emailLower = email.toLowerCase();
    filtered = filtered.filter(
      (tx) =>
        tx.from_user?.email?.includes(emailLower) ||
        tx.to_user?.email?.includes(emailLower)
    );
  }

  // Calculate totals
  const { data: totals } = await supabase.rpc("get_transaction_totals", {}).catch(() => ({ data: null }));

  return NextResponse.json({
    transactions: filtered,
    total_count: count || 0,
    totals: totals || {},
  });
}
