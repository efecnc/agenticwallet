import { supabaseAdmin } from "@/lib/supabase/server";

const DEV_USER_ID = process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890";
const DEV_WALLET_ID = process.env.DEV_WALLET_ID || "01a2b3c4-d5e6-7890-abcd-ef1234567890";

interface TransferParams {
  to_wallet_name: string;
  amount: number;
  reason: string;
}

export async function transferToSavings(params: TransferParams) {
  // Find the target savings wallet by name
  const { data: wallets, error: walletError } = await supabaseAdmin
    .from("wallets")
    .select("id, name, balance, target_amount")
    .eq("user_id", DEV_USER_ID)
    .eq("type", "savings_goal")
    .eq("is_active", true)
    .ilike("name", `%${params.to_wallet_name}%`);

  if (walletError) throw new Error(walletError.message);
  if (!wallets || wallets.length === 0) {
    throw new Error(`Savings goal "${params.to_wallet_name}" not found`);
  }

  const targetWallet = wallets[0];

  // Check main wallet has sufficient balance
  const { data: mainWallet, error: mainError } = await supabaseAdmin
    .from("wallets")
    .select("balance")
    .eq("id", DEV_WALLET_ID)
    .single();

  if (mainError) throw new Error(mainError.message);
  if (Number(mainWallet.balance) < params.amount) {
    throw new Error(
      `Insufficient balance. Main wallet has ₺${Number(mainWallet.balance).toFixed(2)} but transfer requires ₺${params.amount.toFixed(2)}`
    );
  }

  // Create pending transfer — NEVER auto-execute
  const { data: transfer, error: transferError } = await supabaseAdmin
    .from("wallet_transfers")
    .insert({
      user_id: DEV_USER_ID,
      from_wallet_id: DEV_WALLET_ID,
      to_wallet_id: targetWallet.id,
      amount: params.amount,
      status: "pending_confirmation",
      reason: params.reason,
      initiated_by: "agent",
    })
    .select()
    .single();

  if (transferError) throw new Error(transferError.message);

  return {
    transfer_id: transfer.id,
    status: "pending_confirmation",
    from_wallet: "Ana Hesap",
    to_wallet: targetWallet.name,
    amount: params.amount,
    reason: params.reason,
    message: `Transfer of ₺${params.amount.toFixed(2)} to "${targetWallet.name}" is pending your confirmation.`,
  };
}
