/* eslint-disable @typescript-eslint/no-explicit-any */

// Gemini Function Declarations for the agent's tools.
// We use `as any` for schema definitions because the SDK's type system
// is overly strict for inline declarations.

export const geminiTools: any[] = [
  {
    name: "query_transactions",
    description:
      "Query the user's financial transactions with optional filters. Returns transaction records.",
    parameters: {
      type: "OBJECT",
      properties: {
        start_date: { type: "STRING", description: "ISO date string for range start" },
        end_date: { type: "STRING", description: "ISO date string for range end" },
        category: {
          type: "STRING",
          description: "Filter by category (groceries, rent, salary, subscription, coffee, dining, transport, shopping, utilities)",
        },
        merchant: { type: "STRING", description: "Filter by merchant name" },
        type: { type: "STRING", description: "Filter by transaction type: income, expense, or transfer" },
        limit: { type: "NUMBER", description: "Max results to return (default 20)" },
      },
    },
  },
  {
    name: "calculate_balance",
    description: "Calculate financial totals. Use this for ALL math — never calculate amounts yourself.",
    parameters: {
      type: "OBJECT",
      properties: {
        operation: {
          type: "STRING",
          description: "The calculation to perform: wallet_balance, total_spend, total_income, category_breakdown, merchant_total, average_daily_spend",
        },
        wallet_id: { type: "STRING", description: "Specific wallet ID (optional)" },
        category: { type: "STRING", description: "Filter calculation by category" },
        start_date: { type: "STRING", description: "ISO date range start" },
        end_date: { type: "STRING", description: "ISO date range end" },
      },
      required: ["operation"],
    },
  },
  {
    name: "save_memory",
    description: "Save a learned fact, preference, rule, or goal about the user. Call this whenever the user reveals personal financial info.",
    parameters: {
      type: "OBJECT",
      properties: {
        type: { type: "STRING", description: "Memory type: fact, preference, rule, goal, or pattern" },
        content: { type: "STRING", description: "The fact to remember in plain language" },
        confidence: { type: "NUMBER", description: "Confidence score 0.0-1.0 (1.0 if user stated directly)" },
      },
      required: ["type", "content"],
    },
  },
  {
    name: "read_memory",
    description: "Search the user's memory for relevant context. Use before answering questions that might relate to known preferences.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: { type: "STRING", description: "What to search for in user memory" },
      },
      required: ["query"],
    },
  },
  {
    name: "transfer_to_savings",
    description: "Propose transferring money from the main wallet to a savings goal. Requires user confirmation before execution.",
    parameters: {
      type: "OBJECT",
      properties: {
        to_wallet_name: { type: "STRING", description: "Name of the savings goal (e.g., 'Acil Durum Fonu', 'Tatil')" },
        amount: { type: "NUMBER", description: "Amount in TRY to transfer" },
        reason: { type: "STRING", description: "AI-generated explanation for why this transfer makes sense" },
      },
      required: ["to_wallet_name", "amount", "reason"],
    },
  },
  {
    name: "calculate_safe_to_spend",
    description: "Calculate how much the user can safely spend until their next payday. Accounts for upcoming recurring expenses and a safety buffer. Use this when the user asks about their budget or how much they can spend.",
    parameters: {
      type: "OBJECT",
      properties: {
        payday_date: { type: "NUMBER", description: "Day of month when user gets paid (default 15)" },
        safety_buffer: { type: "NUMBER", description: "Safety buffer in TRY to keep as reserve (default 500)" },
      },
    },
  },
  {
    name: "propose_challenge",
    description: "Propose a time-bound savings challenge to motivate the user. Creates a trackable challenge on their dashboard.",
    parameters: {
      type: "OBJECT",
      properties: {
        challenge_type: { type: "STRING", description: "Type: no_spend (avoid merchant/category), save_amount (save specific amount), reduce_category (reduce spending in category)" },
        description: { type: "STRING", description: "Human-readable challenge description in Turkish" },
        target_merchant: { type: "STRING", description: "Merchant to avoid (for no_spend type)" },
        target_category: { type: "STRING", description: "Category to reduce (for reduce_category type)" },
        target_amount: { type: "NUMBER", description: "Amount to save in TRY (for save_amount type)" },
        duration_days: { type: "NUMBER", description: "Challenge duration in days (default 7)" },
        reward_message: { type: "STRING", description: "Motivational message for when challenge is completed" },
      },
      required: ["challenge_type", "description", "duration_days"],
    },
  },
  {
    name: "analyze_discounts",
    description: "Analyze the user's transaction history to find discount patterns and savings. Compares per-merchant spending to historical averages to identify when the user paid less than usual. Use when the user asks about discounts, deals, or savings on purchases.",
    parameters: {
      type: "OBJECT",
      properties: {
        merchant: { type: "STRING", description: "Optional: analyze a specific merchant only" },
        period_days: { type: "NUMBER", description: "How many days of history to analyze (default 60)" },
        threshold_pct: { type: "NUMBER", description: "Percentage below average to count as discount (default 20)" },
      },
    },
  },
  {
    name: "get_calendar_events",
    description: "Get upcoming financial calendar events for the next N days. Includes recurring bills, subscriptions, installment payments, payday, and user-saved events like birthdays. Use when the user asks about upcoming payments, their financial calendar, or what bills are due.",
    parameters: {
      type: "OBJECT",
      properties: {
        days_ahead: { type: "NUMBER", description: "Number of days to look ahead (default 30)" },
      },
    },
  },
];
