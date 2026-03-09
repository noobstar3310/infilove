import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request) {
  const auth = await requireAuth(["admin"]);
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");

  const supabase = createServerClient();

  let query = supabase
    .from("transactions")
    .select(
      "tx_id, type, amount, status, notes, created_at, from_user:users!transactions_from_user_id_fkey(name, email), to_user:users!transactions_to_user_id_fkey(name, email)"
    )
    .order("created_at", { ascending: false });

  if (type) query = query.eq("type", type);
  if (dateFrom) query = query.gte("created_at", dateFrom);
  if (dateTo) query = query.lte("created_at", dateTo);

  const { data: transactions } = await query;

  // Build CSV
  const headers = ["Timestamp", "Type", "From", "From Email", "To", "To Email", "Amount (RM)", "Status", "Notes"];
  const rows = (transactions || []).map((tx) => [
    new Date(tx.created_at).toLocaleString("en-MY"),
    tx.type,
    tx.from_user?.name || "-",
    tx.from_user?.email || "-",
    tx.to_user?.name || "-",
    tx.to_user?.email || "-",
    tx.amount,
    tx.status,
    tx.notes || "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="transactions_${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}
