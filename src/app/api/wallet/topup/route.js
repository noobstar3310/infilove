import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request) {
  const auth = await requireAuth(["admin"]);
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  try {
    const { user_id, amount } = await request.json();
    const numAmount = parseFloat(amount);

    if (!user_id || !numAmount || numAmount < 1) {
      return NextResponse.json(
        { success: false, message: "Valid user_id and amount (min RM 1.00) required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Verify target user exists
    const { data: targetUser } = await supabase
      .from("users")
      .select("user_id, name, email")
      .eq("user_id", user_id)
      .single();

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Process top-up atomically
    const { data, error } = await supabase.rpc("process_topup", {
      p_admin_id: auth.session.user.user_id,
      p_user_id: user_id,
      p_amount: numAmount,
    });

    if (error) {
      console.error("topup error:", error);
      return NextResponse.json(
        { success: false, message: "Top-up failed. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      new_balance: data.new_balance,
      tx_id: data.tx_id,
      message: `RM ${numAmount.toFixed(2)} credited to ${targetUser.name}`,
    });
  } catch (error) {
    console.error("topup error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong" },
      { status: 500 }
    );
  }
}
