# CLAUDE.md — Parafin-Cleo: AI Financial Assistant

> **Read this entire file before writing any code.** This is the single source of truth for the project.

---

## 1. PROJECT OVERVIEW

Build a **browser-based AI financial assistant** inspired by Cleo. This is a responsive **web app only** — NO mobile emulators, NO React Native, NO Flutter. The AI agent is **proactive** (it analyzes and alerts before the user asks), uses **deterministic math** (never lets the LLM calculate numbers), and has **persistent memory** (remembers user preferences across sessions).

**Target user:** Turkish Gen Z — currency is TRY (₺), locale is `tr-TR`, timezone is `Europe/Istanbul`.

---

## 2. TECH STACK

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) with TypeScript |
| Styling | TailwindCSS 3.4+ |
| Database & Auth | Supabase (PostgreSQL + pgvector extension) |
| LLM | Google Gemini API (`gemini-2.0-flash`) with Function Calling |
| Embeddings | Gemini `text-embedding-004` (768 dimensions) |
| Package Manager | pnpm (preferred) or npm |

### Required Dependencies
```json
{
  "dependencies": {
    "next": "^15",
    "react": "^19",
    "react-dom": "^19",
    "@google/generative-ai": "latest",
    "@supabase/supabase-js": "^2",
    "uuid": "^9",
    "date-fns": "^3",
    "framer-motion": "^11",
    "lucide-react": "latest",
    "recharts": "^2",
    "zustand": "^4"
  },
  "devDependencies": {
    "typescript": "^5",
    "@types/react": "^19",
    "@types/node": "^20",
    "@types/uuid": "^9",
    "tailwindcss": "^3.4",
    "autoprefixer": "latest",
    "postcss": "latest"
  }
}
```

---

## 3. ENVIRONMENT VARIABLES

Create `.env.local` at project root:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GOOGLE_GEMINI_API_KEY=AIza...

