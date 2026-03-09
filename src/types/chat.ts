export interface ToolCallInfo {
  name: string;
  args: Record<string, unknown>;
  result?: unknown;
}

export interface ChatMessageUI {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolCalls?: ToolCallInfo[];
  createdAt: string;
}

export interface ChatResponse {
  response: string;
  toolCalls: ToolCallInfo[];
  memoryUpdated: boolean;
}
