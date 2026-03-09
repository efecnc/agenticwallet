import { getGeminiClient } from "./client";
import { geminiTools } from "./tools";
import { buildSystemPrompt } from "./system-prompt";
import { queryTransactions } from "@/lib/tools/query-transactions";
import { calculateBalance } from "@/lib/tools/calculate-balance";
import { saveMemory } from "@/lib/tools/save-memory";
import { readMemory } from "@/lib/tools/read-memory";
import { transferToSavings } from "@/lib/tools/transfer-to-savings";
import { calculateSafeToSpend } from "@/lib/tools/calculate-safe-to-spend";
import { proposeChallenge } from "@/lib/tools/propose-challenge";
import { analyzeDiscounts } from "@/lib/tools/analyze-discounts";
import { getCalendarEvents } from "@/lib/tools/get-calendar-events";
import { supabaseAdmin } from "@/lib/supabase/server";
import type { UserMemory } from "@/types/database";
import type { ToolCallInfo } from "@/types/chat";

const DEV_USER_ID = (process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890").trim();
const MAX_ITERATIONS = 10;

async function loadUserMemories(): Promise<UserMemory[]> {
  const { data, error } = await supabaseAdmin
    .from("user_memory")
    .select("*")
    .eq("user_id", DEV_USER_ID)
    .eq("is_active", true)
    .order("last_accessed", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error loading memories:", error);
    return [];
  }

  return (data as UserMemory[]) || [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function executeTool(name: string, args: any): Promise<unknown> {
  switch (name) {
    case "query_transactions":
      return queryTransactions(args);
    case "calculate_balance":
      return calculateBalance(args);
    case "save_memory":
      return saveMemory(args);
    case "read_memory":
      return readMemory(args);
    case "transfer_to_savings":
      return transferToSavings(args);
    case "calculate_safe_to_spend":
      return calculateSafeToSpend(args);
    case "propose_challenge":
      return proposeChallenge(args);
    case "analyze_discounts":
      return analyzeDiscounts(args);
    case "get_calendar_events":
      return getCalendarEvents(args);
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

export async function executeAgentLoop(
  userMessage: string,
  onToolCall?: (toolName: string) => void
): Promise<{
  response: string;
  toolCalls: ToolCallInfo[];
  memoryUpdated: boolean;
}> {
  const toolCalls: ToolCallInfo[] = [];
  let memoryUpdated = false;

  try {
    // 1. Load user memories
    const memories = await loadUserMemories();

    // 2. Build system prompt
    const systemPrompt = buildSystemPrompt(memories);

    // 3. Initialize Gemini with tools
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: systemPrompt,
      tools: [{ functionDeclarations: geminiTools }],
    });

    // 4. Start chat
    const chat = model.startChat();

    // 5. Send user message
    let result = await chat.sendMessage(userMessage);

    // 6. Tool-calling loop
    for (let i = 0; i < MAX_ITERATIONS; i++) {
      const response = result.response;
      const candidates = response.candidates;

      if (!candidates || candidates.length === 0) {
        return {
          response: "I'm having trouble processing that. Could you try again?",
          toolCalls,
          memoryUpdated,
        };
      }

      const parts = candidates[0].content.parts;

      // Check for function calls
      const functionCallParts = parts.filter((p) => p.functionCall);

      if (functionCallParts.length === 0) {
        // No more tool calls — extract text response
        const textParts = parts.filter((p) => p.text);
        const finalText = textParts.map((p) => p.text).join("\n");

        return {
          response: finalText || "Done!",
          toolCalls,
          memoryUpdated,
        };
      }

      // Execute each function call
      const functionResponses: { functionResponse: { name: string; response: unknown } }[] = [];

      for (const part of functionCallParts) {
        const fc = part.functionCall!;
        const toolName = fc.name;
        const toolArgs = (fc.args as Record<string, unknown>) || {};

        try {
          if (onToolCall) onToolCall(toolName);
          const toolResult = await executeTool(toolName, toolArgs);

          toolCalls.push({
            name: toolName,
            args: toolArgs,
            result: toolResult,
          });

          if (toolName === "save_memory") {
            memoryUpdated = true;
          }

          functionResponses.push({
            functionResponse: {
              name: toolName,
              response: toolResult,
            },
          });
        } catch (err) {
          const errorMsg = err instanceof Error ? err.message : "Tool execution failed";

          toolCalls.push({
            name: toolName,
            args: toolArgs,
            result: { error: errorMsg },
          });

          functionResponses.push({
            functionResponse: {
              name: toolName,
              response: { error: errorMsg },
            },
          });
        }
      }

      // Send tool results back to Gemini
      result = await chat.sendMessage(functionResponses as never);
    }

    // Safety valve: max iterations reached
    return {
      response:
        "I've been thinking about this for a while. Let me give you what I have so far based on my analysis.",
      toolCalls,
      memoryUpdated,
    };
  } catch (err) {
    console.error("Agent execution error:", err);
    return {
      response:
        "Sorry, I ran into an issue. Please try again in a moment.",
      toolCalls,
      memoryUpdated,
    };
  }
}
