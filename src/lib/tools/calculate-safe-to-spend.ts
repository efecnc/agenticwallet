import { supabaseAdmin } from "@/lib/supabase/server";

const DEV_USER_ID = (process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890").trim();
const DEV_WALLET_ID = (process.env.DEV_WALLET_ID || "01a2b3c4-d5e6-7890-abcd-ef1234567890").trim();

interface SafeToSpendResult {
  safe_to_spend: number;
  daily_budget: number;
  days_until_payday: number;
  main_balance: number;
  upcoming_recurring_total: number;
  safety_buffer: number;
  upcoming_items: { merchant: string; amount: number; expected_day: number }[];
}

export async function calculateSafeToSpend(args: {
  payday_date?: number;
  safety_buffer?: number;
}): Promise<SafeToSpendResult> {
  const payday = args.payday_date || 15;
  const bufferCents = Math.round((args.safety_buffer || 500) * 100);

  // 1. Get main wallet balance
  const { data: wallet } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("id", DEV_WALLET_ID)
    .single();

  const mainBalanceCents = Math.round(Number(wallet?.balance || 0) * 100);

  // 2. Fetch last 60 days of expense transactions to detect recurring
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select("merchant, amount, occurred_at, is_recurring, category")
    .eq("user_id", DEV_USER_ID)
    .eq("type", "expense")
    .gte("occurred_at", sixtyDaysAgo.toISOString())
    .order("occurred_at", { ascending: false });

  // 3. Detect recurring expenses
  // Group by merchant, check if same amount (within 5%) appears in 2+ distinct months
  const merchantMonths: Record<string, { months: Set<string>; amountCents: number; day: number; merchant: string }> = {};

  for (const tx of transactions || []) {
    const merchant = tx.merchant || tx.category;
    const amountCents = Math.round(Number(tx.amount) * 100);
    const date = new Date(tx.occurred_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();

    // Key by merchant + approximate amount (rounded to nearest 100 cents for tolerance)
    const bucketKey = `${merchant}__${Math.round(amountCents / 100) * 100}`;

    if (!merchantMonths[bucketKey]) {
      merchantMonths[bucketKey] = {
        months: new Set(),
        amountCents,
        day,
        merchant,
      };
    }
    merchantMonths[bucketKey].months.add(monthKey);

    // Also check explicitly recurring transactions
    if (tx.is_recurring && !merchantMonths[bucketKey].months.has(monthKey)) {
      merchantMonths[bucketKey].months.add(monthKey);
    }
  }

  // 4. Calculate upcoming recurring expenses until payday
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Calculate next payday
  let nextPayday: Date;
  if (currentDay < payday) {
    nextPayday = new Date(currentYear, currentMonth, payday);
  } else {
    nextPayday = new Date(currentYear, currentMonth + 1, payday);
  }

  const daysUntilPayday = Math.max(
    1,
    Math.ceil((nextPayday.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  // Filter for recurring items that will occur between now and payday
  const upcomingItems: { merchant: string; amount: number; expected_day: number }[] = [];
  let upcomingRecurringCents = 0;

  for (const [, info] of Object.entries(merchantMonths)) {
    // Must appear in at least 2 months to be considered recurring
    if (info.months.size < 2) continue;

    const expectedDay = info.day;

    // Check if this recurring expense falls between now and payday
    let willOccur = false;
    if (currentDay < payday) {
      // Payday is this month — check if expected day is between now and payday
      willOccur = expectedDay > currentDay && expectedDay <= payday;
    } else {
      // Payday is next month — check rest of this month OR start of next month until payday
      willOccur = expectedDay > currentDay || expectedDay <= payday;
    }

    if (willOccur) {
      upcomingRecurringCents += info.amountCents;
      upcomingItems.push({
        merchant: info.merchant,
        amount: info.amountCents / 100,
        expected_day: expectedDay,
      });
    }
  }

  // 5. Calculate safe to spend
  const safeToSpendCents = Math.max(0, mainBalanceCents - upcomingRecurringCents - bufferCents);
  const dailyBudgetCents = Math.floor(safeToSpendCents / daysUntilPayday);

  return {
    safe_to_spend: safeToSpendCents / 100,
    daily_budget: dailyBudgetCents / 100,
    days_until_payday: daysUntilPayday,
    main_balance: mainBalanceCents / 100,
    upcoming_recurring_total: upcomingRecurringCents / 100,
    safety_buffer: bufferCents / 100,
    upcoming_items: upcomingItems.sort((a, b) => a.expected_day - b.expected_day),
  };
}
