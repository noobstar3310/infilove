import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request) {
  const auth = await requireAuth(["user"]);
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const { vendor_id, amount, idempotency_key } = await request.json();
    const numAmount = parseFloat(amount);

    if (!vendor_id || !numAmount || numAmount < 0.5 || !idempotency_key) {
      return NextResponse.json(
        { success: false, message: "Valid vendor_id, amount (min RM 0.50), and idempotency_key required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify vendor exists
    const { data: vendor } = await supabase
      .from("users")
      .select("user_id, stall_name, name")
      .eq("user_id", vendor_id)
      .eq("role", "vendor")
      .single();

    if (!vendor) {
      return NextResponse.json(
        { success: false, message: "Vendor not found" },
        { status: 404 }
      );
    }

    // Process payment atomically
    const { data, error } = await supabase.rpc("process_payment", {
      p_from_user_id: auth.session.user.user_id,
      p_to_user_id: vendor_id,
      p_amount: numAmount,
      p_idempotency_key: idempotency_key,
    });

    if (error) {
      const msg = error.message || "";
      if (msg.includes("Insufficient balance")) {
        return NextResponse.json({ success: false, message: "Insufficient balance" }, { status: 400 });
      }
      if (msg.includes("cannot pay yourself")) {
        return NextResponse.json({ success: false, message: "You cannot pay yourself" }, { status: 400 });
      }
      console.error("payment error:", error);
      return NextResponse.json({ success: false, message: "Payment failed. Please try again." }, { status: 500 });
    }

    if (data.duplicate) {
      return NextResponse.json({
        success: true,
        message: "This payment was already processed.",
        new_balance: data.new_balance,
        tx_id: data.tx_id,
        duplicate: true,
      });
    }

    return NextResponse.json({
      success: true,
      new_balance: data.new_balance,
      tx_id: data.tx_id,
      vendor_name: vendor.stall_name || vendor.name,
    });
  } catch (error) {
    console.error("payment error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
