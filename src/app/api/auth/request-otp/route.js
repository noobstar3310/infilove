import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase-server";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { success: false, message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    const supabase = createServerClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Rate limit: check recent OTP requests
    const fiveMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: recentUser } = await supabase
      .from("users")
      .select("otp_expires_at, otp_attempts")
      .eq("email", normalizedEmail)
      .single();

    if (recentUser?.otp_attempts >= 3 && recentUser?.otp_expires_at && new Date(recentUser.otp_expires_at) > new Date()) {
      return NextResponse.json(
        { success: false, message: "Too many requests. Please wait before requesting a new code." },
        { status: 429 }
      );
    }

    // Generate OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    // Check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("user_id, role, name")
      .eq("email", normalizedEmail)
      .single();

    if (existingUser) {
      // Update OTP for existing user
      await supabase
        .from("users")
        .update({ otp_code: otpCode, otp_expires_at: otpExpiresAt, otp_attempts: 0 })
        .eq("user_id", existingUser.user_id);
    } else {
      // Create new user with role "user"
      await supabase.from("users").insert({
        name: normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: "user",
        otp_code: otpCode,
        otp_expires_at: otpExpiresAt,
        otp_attempts: 0,
      });
    }

    // Send OTP via email (using Resend)
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "InfiLove <noreply@infilove.app>",
            to: [normalizedEmail],
            subject: "Your InfiLove OTP Code",
            html: `<div style="font-family:sans-serif;max-width:400px;margin:0 auto;padding:24px;">
              <h2 style="color:#1A56DB;">InfiLove E-Coupon</h2>
              <p>Your verification code is:</p>
              <div style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#1A56DB;padding:16px;background:#EFF6FF;border-radius:8px;text-align:center;margin:16px 0;">
                ${otpCode}
              </div>
              <p style="color:#6B7280;font-size:14px;">This code expires in 5 minutes.</p>
            </div>`,
          }),
        });
      } catch {
        // Email send failed — log but don't block
        console.error("Failed to send OTP email");
      }
    } else {
      // Dev mode: log OTP to console
      console.log(`[DEV] OTP for ${normalizedEmail}: ${otpCode}`);
    }

    return NextResponse.json({
      success: true,
      message: "OTP sent to your email",
      // In dev mode, return OTP for testing
      ...(process.env.NODE_ENV === "development" ? { dev_otp: otpCode } : {}),
    });
  } catch (error) {
    console.error("request-otp error:", error);
    return NextResponse.json(
      { success: false, message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
