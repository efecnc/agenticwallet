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
];
