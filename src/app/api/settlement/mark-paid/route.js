import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request) {
  const auth = await requireAuth(["admin"]);
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const { vendor_id, bank_ref } = await request.json();

    if (!vendor_id || !bank_ref) {
      return NextResponse.json(
        { success: false, message: "vendor_id and bank_ref required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Get vendor earnings
    const { data: wallet } = await supabase
      .from("wallets")
      .select("total_received")
      .eq("user_id", vendor_id)
      .single();

    // Create settlement record
    const { data: settlement, error } = await supabase
      .from("settlements")
      .insert({
        vendor_id,
        admin_id: auth.session.user.user_id,
        amount: wallet?.total_received || 0,
        bank_ref,
        status: "paid",
        settled_at: new Date().toISOString(),
      })
      .select("settlement_id")
      .single();

    if (error) {
      console.error("settlement error:", error);
      return NextResponse.json({ success: false, message: "Settlement failed" }, { status: 500 });
    }

    // Update vendor settlement status
    await supabase
      .from("users")
      .update({ settlement_status: "paid" })
      .eq("user_id", vendor_id);

    return NextResponse.json({
      success: true,
      settlement_id: settlement.settlement_id,
    });
  } catch (error) {
    console.error("settlement error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
