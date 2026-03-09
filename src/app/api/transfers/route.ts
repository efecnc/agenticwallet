import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/server";

const DEV_USER_ID = (process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890").trim();

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from("wallet_transfers")
      .select("*")
      .eq("user_id", DEV_USER_ID)
      .eq("status", "pending_confirmation")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ transfers: data || [] });
  } catch (err) {
    console.error("Transfers GET error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch transfers" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { transferId, action } = body;

    if (!transferId || !["confirm", "reject"].includes(action)) {
      return NextResponse.json(
        { error: "transferId and action (confirm/reject) are required" },
        { status: 400 }
      );
    }

    // Fetch the transfer
    const { data: transfer, error: fetchError } = await supabaseAdmin
      .from("wallet_transfers")
      .select("*")
      .eq("id", transferId)
      .eq("user_id", DEV_USER_ID)
      .eq("status", "pending_confirmation")
      .single();

    if (fetchError || !transfer) {
      return NextResponse.json(
        { error: "Transfer not found or already processed" },
        { status: 404 }
      );
    }

    if (action === "reject") {
      const { data: updated, error: updateError } = await supabaseAdmin
        .from("wallet_transfers")
        .update({ status: "rejected" })
        .eq("id", transferId)
        .select()
        .single();

      if (updateError) throw new Error(updateError.message);

      return NextResponse.json({ success: true, transfer: updated });
    }

    // CONFIRM: Execute the transfer atomically
    // 1. Deduct from source wallet
    const { data: fromWallet, error: fromError } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("id", transfer.from_wallet_id)
      .single();

    if (fromError) throw new Error(fromError.message);

    const fromBalance = Number(fromWallet.balance);
    const transferAmount = Number(transfer.amount);

    if (fromBalance < transferAmount) {
      return NextResponse.json(
        { error: "Insufficient balance for transfer" },
        { status: 400 }
      );
    }

    // Use integer math for balance updates
    const newFromCents = Math.round(fromBalance * 100) - Math.round(transferAmount * 100);

    const { error: deductError } = await supabaseAdmin
      .from("wallets")
      .update({ balance: newFromCents / 100 })
      .eq("id", transfer.from_wallet_id);

    if (deductError) throw new Error(deductError.message);

    // 2. Add to target wallet
    const { data: toWallet, error: toError } = await supabaseAdmin
      .from("wallets")
      .select("balance")
      .eq("id", transfer.to_wallet_id)
      .single();

    if (toError) throw new Error(toError.message);

    const toBalance = Number(toWallet.balance);
    const newToCents = Math.round(toBalance * 100) + Math.round(transferAmount * 100);

    const { error: addError } = await supabaseAdmin
      .from("wallets")
      .update({ balance: newToCents / 100 })
      .eq("id", transfer.to_wallet_id);

    if (addError) throw new Error(addError.message);

    // 3. Update transfer status
    const { data: updated, error: statusError } = await supabaseAdmin
      .from("wallet_transfers")
      .update({
        status: "executed",
        confirmed_at: new Date().toISOString(),
      })
      .eq("id", transferId)
      .select()
      .single();

    if (statusError) throw new Error(statusError.message);

    return NextResponse.json({ success: true, transfer: updated });
  } catch (err) {
    console.error("Transfer POST error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Transfer failed" },
      { status: 500 }
    );
  }
}
