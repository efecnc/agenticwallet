import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const DEV_USER_ID = (process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890").trim();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const { data, error, count } = await supabaseAdmin
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", DEV_USER_ID)
      .order("occurred_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw new Error(error.message);

    return NextResponse.json({
      transactions: data || [],
      total: count || 0,
    });
  } catch (err) {
    console.error("Transactions API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch transactions" },
      { status: 500 }
    );
  }
}
