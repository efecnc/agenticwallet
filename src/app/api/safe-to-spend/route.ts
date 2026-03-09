import { NextResponse } from "next/server";
import { calculateSafeToSpend } from "@/lib/tools/calculate-safe-to-spend";

export async function GET() {
  try {
    const result = await calculateSafeToSpend({});
    return NextResponse.json(result);
  } catch (err) {
    console.error("Safe-to-spend API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to calculate safe-to-spend" },
      { status: 500 }
    );
  }
}
