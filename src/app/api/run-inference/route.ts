import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { getGeminiClient } from "@/lib/gemini/client";

const DEV_USER_ID = (process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890").trim();

export async function POST() {
  try {
    const now = new Date();
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Fetch last 14 days of transactions
    const { data: transactions, error: txError } = await supabaseAdmin
      .from("transactions")
      .select("*")
      .eq("user_id", DEV_USER_ID)
      .gte("occurred_at", fourteenDaysAgo.toISOString())
      .order("occurred_at", { ascending: false });

    if (txError) throw new Error(txError.message);

    // 2. Fetch active user memories
    const { data: memories, error: memError } = await supabaseAdmin
      .from("user_memory")
      .select("type, content")
      .eq("user_id", DEV_USER_ID)
      .eq("is_active", true);

    if (memError) throw new Error(memError.message);

    // 3. Calculate week-over-week comparison using integer math
    const currentWeek = (transactions || []).filter(
      (t) => new Date(t.occurred_at) >= sevenDaysAgo
    );
    const previousWeek = (transactions || []).filter(
      (t) =>
        new Date(t.occurred_at) < sevenDaysAgo &&
        new Date(t.occurred_at) >= fourteenDaysAgo
    );

    function aggregateByCategory(txns: typeof transactions) {
      const result: Record<string, { totalCents: number; count: number }> = {};
      for (const t of txns || []) {
        if (t.type !== "expense") continue;
        if (!result[t.category]) result[t.category] = { totalCents: 0, count: 0 };
        result[t.category].totalCents += Math.round(Number(t.amount) * 100);
        result[t.category].count += 1;
      }
      return Object.fromEntries(
        Object.entries(result).map(([cat, data]) => [
          cat,
          { total: data.totalCents / 100, count: data.count },
        ])
      );
    }

    const currentWeekByCategory = aggregateByCategory(currentWeek);
    const previousWeekByCategory = aggregateByCategory(previousWeek);

    const weekComparison: Record<string, { current: number; previous: number; change_pct: number }> = {};
    const allCategories = new Set([
      ...Object.keys(currentWeekByCategory),
      ...Object.keys(previousWeekByCategory),
    ]);

    for (const cat of allCategories) {
      const current = currentWeekByCategory[cat]?.total || 0;
      const previous = previousWeekByCategory[cat]?.total || 0;
      const changePct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
      weekComparison[cat] = { current, previous, change_pct: changePct };
    }

    // 4. Send to Gemini for analysis
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const analysisPrompt = `
You are a financial analyst engine. Analyze the following data and return
ONLY a JSON array of 2-3 proactive insights. No prose, no markdown, no code blocks.

TRANSACTION SUMMARY (last 14 days):
Current week transactions: ${currentWeek.length}
Previous week transactions: ${previousWeek.length}

WEEK-OVER-WEEK COMPARISON:
${JSON.stringify(weekComparison, null, 2)}

USER MEMORIES:
${(memories || []).map((m) => m.content).join("; ") || "No memories yet"}

Return format (ONLY valid JSON array, no other text):
[
  {
    "title": "Short alert title",
    "body": "2-3 sentence explanation with specific amounts in ₺",
    "severity": "info|warning|alert|positive",
    "category": "related transaction category or null"
  }
]

Focus on:
- Spending anomalies (any category up/down >25% week-over-week)
- Upcoming recurring charges and total monthly subscription burden
- Savings opportunities
- Positive trends (spending down in a category)
- Flag any subscription price increases detected
- Consider Turkey's ~2% monthly inflation — only flag real behavioral increases above inflation
- If installment (taksit) data exists in metadata, mention total monthly installment obligations
`.trim();

    const result = await model.generateContent(analysisPrompt);
    const responseText = result.response.text();

    // 5. Parse JSON response (handle potential markdown code blocks)
    let insights;
    try {
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      insights = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse insights JSON:", responseText);
      insights = [
        {
          title: "Financial Summary Available",
          body: "Your spending data has been analyzed. Check back for detailed insights.",
          severity: "info",
          category: null,
        },
      ];
    }

    // 6. Clear old insights and insert new ones
    await supabaseAdmin
      .from("proactive_insights")
      .delete()
      .eq("user_id", DEV_USER_ID)
      .eq("is_dismissed", false);

    const insightRecords = insights.map(
      (insight: { title: string; body: string; severity: string; category: string | null }) => ({
        user_id: DEV_USER_ID,
        title: insight.title,
        body: insight.body,
        severity: insight.severity,
        category: insight.category,
      })
    );

    const { data: savedInsights, error: insertError } = await supabaseAdmin
      .from("proactive_insights")
      .insert(insightRecords)
      .select();

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ insights: savedInsights });
  } catch (err) {
    console.error("Inference error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Inference failed" },
      { status: 500 }
    );
  }
}