# Dev user (seeded by schema)
DEV_USER_ID=a1b2c3d4-e5f6-7890-abcd-ef1234567890
DEV_WALLET_ID=w1a2b3c4-d5e6-7890-abcd-ef1234567890
```

---

## 4. PROJECT STRUCTURE

```
parafin-cleo/
├── CLAUDE.md                          # THIS FILE — project instructions
├── supabase-schema.sql                # Full DB schema (run in Supabase SQL Editor)
├── .env.local                         # Environment variables (DO NOT commit)
├── src/
│   ├── app/
│   │   ├── layout.tsx                 # Root layout with global providers
│   │   ├── page.tsx                   # Main dashboard page (split-screen)
│   │   ├── globals.css                # Tailwind base + custom styles
│   │   ├── api/
│   │   │   ├── chat/
│   │   │   │   └── route.ts           # POST — Gemini agent with Function Calling
│   │   │   ├── run-inference/
│   │   │   │   └── route.ts           # POST — Proactive Engine (anomaly detection)
│   │   │   ├── seed/
│   │   │   │   └── route.ts           # POST — Mock data generator (idempotent)
│   │   │   ├── wallets/
│   │   │   │   └── route.ts           # GET — Fetch wallet balances
│   │   │   ├── transactions/
│   │   │   │   └── route.ts           # GET — Fetch recent transactions
│   │   │   ├── insights/
│   │   │   │   └── route.ts           # GET — Fetch proactive insights
│   │   │   └── transfers/
│   │   │       └── route.ts           # POST — Confirm/reject wallet transfers
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts              # Browser Supabase client
│   │   │   └── server.ts              # Server Supabase client (service role)
│   │   ├── gemini/
│   │   │   ├── client.ts              # Gemini client setup
│   │   │   ├── tools.ts               # Function Declarations for Gemini
│   │   │   ├── system-prompt.ts       # Dynamic system prompt builder
│   │   │   └── executor.ts            # Tool execution loop
│   │   └── tools/
│   │       ├── query-transactions.ts  # Deterministic: query & filter transactions
│   │       ├── calculate-balance.ts   # Deterministic: sum/aggregate math
│   │       ├── save-memory.ts         # Save a fact to user_memory + embedding
│   │       ├── read-memory.ts         # Semantic search over user_memory
│   │       └── transfer-to-savings.ts # Create a pending transfer
│   ├── components/
│   │   ├── dashboard/
│   │   │   ├── WalletCard.tsx         # Main balance + savings goals
│   │   │   ├── SavingsGoals.tsx       # Progress bars for each goal
│   │   │   ├── ProactiveAlerts.tsx    # AI-generated insight cards
│   │   │   ├── TransactionList.tsx    # Recent transactions with categories
│   │   │   ├── SpendingChart.tsx      # Category breakdown (recharts)
│   │   │   └── PendingTransfers.tsx   # Confirm/reject agent proposals
│   │   ├── chat/
│   │   │   ├── ChatPanel.tsx          # Full chat interface
│   │   │   ├── ChatMessage.tsx        # Single message bubble
│   │   │   ├── ChatInput.tsx          # Input with send button
│   │   │   └── ToolCallIndicator.tsx  # Shows when agent is calling a tool
│   │   └── ui/
│   │       ├── LoadingSpinner.tsx
│   │       └── Badge.tsx
│   ├── store/
│   │   └── app-store.ts              # Zustand store for global state
│   └── types/
│       ├── database.ts                # TypeScript types matching Supabase schema
│       └── chat.ts                    # Chat message types, tool call types
```

---

## 5. DATABASE SCHEMA

The complete SQL schema is in `supabase-schema.sql`. Run it **once** in the Supabase SQL Editor. Key points:

- **7 tables**: `users`, `wallets`, `transactions`, `wallet_transfers`, `user_memory`, `proactive_insights`, `chat_messages`
- **pgvector enabled**: 768-dimension embeddings on `user_memory.embedding`
- **RLS enabled** with permissive dev-mode policies (allow-all)
- **Seeded dev user**: `Efe` with email `dev@parafin.local`, main wallet at ₺12,500, two savings goals
- **Transaction amounts are always positive** — the `type` enum (`income`/`expense`/`transfer`) indicates direction
- **`match_user_memories()`** — a Postgres function for semantic similarity search

### Dev User IDs (hardcoded for local dev)
```
USER_ID:        a1b2c3d4-e5f6-7890-abcd-ef1234567890
MAIN_WALLET_ID: w1a2b3c4-d5e6-7890-abcd-ef1234567890
```

---

## 6. CORE ARCHITECTURE — THE FOUR PILLARS

### Pillar 1: Inference-Based Agent Architecture (Proactive Engine)

The system **does NOT passively wait** for user input. On dashboard load, the frontend calls `POST /api/run-inference`, which:

1. Fetches the last 7 days of transactions for the dev user.
2. Fetches active user memories.
3. Sends both to Gemini with a structured prompt: *"Analyze this financial data and generate 2-3 proactive alerts or insights. Compare current week vs previous week spending by category. Flag anomalies, upcoming recurring charges, and savings opportunities. Return as JSON array."*
4. Saves the generated insights to the `proactive_insights` table.
5. Returns them as JSON to the frontend for display.

**Insight severity levels:** `info` (general tips), `positive` (good news), `warning` (spending up), `alert` (urgent action needed).

### Pillar 2: Financial Knowledge Memory System

When the user tells the agent something (e.g., "I get paid on the 15th", "I hate Starbucks"), the agent MUST:

1. Recognize this as a memorable fact via Gemini's reasoning.
2. Call the `save_memory` tool with `{ type, content }`.
3. The tool function generates an embedding via `text-embedding-004` and saves it to `user_memory`.
4. On future conversations, relevant memories are retrieved via semantic search and injected into the system prompt.

**Memory types:** `fact`, `preference`, `rule`, `goal`, `pattern`.

### Pillar 3: Hybrid Computational Framework

**THIS IS THE MOST CRITICAL RULE:**

> **The LLM MUST NEVER perform financial math.** All calculations are done by deterministic TypeScript functions. The LLM calls tools, receives exact numbers, and formats the response.

**Deterministic Layer** (`src/lib/tools/`):
- `query_transactions`: Queries Supabase with filters (date range, category, merchant). Returns raw data.
- `calculate_balance`: Computes totals, averages, category breakdowns using exact arithmetic. NEVER floating-point errors — use integer math in cents or the `Decimal` approach.
- `save_memory`: Extracts and persists a user preference/fact.
- `read_memory`: Semantic search over user_memory table.
- `transfer_to_savings`: Creates a `wallet_transfer` record with `pending_confirmation` status.

**LLM Layer** (Gemini):
- Handles natural language understanding and multi-step reasoning.
- Decides WHICH tools to call and in WHAT order.
- Formats the final human-readable response using the exact numbers returned by tools.

### Pillar 4: Agentic Wallet

The agent can propose moving money between wallets. The flow:

1. Agent detects a savings opportunity (e.g., "You spent ₺800 less on dining this month").
2. Agent calls `transfer_to_savings` tool → creates a `wallet_transfers` row with status `pending_confirmation`.
3. Frontend shows a confirmation card in the dashboard.
4. User clicks Confirm or Reject.
5. On confirm: `POST /api/transfers` updates status to `executed` and adjusts wallet balances atomically.
6. On reject: status becomes `rejected`.

**NEVER auto-execute transfers.** Always require user confirmation.

---

## 7. GEMINI AGENT IMPLEMENTATION DETAILS

### System Prompt (`src/lib/gemini/system-prompt.ts`)

Build the system prompt dynamically before each request:

```typescript
function buildSystemPrompt(memories: UserMemory[]): string {
  return `
You are Parafin, a friendly and proactive AI financial assistant for Turkish Gen Z users.
You speak in a casual, supportive tone — like a smart friend who's great with money.
Currency is Turkish Lira (₺ / TRY). Locale: tr-TR.

## ABSOLUTE RULES:
1. NEVER calculate financial amounts yourself. ALWAYS use the provided tools.
2. When you detect a user preference or fact, call save_memory immediately.
3. When proposing money transfers, use transfer_to_savings — never claim money was moved without calling the tool.
4. Format currency as ₺X,XXX.XX (Turkish Lira).
5. Be proactive — suggest savings, warn about overspending, celebrate wins.

## USER MEMORIES (known facts about this user):
${memories.map(m => `- [${m.type}] ${m.content} (confidence: ${m.confidence})`).join('\n')}

## AVAILABLE TOOLS:
- query_transactions: Search and filter the user's transactions by date, category, merchant.
- calculate_balance: Get wallet balances, category totals, spending summaries. USE THIS FOR ALL MATH.
- save_memory: Store a new fact/preference/rule/goal about the user.
- read_memory: Search user's memory for relevant context.
- transfer_to_savings: Propose moving money from main wallet to a savings goal.
`;
}
```

### Tool Declarations (`src/lib/gemini/tools.ts`)

Define as Gemini `FunctionDeclaration[]`:

```typescript
const tools = [
  {
    name: "query_transactions",
    description: "Query the user's financial transactions with optional filters. Returns transaction records.",
    parameters: {
      type: "object",
      properties: {
        start_date: { type: "string", description: "ISO date string for range start" },
        end_date: { type: "string", description: "ISO date string for range end" },
        category: { type: "string", description: "Filter by category (groceries, rent, salary, subscription, etc.)" },
        merchant: { type: "string", description: "Filter by merchant name" },
        type: { type: "string", enum: ["income", "expense", "transfer"], description: "Filter by transaction type" },
        limit: { type: "number", description: "Max results to return (default 20)" }
      }
    }
  },
  {
    name: "calculate_balance",
    description: "Calculate financial totals. Use this for ALL math — never calculate amounts yourself.",
    parameters: {
      type: "object",
      properties: {
        operation: {
          type: "string",
          enum: ["wallet_balance", "total_spend", "total_income", "category_breakdown", "merchant_total", "average_daily_spend"],
          description: "The calculation to perform"
        },
        wallet_id: { type: "string", description: "Specific wallet ID (optional)" },
        category: { type: "string", description: "Filter calculation by category" },
        start_date: { type: "string", description: "ISO date range start" },
        end_date: { type: "string", description: "ISO date range end" }
      },
      required: ["operation"]
    }
  },
  {
    name: "save_memory",
    description: "Save a learned fact, preference, rule, or goal about the user. Call this whenever the user reveals personal financial info.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["fact", "preference", "rule", "goal", "pattern"], description: "Memory type" },
        content: { type: "string", description: "The fact to remember in plain language" },
        confidence: { type: "number", description: "Confidence score 0.0-1.0 (1.0 if user stated directly)" }
      },
      required: ["type", "content"]
    }
  },
  {
    name: "read_memory",
    description: "Search the user's memory for relevant context. Use before answering questions that might relate to known preferences.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "What to search for in user memory" }
      },
      required: ["query"]
    }
  },
  {
    name: "transfer_to_savings",
    description: "Propose transferring money from the main wallet to a savings goal. Requires user confirmation before execution.",
    parameters: {
      type: "object",
      properties: {
        to_wallet_name: { type: "string", description: "Name of the savings goal (e.g., 'Acil Durum Fonu', 'Tatil')" },
        amount: { type: "number", description: "Amount in TRY to transfer" },
        reason: { type: "string", description: "AI-generated explanation for why this transfer makes sense" }
      },
      required: ["to_wallet_name", "amount", "reason"]
    }
  }
];
```

### Execution Loop (`src/lib/gemini/executor.ts`)

This is the core agentic loop. **Implement it exactly:**

```
1. Receive user message
2. Load user memories from DB (top 5-10 relevant)
3. Build system prompt with memories injected
4. Send to Gemini with tools declared
5. LOOP:
   a. If Gemini response contains functionCall(s):
      - Execute each tool call against the deterministic TS functions
      - Send tool results back to Gemini as functionResponse
      - Go back to step 5
   b. If Gemini response is text (no more tool calls):
      - Return the final text to the user
      - Save the conversation to chat_messages table
      - Break loop
