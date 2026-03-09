import { NextResponse } from "next/server";
import { getCalendarEvents } from "@/lib/tools/get-calendar-events";

export async function GET() {
  try {
    const result = await getCalendarEvents({ days_ahead: 30 });
    return NextResponse.json(result);
  } catch (err) {
    console.error("Calendar events error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
