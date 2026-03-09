import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET() {
  const auth = await requireAuth(["admin"]);
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  const supabase = createServerClient();

  // Get all vendors with their earnings
  const { data: vendors } = await supabase
    .from("users")
    .select("user_id, name, stall_name, bank_account, bank_name, settlement_status")
    .eq("role", "vendor")
    .order("stall_name");

  // Get earnings for each vendor
  const vendorData = await Promise.all(
    (vendors || []).map(async (vendor) => {
      const { data: earnings } = await supabase
        .from("wallets")
        .select("balance, total_received")
        .eq("user_id", vendor.user_id)
        .single();

      const { data: settlement } = await supabase
        .from("settlements")
        .select("settlement_id, bank_ref, status, settled_at")
        .eq("vendor_id", vendor.user_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      return {
        ...vendor,
        total_earnings: earnings?.total_received || "0.00",
        settlement: settlement || null,
      };
    })
  );

  return NextResponse.json({ vendors: vendorData });
}