6. Max iterations: 10 (safety valve to prevent infinite loops)
```

---

## 8. MOCK DATA GENERATOR (`/api/seed`)

Create `POST /api/seed/route.ts` that generates **2 months** of realistic Turkish financial data. It must be **idempotent** (safe to call multiple times — delete existing data first).

### Transaction Templates

```typescript
const templates = {
  // INCOME — 15th of each month
  salary: { type: "income", category: "salary", merchant: "TechCorp A.Ş.", amount: 28000, recurring: true, day: 15 },

  // RENT — 1st of each month
  rent: { type: "expense", category: "rent", merchant: "Ev Kirası", amount: 8500, recurring: true, day: 1 },

  // SUBSCRIPTIONS — various days, recurring
  subscriptions: [
    { category: "subscription", subcategory: "streaming", merchant: "Netflix", amount: 149.99, day: 5 },
    { category: "subscription", subcategory: "streaming", merchant: "Spotify", amount: 59.99, day: 8 },
    { category: "subscription", subcategory: "streaming", merchant: "YouTube Premium", amount: 79.99, day: 12 },
    { category: "subscription", subcategory: "fitness", merchant: "MacFit", amount: 599, day: 3 },
  ],

  // GROCERIES — 3-5x per week, randomized amounts
  groceries: [
    { merchant: "Migros", minAmount: 150, maxAmount: 650 },
    { merchant: "A101", minAmount: 80, maxAmount: 350 },
    { merchant: "BİM", minAmount: 60, maxAmount: 280 },
    { merchant: "CarrefourSA", minAmount: 200, maxAmount: 800 },
  ],

  // COFFEE & DINING — 2-4x per week
  coffee: [
    { merchant: "Starbucks", subcategory: "coffee", minAmount: 80, maxAmount: 180 },
    { merchant: "Kahve Dünyası", subcategory: "coffee", minAmount: 50, maxAmount: 120 },
  ],
  dining: [
    { merchant: "Yemeksepeti", subcategory: "delivery", minAmount: 120, maxAmount: 350 },
    { merchant: "Getir Yemek", subcategory: "delivery", minAmount: 100, maxAmount: 280 },
    { merchant: "Local Restaurant", subcategory: "dine-in", minAmount: 200, maxAmount: 600 },
  ],

  // TRANSPORT — daily on weekdays
  transport: [
    { merchant: "İstanbulkart", subcategory: "public", amount: 34.87 },
    { merchant: "Uber", subcategory: "ride", minAmount: 80, maxAmount: 250 },
    { merchant: "BiTaksi", subcategory: "ride", minAmount: 60, maxAmount: 200 },
  ],

  // SHOPPING — 2-3x per month
  shopping: [
    { merchant: "Trendyol", minAmount: 150, maxAmount: 1200 },
    { merchant: "Hepsiburada", minAmount: 200, maxAmount: 1500 },
  ],

  // UTILITIES — monthly
  utilities: [
    { merchant: "İGDAŞ", subcategory: "gas", amount: 450, day: 20 },
    { merchant: "İSKİ", subcategory: "water", amount: 180, day: 22 },
    { merchant: "Türk Telekom", subcategory: "internet", amount: 349, day: 18 },
    { merchant: "Vodafone", subcategory: "phone", amount: 250, day: 16 },
  ],
};
```

**Important:** Add some variance to make data realistic for anomaly detection:
- Make the most recent week's food spending ~40% higher than the weekly average (so the proactive engine has something to detect).
- Add a random one-time large expense (₺3,000+) in the last 2 weeks.
- Randomize timestamps throughout the day (not all at midnight).

---

## 9. PROACTIVE INFERENCE ENGINE (`/api/run-inference`)

### Implementation:

```typescript
// POST /api/run-inference/route.ts
// Called on dashboard load — generates proactive financial insights

