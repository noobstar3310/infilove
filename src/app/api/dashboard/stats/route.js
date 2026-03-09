import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  const auth = await requireAuth(["admin"]);
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  const supabase = createServerClient();

  // Get totals by type
  const { data: topups } = await supabase
    .from("transactions")
    .select("amount")
    .eq("type", "topup")
    .eq("status", "success");

  const { data: payments } = await supabase
    .from("transactions")
    .select("amount")
    .eq("type", "payment")
    .eq("status", "success");

  const { data: donationTxs } = await supabase
    .from("transactions")
    .select("amount")
    .eq("type", "donation")
    .eq("status", "success");

  const sum = (arr) => (arr || []).reduce((s, r) => s + parseFloat(r.amount), 0);

  const totalCollected = sum(topups);
  const totalSpent = sum(payments);
  const totalDonated = sum(donationTxs);

  // Active users today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: activeUsers } = await supabase
    .from("sessions")
    .select("user_id", { count: "exact", head: true })
    .gte("created_at", todayStart.toISOString());

  // Top vendors
  const { data: vendors } = await supabase
    .from("users")
    .select("user_id, name, stall_name")
    .eq("role", "vendor");

  const topVendors = await Promise.all(
    (vendors || []).map(async (v) => {
      const { data: w } = await supabase
        .from("wallets")
        .select("total_received")
        .eq("user_id", v.user_id)
        .single();
      return { ...v, earnings: parseFloat(w?.total_received || 0) };
    })
  );

  topVendors.sort((a, b) => b.earnings - a.earnings);

  return NextResponse.json({
    total_collected: totalCollected.toFixed(2),
    total_spent: totalSpent.toFixed(2),
    total_donated: totalDonated.toFixed(2),
    remaining: (totalCollected - totalSpent - totalDonated).toFixed(2),
    active_users: activeUsers || 0,
    top_vendors: topVendors.slice(0, 5),
  });
}
