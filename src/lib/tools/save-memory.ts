import { supabaseAdmin } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEV_USER_ID = (process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890").trim();

interface SaveMemoryParams {
  type: "fact" | "preference" | "rule" | "goal" | "pattern";
  content: string;
  confidence?: number;
}

export async function saveMemory(params: SaveMemoryParams) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

  // Generate embedding for semantic search
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const embeddingResult = await embeddingModel.embedContent(params.content);
  const embedding = embeddingResult.embedding.values;

  // Check for duplicate/similar memories
  const { data: existing } = await supabaseAdmin.rpc("match_user_memories", {
    p_user_id: DEV_USER_ID,
    p_embedding: JSON.stringify(embedding),
    p_match_count: 1,
    p_match_threshold: 0.9,
  });

  if (existing && existing.length > 0) {
    // Update existing memory instead of creating a duplicate
    const { error } = await supabaseAdmin
      .from("user_memory")
      .update({
        content: params.content,
        type: params.type,
        confidence: params.confidence ?? 1.0,
        embedding: JSON.stringify(embedding),
        last_accessed: new Date().toISOString(),
      })
      .eq("id", existing[0].id);

    if (error) throw new Error(error.message);

    return {
      saved: true,
      updated: true,
      memory_id: existing[0].id,
      content: params.content,
    };
  }

  // Insert new memory
  const { data, error } = await supabaseAdmin
    .from("user_memory")
    .insert({
      user_id: DEV_USER_ID,
      type: params.type,
      content: params.content,
      confidence: params.confidence ?? 1.0,
      embedding: JSON.stringify(embedding),
      source: "conversation",
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  return {
    saved: true,
    updated: false,
    memory_id: data.id,
    content: params.content,
  };
}