async function POST(request: Request) {
  // 1. Fetch last 14 days of transactions
  // 2. Fetch active user memories
  // 3. Calculate current week vs previous week totals by category
  // 4. Send to Gemini with this prompt:

  const analysisPrompt = `
    You are a financial analyst engine. Analyze the following data and return
    ONLY a JSON array of 2-3 proactive insights. No prose, no markdown.

    TRANSACTION SUMMARY (last 14 days):
    ${JSON.stringify(transactionSummary)}

    WEEK-OVER-WEEK COMPARISON:
    ${JSON.stringify(weekComparison)}

    USER MEMORIES:
    ${memories.map(m => m.content).join('; ')}

    Return format:
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
    - Upcoming recurring charges
    - Savings opportunities
    - Positive trends (spending down in a category)
  `;

  // 5. Parse JSON response
  // 6. Upsert into proactive_insights table
  // 7. Return insights array
}
```

---

## 10. FRONTEND DESIGN SPECIFICATION

### Layout: Split-Screen Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  HEADER: "Parafin" logo + user avatar + date               │
├──────────────────────────────┬──────────────────────────────┤
│                              │                              │
│   DASHBOARD PANEL (60%)      │   CHAT PANEL (40%)           │
│                              │                              │
│   ┌─────────────────────┐    │   ┌──────────────────────┐   │
│   │ WALLET CARD         │    │   │                      │   │
│   │ ₺12,500.00          │    │   │  Chat messages        │   │
│   │ Ana Hesap            │    │   │  with tool call      │   │
│   └─────────────────────┘    │   │  indicators          │   │
│                              │   │                      │   │
│   ┌─────────────────────┐    │   │                      │   │
│   │ SAVINGS GOALS       │    │   │                      │   │
│   │ ████████░░ 32%      │    │   │                      │   │
│   │ ██░░░░░░░░ 17%      │    │   │                      │   │
│   └─────────────────────┘    │   │                      │   │
│                              │   │                      │   │
│   ┌─────────────────────┐    │   │                      │   │
│   │ PROACTIVE ALERTS    │    │   │                      │   │
│   │ ⚠️ Food up 40%      │    │   │                      │   │
│   │ ✅ Transport down    │    │   │                      │   │
│   └─────────────────────┘    │   │                      │   │
│                              │   │                      │   │
│   ┌─────────────────────┐    │   ├──────────────────────┤   │
│   │ PENDING TRANSFERS   │    │   │ [Type a message...]  │   │
│   │ [Confirm] [Reject]  │    │   │            [Send ▶]  │   │
│   └─────────────────────┘    │   └──────────────────────┘   │
│                              │                              │
│   ┌─────────────────────┐    │                              │
│   │ RECENT TRANSACTIONS │    │                              │
│   │ ...                 │    │                              │
│   └─────────────────────┘    │                              │
│                              │                              │
│   ┌─────────────────────┐    │                              │
│   │ SPENDING CHART      │    │                              │
│   │ (category donut)    │    │                              │
│   └─────────────────────┘    │                              │
│                              │                              │
├──────────────────────────────┴──────────────────────────────┤
│  On mobile: stack vertically — dashboard on top, chat below │
└─────────────────────────────────────────────────────────────┘
```

