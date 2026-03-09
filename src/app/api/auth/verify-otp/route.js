import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    const { email, otp_code } = await request.json();

    if (!email || !otp_code) {
      return NextResponse.json(
        { success: false, message: "Email and OTP are required" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Find user
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Check attempts
    if (user.otp_attempts >= 5) {
      return NextResponse.json(
        { success: false, message: "Too many failed attempts. Please wait 5 minutes." },
        { status: 429 }
      );
    }

    // Check OTP expiry
    if (!user.otp_code || !user.otp_expires_at || new Date(user.otp_expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: "Code expired. Tap Resend to get a new code." },
        { status: 400 }
      );
    }

    // Verify OTP
    if (user.otp_code !== otp_code) {
      // Increment attempts
      await supabase
        .from("users")
        .update({ otp_attempts: (user.otp_attempts || 0) + 1 })
        .eq("user_id", user.user_id);

      const remaining = 4 - (user.otp_attempts || 0);
      return NextResponse.json(
        { success: false, message: `Invalid code. ${remaining} attempts remaining.` },
        { status: 400 }
      );
    }

    // OTP valid — clear it and verify user
    await supabase
      .from("users")
      .update({ otp_code: null, otp_expires_at: null, otp_attempts: 0, is_verified: true })
      .eq("user_id", user.user_id);

    // Create session
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const userAgent = request.headers.get("user-agent") || "";

    const { data: session } = await supabase
      .from("sessions")
      .insert({
        user_id: user.user_id,
        device_info: userAgent.substring(0, 500),
        expires_at: expiresAt,
      })
      .select("session_id")
      .single();

    // Get wallet balance
    const { data: wallet } = await supabase
      .from("wallets")
      .select("balance, total_received, total_spent")
      .eq("user_id", user.user_id)
      .single();

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set("session_token", session.session_id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 60, // 30 minutes
      path: "/",
    });

    return NextResponse.json({
      success: true,
      session_token: session.session_id,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        stall_name: user.stall_name,
        balance: wallet?.balance || "0.00",
      },
    });
  } catch (error) {
    console.error("verify-otp error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
