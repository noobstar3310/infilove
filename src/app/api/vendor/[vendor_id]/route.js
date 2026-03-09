import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { createServerClient } from "@/lib/supabase-server";

export async function GET(request, { params }) {
  const auth = await requireAuth();
  if (auth.error) {
    return NextResponse.json({ success: false, message: auth.error }, { status: auth.status });
  }

  const { vendor_id } = await params;
  const supabase = createServerClient();

  // Try by user_id first, then by stall_code
  let vendor;
  const { data: byId } = await supabase
    .from("users")
    .select("user_id, name, stall_name, stall_code, role")
    .eq("user_id", vendor_id)
    .eq("role", "vendor")
    .single();

  if (byId) {
    vendor = byId;
  } else {
    // Try by stall code
    const { data: byCode } = await supabase
      .from("users")
      .select("user_id, name, stall_name, stall_code, role")
      .eq("stall_code", vendor_id.toUpperCase())
      .eq("role", "vendor")
      .single();
    vendor = byCode;
  }

  if (!vendor) {
    return NextResponse.json(
      { success: false, message: "This vendor was not found. Please check the QR code." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    vendor_id: vendor.user_id,
    stall_name: vendor.stall_name || vendor.name,
    stall_code: vendor.stall_code,
    is_valid: true,
  });
}