### Design Direction

**Aesthetic:** Modern fintech — dark mode primary with vibrant accent gradients. Think "premium banking app for Gen Z." NOT generic startup purple. Use a **dark slate/charcoal background** (#0f172a / slate-900) with **vibrant teal/emerald accents** (#10b981) and warm amber for warnings (#f59e0b).

**Typography:** Use `"Plus Jakarta Sans"` from Google Fonts as the primary typeface. It's geometric, modern, and readable at small sizes — perfect for financial data.

**Component Details:**
- **Wallet Card**: Large balance number, glass-morphism card effect (`backdrop-blur-xl`, semi-transparent background).
- **Savings Goals**: Horizontal progress bars with percentage and remaining amount. Animated fill on load.
- **Proactive Alerts**: Cards with severity-based left border color (teal=positive, amber=warning, red=alert, blue=info). Dismissable.
- **Pending Transfers**: Action cards with Confirm (green) and Reject (red) buttons. Show agent's reasoning.
- **Transaction List**: Grouped by date. Each row: merchant icon/letter, merchant name, category badge, amount (red for expense, green for income).
- **Spending Chart**: Donut chart via recharts, category breakdown for current month.
- **Chat Messages**: User messages right-aligned (teal), assistant messages left-aligned (slate). When the agent calls a tool, show a subtle animated indicator ("Analyzing transactions..." / "Checking balance...").
- **Chat Input**: Sticky bottom, rounded, with send button.

**Responsive Behavior:**
- Desktop (≥1024px): Side-by-side split layout.
- Tablet (768-1023px): Dashboard full width, chat as sliding drawer from right.
- Mobile (<768px): Tab-based navigation — "Dashboard" tab and "Chat" tab.

---

## 11. GLOBAL STATE (Zustand)

```typescript
// src/store/app-store.ts
interface AppState {
  // Wallets
  wallets: Wallet[];
  loadWallets: () => Promise<void>;

  // Transactions
  transactions: Transaction[];
  loadTransactions: () => Promise<void>;

  // Insights
  insights: ProactiveInsight[];
  loadInsights: () => Promise<void>;
  runInference: () => Promise<void>;
  dismissInsight: (id: string) => void;

  // Pending transfers
  pendingTransfers: WalletTransfer[];
  loadPendingTransfers: () => Promise<void>;
  confirmTransfer: (id: string) => Promise<void>;
  rejectTransfer: (id: string) => Promise<void>;

  // Chat
  chatMessages: ChatMessage[];
  sendMessage: (content: string) => Promise<void>;
  isChatLoading: boolean;
  currentToolCall: string | null; // "Querying transactions..." etc.

  // Init
  initializeDashboard: () => Promise<void>; // Calls all loaders + runInference
}
```

---

## 12. API ROUTE CONTRACTS

### `POST /api/chat`
**Request:** `{ message: string, sessionId?: string }`
**Response (streaming preferred, SSE):**
```json
{
  "response": "Here's your spending breakdown...",
  "toolCalls": [
    { "name": "calculate_balance", "args": { "operation": "category_breakdown" }, "result": { ... } }
  ],
  "memoryUpdated": false
}
```

### `POST /api/run-inference`
**Request:** `{ userId: string }`
**Response:**
```json
{
  "insights": [
    { "id": "uuid", "title": "...", "body": "...", "severity": "warning", "category": "food" }
  ]
}
```

### `GET /api/wallets`
**Response:** `{ wallets: Wallet[] }`

### `GET /api/transactions?limit=20&offset=0`
**Response:** `{ transactions: Transaction[], total: number }`

### `GET /api/insights`
**Response:** `{ insights: ProactiveInsight[] }`

### `POST /api/transfers`
**Request:** `{ transferId: string, action: "confirm" | "reject" }`
**Response:** `{ success: boolean, transfer: WalletTransfer }`

### `POST /api/seed`
**Request:** `{}` (no body needed)
**Response:** `{ seeded: true, transactionCount: number }`

---

## 13. IMPLEMENTATION ORDER

Follow this exact sequence:

1. **Project init** — `npx create-next-app@latest` with TypeScript + Tailwind + App Router. Install all deps.
2. **Types** — Create `src/types/database.ts` with interfaces matching all Supabase tables.
3. **Supabase clients** — `src/lib/supabase/client.ts` (browser) and `server.ts` (service role).
4. **Mock data seed** — `POST /api/seed/route.ts`. Test it by calling it once and checking Supabase.
5. **Deterministic tools** — All 5 tool functions in `src/lib/tools/`. Unit test them if possible.
6. **Gemini agent** — Client setup, tool declarations, system prompt builder, execution loop. Test via `/api/chat`.
7. **Proactive engine** — `/api/run-inference`. Test independently.
8. **Data API routes** — `/api/wallets`, `/api/transactions`, `/api/insights`, `/api/transfers`.
9. **Zustand store** — Wire up all state management.
10. **Frontend components** — Build each component, wire to store.
11. **Main page** — Assemble the split-screen layout.
12. **Polish** — Animations, loading states, error handling, responsive design.

---

## 14. CRITICAL RULES (READ THESE LAST — THEY OVERRIDE EVERYTHING)

1. **NO MOBILE EMULATORS.** This is a responsive web app. Period.
2. **NO LLM MATH.** If a number appears in a response, it came from a tool call. Always.
3. **NO AUTO-TRANSFERS.** Every wallet transfer needs user confirmation via the UI.
4. **IDEMPOTENT SEED.** The seed endpoint must be safe to call repeatedly.
5. **TURKISH CONTEXT.** Currency is ₺ TRY. Merchant names are Turkish. Locale is tr-TR. The UI language is English but domain terms stay in Turkish (Ana Hesap, Acil Durum Fonu, etc.).
6. **ERROR HANDLING.** Every API route must have try/catch. Every Supabase query must check for errors. Every Gemini call must handle failures gracefully.
7. **TOOL LOOP SAFETY.** Max 10 iterations on the Gemini tool-calling loop. Break and return a fallback message if exceeded.
8. **ENVIRONMENT VARIABLES.** Never hardcode keys. Always read from `process.env`. Check they exist at startup.

---

## 15. QUICK START CHECKLIST

```
[ ] 1. Run supabase-schema.sql in Supabase SQL Editor
[ ] 2. Fill in .env.local with real Supabase + Gemini keys
[ ] 3. pnpm install
[ ] 4. pnpm dev
[ ] 5. Hit POST /api/seed to generate mock data
[ ] 6. Open http://localhost:3000 — dashboard should load with proactive insights
[ ] 7. Chat with the agent — ask "How much did I spend on groceries this month?"
[ ] 8. Tell it "I get paid on the 15th" — verify memory is saved in Supabase
[ ] 9. Ask it to save money — verify pending transfer appears on dashboard
```
