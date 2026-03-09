import { supabaseAdmin } from "@/lib/supabase/server";

const DEV_USER_ID = (process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890").trim();

interface AnalyzeDiscountsArgs {
  merchant?: string;
  period_days?: number;
  threshold_pct?: number;
}

interface MerchantDiscount {
  merchant: string;
  average_amount: number;
  this_month_below_avg_count: number;
  total_saved: number;
  best_deal_amount: number;
  best_deal_date: string;
}

interface DiscountAnalysisResult {
  merchants: MerchantDiscount[];
  total_saved_this_month: number;
  discount_memories: { content: string; confidence: number }[];
}

export async function analyzeDiscounts(args: AnalyzeDiscountsArgs): Promise<DiscountAnalysisResult> {
  const periodDays = args.period_days || 60;
  const thresholdPct = args.threshold_pct || 20;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // 1. Fetch expense transactions
  let query = supabaseAdmin
    .from("transactions")
    .select("merchant, amount, occurred_at, category")
    .eq("user_id", DEV_USER_ID)
    .eq("type", "expense")
    .gte("occurred_at", startDate.toISOString())
    .order("occurred_at", { ascending: false })
    .limit(500);

  if (args.merchant) {
    query = query.ilike("merchant", `%${args.merchant}%`);
  }

  const { data: transactions } = await query;

  // 2. Group by merchant
  const merchantTxns: Record<string, { amountCents: number; date: string }[]> = {};

  for (const tx of transactions || []) {
    const merchant = tx.merchant;
    if (!merchant) continue;
    const amountCents = Math.round(Number(tx.amount) * 100);

    if (!merchantTxns[merchant]) merchantTxns[merchant] = [];
    merchantTxns[merchant].push({ amountCents, date: tx.occurred_at });
  }

  // 3. For merchants with 3+ transactions, compute averages and find discounts
  const merchants: MerchantDiscount[] = [];
  let grandTotalSavedCents = 0;

  for (const [merchant, txns] of Object.entries(merchantTxns)) {
    if (txns.length < 3) continue;

    // Compute average in cents
    const totalCents = txns.reduce((sum, t) => sum + t.amountCents, 0);
    const avgCents = Math.round(totalCents / txns.length);
    const thresholdCents = Math.round(avgCents * (1 - thresholdPct / 100));

    // Find current-month transactions below threshold
    const currentMonthDeals = txns.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === currentMonth &&
        d.getFullYear() === currentYear &&
        t.amountCents < thresholdCents
      );
    });

    if (currentMonthDeals.length === 0) continue;

    let savedCents = 0;
    let bestDealCents = Infinity;
    let bestDealDate = "";

    for (const deal of currentMonthDeals) {
      savedCents += avgCents - deal.amountCents;
      if (deal.amountCents < bestDealCents) {
        bestDealCents = deal.amountCents;
        bestDealDate = deal.date;
      }
    }

    grandTotalSavedCents += savedCents;

    merchants.push({
      merchant,
      average_amount: avgCents / 100,
      this_month_below_avg_count: currentMonthDeals.length,
      total_saved: savedCents / 100,
      best_deal_amount: bestDealCents / 100,
      best_deal_date: bestDealDate,
    });
  }

  // Sort by total saved descending
  merchants.sort((a, b) => b.total_saved - a.total_saved);

  // 4. Query user memories for discount-related info
  const { data: memories } = await supabaseAdmin
    .from("user_memory")
    .select("content, confidence")
    .eq("user_id", DEV_USER_ID)
    .eq("is_active", true);

  const discountKeywords = ["indirim", "kampanya", "discount", "deal", "kupon", "fırsat", "promosyon"];
  const discountMemories = (memories || []).filter((m) =>
    discountKeywords.some((kw) => m.content.toLowerCase().includes(kw))
  );

  return {
    merchants: merchants.slice(0, 10),
    total_saved_this_month: grandTotalSavedCents / 100,
    discount_memories: discountMemories.map((m) => ({
      content: m.content,
      confidence: m.confidence,
    })),
  };
}
