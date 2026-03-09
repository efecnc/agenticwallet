import { executeAgentLoop } from "@/lib/gemini/executor";
import { supabaseAdmin } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";

const DEV_USER_ID = process.env.DEV_USER_ID || "a1b2c3d4-e5f6-7890-abcd-ef1234567890";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message, sessionId, stream } = body;

    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "Message is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const currentSessionId = sessionId || uuidv4();

    // Save user message
    await supabaseAdmin.from("chat_messages").insert({
      user_id: DEV_USER_ID,
      session_id: currentSessionId,
      role: "user",
      content: message,
    });

    if (stream) {
      // SSE streaming mode
      const encoder = new TextEncoder();

      const readable = new ReadableStream({
        async start(controller) {
          function sendEvent(type: string, data: Record<string, unknown>) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type, ...data })}\n\n`)
            );
          }

          try {
            const result = await executeAgentLoop(message, (toolName: string) => {
              sendEvent("tool_call", { tool: toolName });
            });

            // Save assistant response
            await supabaseAdmin.from("chat_messages").insert({
              user_id: DEV_USER_ID,
              session_id: currentSessionId,
              role: "assistant",
              content: result.response,
              tool_calls: result.toolCalls.length > 0 ? result.toolCalls : null,
            });

            sendEvent("done", {
              response: result.response,
              toolCalls: result.toolCalls,
              memoryUpdated: result.memoryUpdated,
              sessionId: currentSessionId,
            });
          } catch (err) {
            sendEvent("error", {
              error: err instanceof Error ? err.message : "Internal server error",
            });
          } finally {
            controller.close();
          }
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming fallback
    const result = await executeAgentLoop(message);

    await supabaseAdmin.from("chat_messages").insert({
      user_id: DEV_USER_ID,
      session_id: currentSessionId,
      role: "assistant",
      content: result.response,
      tool_calls: result.toolCalls.length > 0 ? result.toolCalls : null,
    });

    return new Response(
      JSON.stringify({
        response: result.response,
        toolCalls: result.toolCalls,
        memoryUpdated: result.memoryUpdated,
        sessionId: currentSessionId,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Chat API error:", err);
    return new Response(
      JSON.stringify({
        error: err instanceof Error ? err.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
