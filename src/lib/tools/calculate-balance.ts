import { supabaseAdmin } from "@/lib/supabase/server";

const DEV_USER_ID = process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

interface CalculateParams {
  operation: "wallet_balance" | "total_spend" | "total_income" | "category_breakdown" | "merchant_total" | "average_daily_spend";
  wallet_id?: string;
  category?: string;
  start_date?: string;
  end_date?: string;
}

export async function calculateBalance(params: CalculateParams) {
  switch (params.operation) {
    case "wallet_balance": {
      let query = supabaseAdmin
        .from("wallets")
        .select("id, name, type, balance, target_amount")
        .eq("user_id", DEV_USER_ID)
        .eq("is_active", true);

      if (params.wallet_id) {
        query = query.eq("id", params.wallet_id);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const wallets = (data || []).map((w) => ({
        ...w,
        balance: Number(w.balance),
        target_amount: w.target_amount ? Number(w.target_amount) : null,
      }));

      // Use integer math (cents) for total
      const totalCents = wallets.reduce((sum, w) => sum + Math.round(Number(w.balance) * 100), 0);

      return {
        wallets,
        total_balance: totalCents / 100,
      };
    }

    case "total_spend": {
      let query = supabaseAdmin
        .from("transactions")
        .select("amount")
        .eq("user_id", DEV_USER_ID)
        .eq("type", "expense");

      if (params.category) query = query.eq("category", params.category);
      if (params.start_date) query = query.gte("occurred_at", params.start_date);
      if (params.end_date) query = query.lte("occurred_at", params.end_date);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      // Integer math to avoid floating point
      const totalCents = (data || []).reduce((sum, t) => sum + Math.round(Number(t.amount) * 100), 0);

      return {
        total_spend: totalCents / 100,
        transaction_count: data?.length || 0,
      };
    }

    case "total_income": {
      let query = supabaseAdmin
        .from("transactions")
        .select("amount")
        .eq("user_id", DEV_USER_ID)
        .eq("type", "income");

      if (params.start_date) query = query.gte("occurred_at", params.start_date);
      if (params.end_date) query = query.lte("occurred_at", params.end_date);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const totalCents = (data || []).reduce((sum, t) => sum + Math.round(Number(t.amount) * 100), 0);

      return {
        total_income: totalCents / 100,
        transaction_count: data?.length || 0,
      };
    }

    case "category_breakdown": {
      let query = supabaseAdmin
        .from("transactions")
        .select("category, amount")
        .eq("user_id", DEV_USER_ID)
        .eq("type", "expense");

      if (params.start_date) query = query.gte("occurred_at", params.start_date);
      if (params.end_date) query = query.lte("occurred_at", params.end_date);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      // Aggregate by category using integer math
      const categoryCents: Record<string, number> = {};
      const categoryCount: Record<string, number> = {};

      for (const t of data || []) {
        const cat = t.category;
        categoryCents[cat] = (categoryCents[cat] || 0) + Math.round(Number(t.amount) * 100);
        categoryCount[cat] = (categoryCount[cat] || 0) + 1;
      }

      const breakdown = Object.entries(categoryCents)
        .map(([category, cents]) => ({
          category,
          total: cents / 100,
          count: categoryCount[category],
        }))
        .sort((a, b) => b.total - a.total);

      const grandTotalCents = Object.values(categoryCents).reduce((a, b) => a + b, 0);

      return {
        breakdown,
        grand_total: grandTotalCents / 100,
      };
    }

    case "merchant_total": {
      let query = supabaseAdmin
        .from("transactions")
        .select("merchant, amount")
        .eq("user_id", DEV_USER_ID)
        .eq("type", "expense");

      if (params.category) query = query.eq("category", params.category);
      if (params.start_date) query = query.gte("occurred_at", params.start_date);
      if (params.end_date) query = query.lte("occurred_at", params.end_date);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      const merchantCents: Record<string, number> = {};
      const merchantCount: Record<string, number> = {};

      for (const t of data || []) {
        const m = t.merchant || "Unknown";
        merchantCents[m] = (merchantCents[m] || 0) + Math.round(Number(t.amount) * 100);
        merchantCount[m] = (merchantCount[m] || 0) + 1;
      }

      const merchants = Object.entries(merchantCents)
        .map(([merchant, cents]) => ({
          merchant,
          total: cents / 100,
          count: merchantCount[merchant],
        }))
        .sort((a, b) => b.total - a.total);

      return { merchants };
    }

    case "average_daily_spend": {
      let query = supabaseAdmin
        .from("transactions")
        .select("amount, occurred_at")
        .eq("user_id", DEV_USER_ID)
        .eq("type", "expense");

      if (params.start_date) query = query.gte("occurred_at", params.start_date);
      if (params.end_date) query = query.lte("occurred_at", params.end_date);

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      if (!data || data.length === 0) {
        return { average_daily_spend: 0, days: 0, total: 0 };
      }

      const totalCents = data.reduce((sum, t) => sum + Math.round(Number(t.amount) * 100), 0);

      // Calculate number of unique days
      const uniqueDays = new Set(
        data.map((t) => new Date(t.occurred_at).toISOString().split("T")[0])
      );

      const days = uniqueDays.size || 1;
      const avgCents = Math.round(totalCents / days);

      return {
        average_daily_spend: avgCents / 100,
        days,
        total: totalCents / 100,
      };
    }

    default:
      throw new Error(`Unknown operation: ${params.operation}`);
  }
}
