import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

const DEV_USER_ID = process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const DEV_WALLET_ID = process.env.DEV_WALLET_ID || "01a2b3c4-d5e6-7890-abcd-ef1234567890";

function randomBetween(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function randomHour(): number {
  // Weighted toward daytime hours
  const weights = [0, 0, 0, 0, 0, 0, 1, 2, 5, 8, 10, 10, 12, 10, 8, 8, 10, 10, 12, 10, 8, 5, 2, 1];
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (r <= 0) return i;
  }
  return 12;
}

function randomDate(start: Date, end: Date): Date {
  const d = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  d.setHours(randomHour(), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));
  return d;
}

interface TransactionRecord {
  id: string;
  user_id: string;
  wallet_id: string;
  type: "income" | "expense" | "transfer";
  amount: number;
  currency: string;
  category: string;
  subcategory: string | null;
  merchant: string;
  description: string | null;
  occurred_at: string;
  is_recurring: boolean;
  metadata: Record<string, unknown>;
}

function generateTransactions(): TransactionRecord[] {
  const transactions: TransactionRecord[] = [];
  const now = new Date();
  const twoMonthsAgo = new Date(now);
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

  // Generate for each month in the range
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  for (let monthOffset = -2; monthOffset <= 0; monthOffset++) {
    const month = new Date(currentYear, currentMonth + monthOffset, 1);
    const monthEnd = new Date(currentYear, currentMonth + monthOffset + 1, 0);
    const isCurrentMonth = monthOffset === 0;

    // SALARY — 15th of each month
    const salaryDate = new Date(month.getFullYear(), month.getMonth(), 15, 9, 0, 0);
    if (salaryDate <= now) {
      transactions.push({
        id: uuidv4(),
        user_id: DEV_USER_ID,
        wallet_id: DEV_WALLET_ID,
        type: "income",
        amount: 28000,
        currency: "TRY",
        category: "salary",
        subcategory: null,
        merchant: "TechCorp A.Ş.",
        description: "Aylık maaş",
        occurred_at: salaryDate.toISOString(),
        is_recurring: true,
        metadata: {},
      });
    }

    // RENT — 1st of each month
    const rentDate = new Date(month.getFullYear(), month.getMonth(), 1, 10, 0, 0);
    if (rentDate <= now && rentDate >= twoMonthsAgo) {
      transactions.push({
        id: uuidv4(),
        user_id: DEV_USER_ID,
        wallet_id: DEV_WALLET_ID,
        type: "expense",
        amount: 8500,
        currency: "TRY",
        category: "rent",
        subcategory: null,
        merchant: "Ev Kirası",
        description: "Aylık kira ödemesi",
        occurred_at: rentDate.toISOString(),
        is_recurring: true,
        metadata: {},
      });
    }

    // SUBSCRIPTIONS — various days
    const subs = [
      { merchant: "Netflix", amount: 149.99, day: 5, subcategory: "streaming" },
      { merchant: "Spotify", amount: 59.99, day: 8, subcategory: "streaming" },
      { merchant: "YouTube Premium", amount: 79.99, day: 12, subcategory: "streaming" },
      { merchant: "MacFit", amount: 599, day: 3, subcategory: "fitness" },
    ];
    for (const sub of subs) {
      const subDate = new Date(month.getFullYear(), month.getMonth(), sub.day, 8, 0, 0);
      if (subDate <= now && subDate >= twoMonthsAgo) {
        transactions.push({
          id: uuidv4(),
          user_id: DEV_USER_ID,
          wallet_id: DEV_WALLET_ID,
          type: "expense",
          amount: sub.amount,
          currency: "TRY",
          category: "subscription",
          subcategory: sub.subcategory,
          merchant: sub.merchant,
          description: null,
          occurred_at: subDate.toISOString(),
          is_recurring: true,
          metadata: {},
        });
      }
    }

    // UTILITIES — monthly
    const utilities = [
      { merchant: "İGDAŞ", amount: 450, day: 20, subcategory: "gas" },
      { merchant: "İSKİ", amount: 180, day: 22, subcategory: "water" },
      { merchant: "Türk Telekom", amount: 349, day: 18, subcategory: "internet" },
      { merchant: "Vodafone", amount: 250, day: 16, subcategory: "phone" },
    ];
    for (const util of utilities) {
      const utilDate = new Date(month.getFullYear(), month.getMonth(), util.day, 10, 30, 0);
      if (utilDate <= now && utilDate >= twoMonthsAgo) {
        transactions.push({
          id: uuidv4(),
          user_id: DEV_USER_ID,
          wallet_id: DEV_WALLET_ID,
          type: "expense",
          amount: util.amount,
          currency: "TRY",
          category: "utilities",
          subcategory: util.subcategory,
          merchant: util.merchant,
          description: null,
          occurred_at: utilDate.toISOString(),
          is_recurring: true,
          metadata: {},
        });
      }
    }

    // GROCERIES — 3-5x per week
    const groceryMerchants = [
      { merchant: "Migros", min: 150, max: 650 },
      { merchant: "A101", min: 80, max: 350 },
      { merchant: "BİM", min: 60, max: 280 },
      { merchant: "CarrefourSA", min: 200, max: 800 },
    ];

    const daysInMonth = monthEnd.getDate();
    const weeksInMonth = Math.ceil(daysInMonth / 7);

    for (let week = 0; week < weeksInMonth; week++) {
      const tripsThisWeek = 3 + Math.floor(Math.random() * 3); // 3-5 trips
      for (let t = 0; t < tripsThisWeek; t++) {
        const day = Math.min(week * 7 + Math.floor(Math.random() * 7) + 1, daysInMonth);
        const gDate = new Date(month.getFullYear(), month.getMonth(), day, randomHour(), Math.floor(Math.random() * 60));
        if (gDate > now || gDate < twoMonthsAgo) continue;

        const grocer = groceryMerchants[Math.floor(Math.random() * groceryMerchants.length)];

        // Make last week's food spending ~40% higher
        const isLastWeek = isCurrentMonth && (now.getTime() - gDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
        const multiplier = isLastWeek ? 1.4 : 1.0;
        const amount = randomBetween(grocer.min * multiplier, grocer.max * multiplier);

        transactions.push({
          id: uuidv4(),
          user_id: DEV_USER_ID,
          wallet_id: DEV_WALLET_ID,
          type: "expense",
          amount,
          currency: "TRY",
          category: "groceries",
          subcategory: null,
          merchant: grocer.merchant,
          description: null,
          occurred_at: gDate.toISOString(),
          is_recurring: false,
          metadata: {},
        });
      }
    }

    // COFFEE & DINING — 2-4x per week
    const coffeeShops = [
      { merchant: "Starbucks", subcategory: "coffee", min: 80, max: 180 },
      { merchant: "Kahve Dünyası", subcategory: "coffee", min: 50, max: 120 },
    ];
    const diningPlaces = [
      { merchant: "Yemeksepeti", subcategory: "delivery", min: 120, max: 350 },
      { merchant: "Getir Yemek", subcategory: "delivery", min: 100, max: 280 },
      { merchant: "Local Restaurant", subcategory: "dine-in", min: 200, max: 600 },
    ];
    const foodPlaces = [...coffeeShops, ...diningPlaces];

    for (let week = 0; week < weeksInMonth; week++) {
      const mealsThisWeek = 2 + Math.floor(Math.random() * 3); // 2-4
      for (let t = 0; t < mealsThisWeek; t++) {
        const day = Math.min(week * 7 + Math.floor(Math.random() * 7) + 1, daysInMonth);
        const fDate = new Date(month.getFullYear(), month.getMonth(), day, randomHour(), Math.floor(Math.random() * 60));
        if (fDate > now || fDate < twoMonthsAgo) continue;

        const place = foodPlaces[Math.floor(Math.random() * foodPlaces.length)];
        const isLastWeek = isCurrentMonth && (now.getTime() - fDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
        const multiplier = isLastWeek ? 1.4 : 1.0;

        transactions.push({
          id: uuidv4(),
          user_id: DEV_USER_ID,
          wallet_id: DEV_WALLET_ID,
          type: "expense",
          amount: randomBetween(place.min * multiplier, place.max * multiplier),
          currency: "TRY",
          category: place.subcategory === "coffee" ? "coffee" : "dining",
          subcategory: place.subcategory,
          merchant: place.merchant,
          description: null,
          occurred_at: fDate.toISOString(),
          is_recurring: false,
          metadata: {},
        });
      }
    }

    // TRANSPORT — daily on weekdays
    const transportOptions: { merchant: string; subcategory: string; amount?: number; min?: number; max?: number; isFixed: boolean }[] = [
      { merchant: "İstanbulkart", subcategory: "public", amount: 34.87, isFixed: true },
      { merchant: "Uber", subcategory: "ride", min: 80, max: 250, isFixed: false },
      { merchant: "BiTaksi", subcategory: "ride", min: 60, max: 200, isFixed: false },
    ];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      if (date > now || date < twoMonthsAgo) continue;
      const dayOfWeek = date.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) continue; // skip weekends

      // 1-2 transport uses per weekday
      const uses = 1 + (Math.random() > 0.6 ? 1 : 0);
      for (let u = 0; u < uses; u++) {
        const topt = transportOptions[Math.floor(Math.random() * transportOptions.length)];
        const tDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), u === 0 ? 8 : 18, Math.floor(Math.random() * 30));

        transactions.push({
          id: uuidv4(),
          user_id: DEV_USER_ID,
          wallet_id: DEV_WALLET_ID,
          type: "expense",
          amount: topt.isFixed ? topt.amount! : randomBetween(topt.min!, topt.max!),
          currency: "TRY",
          category: "transport",
          subcategory: topt.subcategory,
          merchant: topt.merchant,
          description: null,
          occurred_at: tDate.toISOString(),
          is_recurring: false,
          metadata: {},
        });
      }
    }

    // SHOPPING — 2-3x per month
    const shoppingMerchants = [
      { merchant: "Trendyol", min: 150, max: 1200 },
      { merchant: "Hepsiburada", min: 200, max: 1500 },
    ];
    const shoppingTrips = 2 + Math.floor(Math.random() * 2);
    for (let s = 0; s < shoppingTrips; s++) {
      const day = 1 + Math.floor(Math.random() * daysInMonth);
      const sDate = new Date(month.getFullYear(), month.getMonth(), day, randomHour(), Math.floor(Math.random() * 60));
      if (sDate > now || sDate < twoMonthsAgo) continue;

      const shop = shoppingMerchants[Math.floor(Math.random() * shoppingMerchants.length)];
      transactions.push({
        id: uuidv4(),
        user_id: DEV_USER_ID,
        wallet_id: DEV_WALLET_ID,
        type: "expense",
        amount: randomBetween(shop.min, shop.max),
        currency: "TRY",
        category: "shopping",
        subcategory: null,
        merchant: shop.merchant,
        description: null,
        occurred_at: sDate.toISOString(),
        is_recurring: false,
        metadata: {},
      });
    }
  }

  // Add a random large one-time expense in the last 2 weeks
  const largePurchaseDate = randomDate(
    new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
    now
  );
  transactions.push({
    id: uuidv4(),
    user_id: DEV_USER_ID,
    wallet_id: DEV_WALLET_ID,
    type: "expense",
    amount: randomBetween(3000, 5000),
    currency: "TRY",
    category: "shopping",
    subcategory: "electronics",
    merchant: "Apple Store",
    description: "Tek seferlik büyük harcama",
    occurred_at: largePurchaseDate.toISOString(),
    is_recurring: false,
    metadata: { one_time: true },
  });

  return transactions;
}

export async function POST() {
  try {
    // Delete existing mock data (idempotent)
    await supabaseAdmin.from("chat_messages").delete().eq("user_id", DEV_USER_ID);
    await supabaseAdmin.from("proactive_insights").delete().eq("user_id", DEV_USER_ID);
    await supabaseAdmin.from("user_memory").delete().eq("user_id", DEV_USER_ID);
    await supabaseAdmin.from("wallet_transfers").delete().eq("user_id", DEV_USER_ID);
    await supabaseAdmin.from("transactions").delete().eq("user_id", DEV_USER_ID);

    // Generate and insert transactions
    const transactions = generateTransactions();

    // Insert in batches of 100
    for (let i = 0; i < transactions.length; i += 100) {
      const batch = transactions.slice(i, i + 100);
      const { error } = await supabaseAdmin.from("transactions").insert(batch);
      if (error) {
        console.error("Seed insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    return NextResponse.json({
      seeded: true,
      transactionCount: transactions.length,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
