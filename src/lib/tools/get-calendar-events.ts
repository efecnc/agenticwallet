import { supabaseAdmin } from "@/lib/supabase/server";

const DEV_USER_ID = (process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890").trim();

interface CalendarEvent {
  date: string;
  title: string;
  type: "bill" | "subscription" | "installment" | "birthday" | "payday";
  amount?: number;
  merchant?: string;
  icon_hint: "receipt" | "gift" | "wallet" | "credit-card" | "calendar";
}

interface CalendarEventsResult {
  events: CalendarEvent[];
  total_upcoming_bills: number;
  next_payday: string | null;
}

// Turkish month names for date parsing
const TR_MONTHS: Record<string, number> = {
  ocak: 0, şubat: 1, mart: 2, nisan: 3, mayıs: 4, haziran: 5,
  temmuz: 6, ağustos: 7, eylül: 8, ekim: 9, kasım: 10, aralık: 11,
};

function parseDateFromContent(content: string): { month: number; day: number } | null {
  const lower = content.toLowerCase();

  // Match patterns like "22 Mart", "15 Nisan", "5 Ağustos"
  for (const [monthName, monthIdx] of Object.entries(TR_MONTHS)) {
    const pattern = new RegExp(`(\\d{1,2})\\s*${monthName}`, "i");
    const match = lower.match(pattern);
    if (match) {
      return { month: monthIdx, day: parseInt(match[1], 10) };
    }
  }

  // Match patterns like "her ayın 15'i" or "ayın 15"
  const dayOfMonthMatch = lower.match(/ay[ıi]n[ıi]?\s*(\d{1,2})/);
  if (dayOfMonthMatch) {
    return { month: -1, day: parseInt(dayOfMonthMatch[1], 10) }; // -1 = every month
  }

  return null;
}

export async function getCalendarEvents(args: {
  days_ahead?: number;
}): Promise<CalendarEventsResult> {
  const daysAhead = args.days_ahead || 30;
  const now = new Date();
  const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);

  const events: CalendarEvent[] = [];
  let totalUpcomingBillsCents = 0;
  let nextPayday: string | null = null;

  // 1. RECURRING BILLS — detect from transaction history
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

  const { data: transactions } = await supabaseAdmin
    .from("transactions")
    .select("merchant, amount, occurred_at, is_recurring, category, metadata")
    .eq("user_id", DEV_USER_ID)
    .eq("type", "expense")
    .gte("occurred_at", sixtyDaysAgo.toISOString())
    .order("occurred_at", { ascending: false })
    .limit(500);

  // Group by merchant to detect recurring patterns
  const merchantMonths: Record<
    string,
    { months: Set<string>; amountCents: number; day: number; merchant: string; category: string }
  > = {};

  for (const tx of transactions || []) {
    const merchant = tx.merchant || tx.category;
    const amountCents = Math.round(Number(tx.amount) * 100);
    const date = new Date(tx.occurred_at);
    const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
    const day = date.getDate();
    const bucketKey = `${merchant}__${Math.round(amountCents / 100) * 100}`;

    if (!merchantMonths[bucketKey]) {
      merchantMonths[bucketKey] = {
        months: new Set(),
        amountCents,
        day,
        merchant,
        category: tx.category,
      };
    }
    merchantMonths[bucketKey].months.add(monthKey);
  }

  // Project next occurrence for recurring items
  for (const [, info] of Object.entries(merchantMonths)) {
    if (info.months.size < 2 && !info.category) continue;

    const isSubscription = info.category === "subscription";
    if (info.months.size < 2 && !isSubscription) continue;

    // Calculate next occurrence date
    let nextDate = new Date(now.getFullYear(), now.getMonth(), info.day);
    if (nextDate <= now) {
      nextDate = new Date(now.getFullYear(), now.getMonth() + 1, info.day);
    }

    if (nextDate > endDate) continue;

    const amountTRY = info.amountCents / 100;
    totalUpcomingBillsCents += info.amountCents;

    events.push({
      date: nextDate.toISOString().split("T")[0],
      title: info.merchant,
      type: isSubscription ? "subscription" : "bill",
      amount: amountTRY,
      merchant: info.merchant,
      icon_hint: isSubscription ? "credit-card" : "receipt",
    });
  }

  // 2. INSTALLMENTS — from transaction metadata
  const installmentSeen = new Set<string>();
  for (const tx of transactions || []) {
    const meta = tx.metadata as { installment?: { current: number; total: number; monthly_amount: number; description: string } } | null;
    if (!meta?.installment) continue;

    const inst = meta.installment;
    const planKey = `${tx.merchant}__${inst.description}`;
    if (installmentSeen.has(planKey)) continue;
    installmentSeen.add(planKey);

    // Only show if there are remaining installments
    if (inst.current >= inst.total) continue;

    // Next installment is ~10th of next month (based on seed pattern)
    const txDate = new Date(tx.occurred_at);
    const dayOfMonth = txDate.getDate();
    let nextInstDate = new Date(now.getFullYear(), now.getMonth(), dayOfMonth);
    if (nextInstDate <= now) {
      nextInstDate = new Date(now.getFullYear(), now.getMonth() + 1, dayOfMonth);
    }

    if (nextInstDate > endDate) continue;

    const amountCents = Math.round(inst.monthly_amount * 100);
    totalUpcomingBillsCents += amountCents;

    events.push({
      date: nextInstDate.toISOString().split("T")[0],
      title: `${inst.description} (${inst.current + 1}/${inst.total})`,
      type: "installment",
      amount: inst.monthly_amount,
      merchant: tx.merchant,
      icon_hint: "credit-card",
    });
  }

  // 3. USER MEMORIES — birthdays, payday, important dates
  const { data: memories } = await supabaseAdmin
    .from("user_memory")
    .select("content, type")
    .eq("user_id", DEV_USER_ID)
    .eq("is_active", true);

  for (const mem of memories || []) {
    const lower = mem.content.toLowerCase();
    const parsed = parseDateFromContent(mem.content);
    if (!parsed) continue;

    // Check if it's a payday reference
    const isPayday = lower.includes("maaş") || lower.includes("maas") || lower.includes("payday");
    // Check if it's a birthday
    const isBirthday = lower.includes("doğum") || lower.includes("dogum") || lower.includes("birthday");

    if (isPayday && parsed.day > 0) {
      // Recurring monthly payday
      let payDate = new Date(now.getFullYear(), now.getMonth(), parsed.day);
      if (payDate <= now) {
        payDate = new Date(now.getFullYear(), now.getMonth() + 1, parsed.day);
      }

      if (payDate <= endDate) {
        nextPayday = payDate.toISOString().split("T")[0];
        events.push({
          date: nextPayday,
          title: "Maaş Günü",
          type: "payday",
          icon_hint: "wallet",
        });
      }
    } else if (isBirthday && parsed.month >= 0) {
      // Specific date birthday
      let bDate = new Date(now.getFullYear(), parsed.month, parsed.day);
      // If birthday already passed this year, check if it's within our window
      if (bDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
        bDate = new Date(now.getFullYear() + 1, parsed.month, parsed.day);
      }

      if (bDate <= endDate) {
        // Extract person name from content
        const nameMatch = mem.content.match(/^(.+?)(?:['ıiun]n|nin)\s+doğum/i);
        const personName = nameMatch ? nameMatch[1].trim() : "Doğum Günü";

        events.push({
          date: bDate.toISOString().split("T")[0],
          title: `${personName} Doğum Günü`,
          type: "birthday",
          icon_hint: "gift",
        });
      }
    } else if (parsed.month >= 0) {
      // Other dated events
      let eventDate = new Date(now.getFullYear(), parsed.month, parsed.day);
      if (eventDate < now) {
        eventDate = new Date(now.getFullYear() + 1, parsed.month, parsed.day);
      }

      if (eventDate <= endDate) {
        events.push({
          date: eventDate.toISOString().split("T")[0],
          title: mem.content,
          type: "birthday",
          icon_hint: "calendar",
        });
      }
    }
  }

  // If no payday was found from memories, default to 15th
  if (!nextPayday) {
    let defaultPayday = new Date(now.getFullYear(), now.getMonth(), 15);
    if (defaultPayday <= now) {
      defaultPayday = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    }
    if (defaultPayday <= endDate) {
      nextPayday = defaultPayday.toISOString().split("T")[0];
      events.push({
        date: nextPayday,
        title: "Maaş Günü",
        type: "payday",
        icon_hint: "wallet",
      });
    }
  }

  // Sort events by date
  events.sort((a, b) => a.date.localeCompare(b.date));

  return {
    events,
    total_upcoming_bills: totalUpcomingBillsCents / 100,
    next_payday: nextPayday,
  };
}
