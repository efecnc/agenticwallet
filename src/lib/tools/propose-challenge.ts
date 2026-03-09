import { supabaseAdmin } from "@/lib/supabase/server";

const DEV_USER_ID = (process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890").trim();

interface ChallengeArgs {
  challenge_type: "no_spend" | "save_amount" | "reduce_category";
  description: string;
  target_merchant?: string;
  target_category?: string;
  target_amount?: number;
  duration_days: number;
  reward_message?: string;
}

export async function proposeChallenge(args: ChallengeArgs) {
  const {
    challenge_type,
    description,
    target_merchant,
    target_category,
    target_amount,
    duration_days = 7,
    reward_message,
  } = args;

  const now = new Date();
  const endDate = new Date(now.getTime() + duration_days * 24 * 60 * 60 * 1000);

  const challengeData = {
    challenge_type,
    target_merchant: target_merchant || null,
    target_category: target_category || null,
    target_amount: target_amount ? Math.round(target_amount * 100) / 100 : null,
    start_date: now.toISOString().split("T")[0],
    end_date: endDate.toISOString().split("T")[0],
    duration_days,
    status: "active",
    reward_message: reward_message || "Harika! Meydan okumayı tamamladın! 🎉",
  };

  // Store as a proactive insight with category = "challenge"
  const { data, error } = await supabaseAdmin
    .from("proactive_insights")
    .insert({
      user_id: DEV_USER_ID,
      title: `🎯 ${description}`,
      body: `${duration_days} günlük meydan okuma: ${description}. ${
        target_amount ? `Hedef: ₺${target_amount.toLocaleString("tr-TR")}` : ""
      }`,
      severity: "info",
      category: "challenge",
      metadata: challengeData,
      expires_at: endDate.toISOString(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create challenge: ${error.message}`);
  }

  return {
    success: true,
    challenge_id: data.id,
    description,
    challenge_type,
    duration_days,
    start_date: challengeData.start_date,
    end_date: challengeData.end_date,
    message: `Meydan okuma oluşturuldu: "${description}" — ${duration_days} gün sürecek!`,
  };
}
