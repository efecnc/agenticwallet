import { supabaseAdmin } from "@/lib/supabase/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const DEV_USER_ID = process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

interface ReadMemoryParams {
  query: string;
}

export async function readMemory(params: ReadMemoryParams) {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!);

  // Generate embedding for the search query
  const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
  const embeddingResult = await embeddingModel.embedContent(params.query);
  const embedding = embeddingResult.embedding.values;

  // Semantic search via the match_user_memories function
  const { data, error } = await supabaseAdmin.rpc("match_user_memories", {
    p_user_id: DEV_USER_ID,
    p_embedding: JSON.stringify(embedding),
    p_match_count: 5,
    p_match_threshold: 0.5,
  });

  if (error) throw new Error(error.message);

  // Also fetch all active memories as fallback if semantic search returns nothing
  if (!data || data.length === 0) {
    const { data: allMemories, error: allError } = await supabaseAdmin
      .from("user_memory")
      .select("id, type, content, confidence")
      .eq("user_id", DEV_USER_ID)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(10);

    if (allError) throw new Error(allError.message);

    return {
      memories: (allMemories || []).map((m) => ({
        id: m.id,
        type: m.type,
        content: m.content,
        confidence: Number(m.confidence),
        similarity: 0,
      })),
      source: "fallback",
    };
  }

  // Update last_accessed for returned memories
  const ids = data.map((m: { id: string }) => m.id);
  await supabaseAdmin
    .from("user_memory")
    .update({ last_accessed: new Date().toISOString() })
    .in("id", ids);

  return {
    memories: data.map((m: { id: string; type: string; content: string; confidence: number; similarity: number }) => ({
      id: m.id,
      type: m.type,
      content: m.content,
      confidence: Number(m.confidence),
      similarity: m.similarity,
    })),
    source: "semantic_search",
  };
}
