// TypeScript types matching the Supabase schema

export type WalletType = "main" | "savings_goal";
export type TransactionType = "income" | "expense" | "transfer";
export type TransferStatus = "pending_confirmation" | "confirmed" | "rejected" | "executed";
export type MemoryType = "fact" | "preference" | "rule" | "goal" | "pattern";
export type InsightSeverity = "info" | "warning" | "alert" | "positive";
export type ChatRole = "user" | "assistant" | "system" | "tool";

export interface User {
  id: string;
  auth_id: string | null;
  email: string;
  display_name: string;
  avatar_url: string | null;
  currency: string;
  locale: string;
  timezone: string;
  onboarded_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  type: WalletType;
  name: string;
  balance: number;
  target_amount: number | null;
  color: string;
  icon: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  wallet_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category: string;
  subcategory: string | null;
  merchant: string | null;
  description: string | null;
  occurred_at: string;
  is_recurring: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface WalletTransfer {
  id: string;
  user_id: string;
  from_wallet_id: string;
  to_wallet_id: string;
  amount: number;
  status: TransferStatus;
  reason: string | null;
  initiated_by: string;
  confirmed_at: string | null;
  created_at: string;
}

export interface UserMemory {
  id: string;
  user_id: string;
  type: MemoryType;
  content: string;
  embedding: number[] | null;
  confidence: number;
  source: string;
  is_active: boolean;
  last_accessed: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProactiveInsight {
  id: string;
  user_id: string;
  title: string;
  body: string;
  severity: InsightSeverity;
  category: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  expires_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  session_id: string;
  role: ChatRole;
  content: string;
  tool_calls: Record<string, unknown> | null;
  token_count: number | null;
  created_at: string;
}
