import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request) {
  const auth = await requireAuth(["user"]);
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const { amount, donation_type } = await request.json();
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0 || !["full", "partial"].includes(donation_type)) {
      return NextResponse.json(
        { success: false, message: "Valid amount and donation_type (full/partial) required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const { data, error } = await supabase.rpc("process_donation", {
      p_user_id: auth.session.user.user_id,
      p_amount: numAmount,
      p_donation_type: donation_type,
    });

    if (error) {
      if (error.message?.includes("Insufficient balance")) {
        return NextResponse.json({ success: false, message: "Insufficient balance" }, { status: 400 });
      }
      console.error("donation error:", error);
      return NextResponse.json({ success: false, message: "Donation failed" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      new_balance: data.new_balance,
      donation_id: data.donation_id,
    });
  } catch (error) {
    console.error("donation error:", error);
    return NextResponse.json({ success: false, message: "Something went wrong" }, { status: 500 });
  }
}
