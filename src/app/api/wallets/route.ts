import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const DEV_USER_ID = process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("wallets")
      .select("*")
      .eq("user_id", DEV_USER_ID)
      .eq("is_active", true)
      .order("type", { ascending: true });

    if (error) throw new Error(error.message);

    return NextResponse.json({ wallets: data || [] });
  } catch (err) {
    console.error("Wallets API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch wallets" },
      { status: 500 }
    );
  }
}
