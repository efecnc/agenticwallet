import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

const DEV_USER_ID = (process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890").trim();
const DEV_WALLET_ID = (process.env.DEV_WALLET_ID || "01a2b3c4-d5e6-7890-abcd-ef1234567890").trim();

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

  // INSTALLMENT (TAKSİT) PLANS — generate monthly installment transactions
  const installmentPlans = [
    { merchant: "Apple Store", description: "MacBook Taksit", totalInstallments: 6, monthlyAmount: 708.33, startMonthOffset: -4, category: "shopping", subcategory: "electronics" },
    { merchant: "Trendyol", description: "Kış Montu Taksit", totalInstallments: 3, monthlyAmount: 416.67, startMonthOffset: -2, category: "shopping", subcategory: null },
    { merchant: "Hepsiburada", description: "Kulaklık Taksit", totalInstallments: 4, monthlyAmount: 374.75, startMonthOffset: -3, category: "shopping", subcategory: "electronics" },
  ];

  for (const plan of installmentPlans) {
    const planStartDate = new Date(currentYear, currentMonth + plan.startMonthOffset, 10);
    for (let inst = 0; inst < plan.totalInstallments; inst++) {
      const instDate = new Date(planStartDate.getFullYear(), planStartDate.getMonth() + inst, 10, 10, 0, 0);
      if (instDate > now || instDate < twoMonthsAgo) continue;

      const currentInstallment = inst + 1;
      transactions.push({
        id: uuidv4(),
        user_id: DEV_USER_ID,
        wallet_id: DEV_WALLET_ID,
        type: "expense",
        amount: plan.monthlyAmount,
        currency: "TRY",
        category: plan.category,
        subcategory: plan.subcategory,
        merchant: plan.merchant,
        description: `${plan.description} (${currentInstallment}/${plan.totalInstallments})`,
        occurred_at: instDate.toISOString(),
        is_recurring: false,
        metadata: {
          installment: {
            current: currentInstallment,
            total: plan.totalInstallments,
            monthly_amount: plan.monthlyAmount,
            start_date: planStartDate.toISOString().split("T")[0],
            description: plan.description,
          },
        },
      });
    }
  }

  // DISCOUNT-VARIANT TRANSACTIONS — below-average purchases to trigger discount detection
  const discountDeals = [
    { merchant: "Migros", category: "groceries", normalMin: 150, normalMax: 650, discountAmount: 95, description: "İndirimli alışveriş" },
    { merchant: "Starbucks", category: "coffee", normalMin: 80, normalMax: 180, discountAmount: 55, description: "Happy hour" },
    { merchant: "CarrefourSA", category: "groceries", normalMin: 200, normalMax: 800, discountAmount: 120, description: "Hafta sonu indirimi" },
  ];

  for (const deal of discountDeals) {
    // Add 1-2 discount transactions in current month
    const dealCount = 1 + (Math.random() > 0.5 ? 1 : 0);
    for (let d = 0; d < dealCount; d++) {
      const dealDay = 1 + Math.floor(Math.random() * Math.min(now.getDate(), 28));
      const dealDate = new Date(currentYear, currentMonth, dealDay, randomHour(), Math.floor(Math.random() * 60));
      if (dealDate > now) continue;

      transactions.push({
        id: uuidv4(),
        user_id: DEV_USER_ID,
        wallet_id: DEV_WALLET_ID,
        type: "expense",
        amount: deal.discountAmount,
        currency: "TRY",
        category: deal.category,
        subcategory: deal.category === "coffee" ? "coffee" : null,
        merchant: deal.merchant,
        description: deal.description,
        occurred_at: dealDate.toISOString(),
        is_recurring: false,
        metadata: { discount: true },
      });
    }
  }

  return transactions;
}

export const maxDuration = 60;

