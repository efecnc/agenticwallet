import { supabaseAdmin } from "@/lib/supabase/server";

const DEV_USER_ID = process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

interface QueryParams {
  start_date?: string;
  end_date?: string;
  category?: string;
  merchant?: string;
  type?: "income" | "expense" | "transfer";
  limit?: number;
}

export async function queryTransactions(params: QueryParams) {
  let query = supabaseAdmin
    .from("transactions")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .order("occurred_at", { ascending: false });

  if (params.start_date) {
    query = query.gte("occurred_at", params.start_date);
  }
  if (params.end_date) {
    query = query.lte("occurred_at", params.end_date);
  }
  if (params.category) {
    query = query.eq("category", params.category);
  }
  if (params.merchant) {
    query = query.ilike("merchant", `%${params.merchant}%`);
  }
  if (params.type) {
    query = query.eq("type", params.type);
  }

  query = query.limit(params.limit || 20);

  const { data, error } = await query;
  if (error) throw new Error(`Query error: ${error.message}`);

  return {
    transactions: data || [],
    count: data?.length || 0,
  };
}