export async function POST() {
  try {
    // Delete existing mock data (idempotent) — run in parallel
    await Promise.all([
      supabaseAdmin.from("chat_messages").delete().eq("user_id", DEV_USER_ID),
      supabaseAdmin.from("proactive_insights").delete().eq("user_id", DEV_USER_ID),
      supabaseAdmin.from("user_memory").delete().eq("user_id", DEV_USER_ID),
      supabaseAdmin.from("wallet_transfers").delete().eq("user_id", DEV_USER_ID),
      supabaseAdmin.from("transactions").delete().eq("user_id", DEV_USER_ID),
    ]);

    // ─── UPSERT WALLETS ───
    const savingsGoal1Id = "s1a2b3c4-d5e6-7890-abcd-ef1234567890";
    const savingsGoal2Id = "s2a2b3c4-d5e6-7890-abcd-ef1234567890";

    const wallets = [
      {
        id: DEV_WALLET_ID,
        user_id: DEV_USER_ID,
        type: "main",
        name: "Ana Hesap",
        balance: 12500,
        target_amount: null,
        color: "#10b981",
        icon: "wallet",
        is_active: true,
      },
      {
        id: savingsGoal1Id,
        user_id: DEV_USER_ID,
        type: "savings_goal",
        name: "Acil Durum Fonu",
        balance: 16000,
        target_amount: 50000,
        color: "#10b981",
        icon: "shield",
        is_active: true,
      },
      {
        id: savingsGoal2Id,
        user_id: DEV_USER_ID,
        type: "savings_goal",
        name: "Tatil",
        balance: 4250,
        target_amount: 25000,
        color: "#3b82f6",
        icon: "plane",
        is_active: true,
      },
    ];

    const { error: walletErr } = await supabaseAdmin.from("wallets").upsert(wallets, { onConflict: "id" });
    if (walletErr) console.error("Wallet seed error:", walletErr);

    // ─── GENERATE AND INSERT TRANSACTIONS ───
    const transactions = generateTransactions();

    for (let i = 0; i < transactions.length; i += 100) {
      const batch = transactions.slice(i, i + 100);
      const { error } = await supabaseAdmin.from("transactions").insert(batch);
      if (error) {
        console.error("Seed insert error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // ─── SEED PROACTIVE INSIGHTS ───
    const now = new Date();
    const insights = [
      {
        id: uuidv4(),
        user_id: DEV_USER_ID,
        title: "Yemek harcaman %40 arttı",
        body: "Bu hafta yemek ve restoran kategorisinde geçen haftaya göre ₺1.240 daha fazla harcadın. Evde yemek yaparak tasarruf edebilirsin.",
        severity: "warning",
        category: "dining",
        is_read: false,
        is_dismissed: false,
        metadata: {},
      },
      {
        id: uuidv4(),
        user_id: DEV_USER_ID,
        title: "Ulaşım giderin azaldı",
        body: "Bu hafta ulaşım harcaman geçen haftaya göre %18 düştü. İstanbulkart kullanımını artırman işe yaradı!",
        severity: "positive",
        category: "transport",
        is_read: false,
        is_dismissed: false,
        metadata: {},
      },
      {
        id: uuidv4(),
        user_id: DEV_USER_ID,
        title: "Netflix yenileniyor",
        body: "5 gün sonra Netflix aboneliğin ₺149.99 olarak yenilenecek. İzleme oranın düşük — iptal etmeyi düşünebilirsin.",
        severity: "info",
        category: "subscription",
        is_read: false,
        is_dismissed: false,
        metadata: {},
      },
      {
        id: uuidv4(),
        user_id: DEV_USER_ID,
        title: "Acil Durum Fonu büyüyor",
        body: "Acil Durum Fonun ₺16.000'e ulaştı — hedefinin %32'si tamamlandı. Bu tempoda 14 ayda hedefe ulaşırsın.",
        severity: "positive",
        category: null,
        is_read: false,
        is_dismissed: false,
        metadata: {},
      },
    ];

    const { error: insightErr } = await supabaseAdmin.from("proactive_insights").insert(insights);
    if (insightErr) console.error("Insight seed error:", insightErr);

    // ─── SEED A CHALLENGE INSIGHT (for SavingsStreaks) ───
    const challengeEndDate = new Date(now);
    challengeEndDate.setDate(challengeEndDate.getDate() + 4);

    const challengeInsight = {
      id: uuidv4(),
      user_id: DEV_USER_ID,
      title: "Kahve Challenge: 7 gün kahveciye gitme!",
      body: "7 gün boyunca dışarıdan kahve almadan geçir. Haftada ortalama ₺320 tasarruf edebilirsin.",
      severity: "info" as const,
      category: "challenge",
      is_read: false,
      is_dismissed: false,
      metadata: {
        duration_days: 7,
        start_date: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        end_date: challengeEndDate.toISOString().split("T")[0],
        status: "active",
      },
    };

    await supabaseAdmin.from("proactive_insights").insert(challengeInsight);

    // ─── SEED PENDING WALLET TRANSFERS ───
    const transfers = [
      {
        id: uuidv4(),
        user_id: DEV_USER_ID,
        from_wallet_id: DEV_WALLET_ID,
        to_wallet_id: savingsGoal1Id,
        amount: 2000,
        status: "pending_confirmation",
        reason: "Bu ay yemek harcaman düştü — farkı Acil Durum Fonu'na aktararak hedefine yaklaşabilirsin.",
        initiated_by: "ai_agent",
      },
      {
        id: uuidv4(),
        user_id: DEV_USER_ID,
        from_wallet_id: DEV_WALLET_ID,
        to_wallet_id: savingsGoal2Id,
        amount: 750,
        status: "pending_confirmation",
        reason: "Geçen hafta ulaşımda ₺750 tasarruf ettin. Tatil fonuna aktarmak ister misin?",
        initiated_by: "ai_agent",
      },
    ];

    const { error: transferErr } = await supabaseAdmin.from("wallet_transfers").insert(transfers);
    if (transferErr) console.error("Transfer seed error:", transferErr);

    // ─── SEED USER MEMORIES ───
    const memories = [
      { type: "fact", content: "Annemin doğum günü 22 Mart", confidence: 1.0 },
      { type: "fact", content: "En yakın arkadaşımın doğum günü 5 Nisan", confidence: 1.0 },
      { type: "fact", content: "Maaş günüm her ayın 15'i", confidence: 1.0 },
      { type: "preference", content: "Starbucks yerine evde filtre kahve tercih ediyorum", confidence: 0.9 },
      { type: "goal", content: "Yaz tatili için Yunanistan'a gitmek istiyorum", confidence: 1.0 },
      { type: "rule", content: "Ayda ₺2.000'den fazla yemek harcamamalıyım", confidence: 0.8 },
      { type: "pattern", content: "Hafta sonları daha fazla yemek siparişi veriyorum", confidence: 0.7 },
    ];

    const memoryRows = memories.map((mem) => ({
      id: uuidv4(),
      user_id: DEV_USER_ID,
      type: mem.type,
      content: mem.content,
      confidence: mem.confidence,
      source: "seed",
      is_active: true,
    }));
    const { error: memoryErr } = await supabaseAdmin.from("user_memory").insert(memoryRows);
    if (memoryErr) console.error("Memory seed error:", memoryErr);

    return NextResponse.json({
      seeded: true,
      transactionCount: transactions.length,
      insightCount: insights.length + 1,
      transferCount: transfers.length,
      memoryCount: memories.length,
      walletCount: wallets.length,
    });
  } catch (err) {
    console.error("Seed error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
