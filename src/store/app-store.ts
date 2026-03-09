import { create } from "zustand";
import type { Wallet, Transaction, ProactiveInsight, WalletTransfer } from "@/types/database";
import type { ChatMessageUI, ChatResponse } from "@/types/chat";
import { v4 as uuidv4 } from "uuid";

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
  chatMessages: ChatMessageUI[];
  sendMessage: (content: string) => Promise<void>;
  isChatLoading: boolean;
  currentToolCall: string | null;
  sessionId: string;

  // Init
  isInitialized: boolean;
  isLoading: boolean;
  initializeDashboard: () => Promise<void>;
}

const toolCallLabels: Record<string, string> = {
  query_transactions: "İşlemler aranıyor...",
  calculate_balance: "Bakiye hesaplanıyor...",
  save_memory: "Hafızaya kaydediliyor...",
  read_memory: "Hafıza kontrol ediliyor...",
  transfer_to_savings: "Transfer hazırlanıyor...",
};

export const useAppStore = create<AppState>((set, get) => ({
  // Wallets
  wallets: [],
  loadWallets: async () => {
    try {
      const res = await fetch("/api/wallets");
      const data = await res.json();
      set({ wallets: data.wallets || [] });
    } catch (err) {
      console.error("Failed to load wallets:", err);
    }
  },

  // Transactions
  transactions: [],
  loadTransactions: async () => {
    try {
      const res = await fetch("/api/transactions?limit=20");
      const data = await res.json();
      set({ transactions: data.transactions || [] });
    } catch (err) {
      console.error("Failed to load transactions:", err);
    }
  },

  // Insights
  insights: [],
  loadInsights: async () => {
    try {
      const res = await fetch("/api/insights");
      const data = await res.json();
      set({ insights: data.insights || [] });
    } catch (err) {
      console.error("Failed to load insights:", err);
    }
  },
  runInference: async () => {
    try {
      const res = await fetch("/api/run-inference", { method: "POST" });
      const data = await res.json();
      if (data.insights) {
        set({ insights: data.insights });
      }
    } catch (err) {
      console.error("Failed to run inference:", err);
    }
  },
  dismissInsight: (id: string) => {
    set((state) => ({
      insights: state.insights.filter((i) => i.id !== id),
    }));
    // Fire and forget the API call
    fetch("/api/insights", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, dismissed: true }),
    }).catch(console.error);
  },

  // Pending transfers
  pendingTransfers: [],
  loadPendingTransfers: async () => {
    try {
      const res = await fetch("/api/transfers");
      const data = await res.json();
      set({ pendingTransfers: data.transfers || [] });
    } catch (err) {
      console.error("Failed to load transfers:", err);
    }
  },
  confirmTransfer: async (id: string) => {
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferId: id, action: "confirm" }),
      });
      const data = await res.json();
      if (data.success) {
        set((state) => ({
          pendingTransfers: state.pendingTransfers.filter((t) => t.id !== id),
        }));
        // Reload wallets to reflect new balances
        get().loadWallets();
      }
    } catch (err) {
      console.error("Failed to confirm transfer:", err);
    }
  },
  rejectTransfer: async (id: string) => {
    try {
      const res = await fetch("/api/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transferId: id, action: "reject" }),
      });
      const data = await res.json();
      if (data.success) {
        set((state) => ({
          pendingTransfers: state.pendingTransfers.filter((t) => t.id !== id),
        }));
      }
    } catch (err) {
      console.error("Failed to reject transfer:", err);
    }
  },

  // Chat
  chatMessages: [],
  isChatLoading: false,
  currentToolCall: null,
  sessionId: uuidv4(),
  sendMessage: async (content: string) => {
    const userMsg: ChatMessageUI = {
      id: uuidv4(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg],
      isChatLoading: true,
      currentToolCall: "Düşünüyor...",
    }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: content,
          sessionId: get().sessionId,
          stream: true,
        }),
      });

      if (!res.body) {
        throw new Error("No response body");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === "tool_call") {
              set({
                currentToolCall:
                  toolCallLabels[event.tool] || `${event.tool} çalışıyor...`,
              });
            }

            if (event.type === "done") {
              const assistantMsg: ChatMessageUI = {
                id: uuidv4(),
                role: "assistant",
                content: event.response,
                toolCalls: event.toolCalls,
                createdAt: new Date().toISOString(),
              };

              set((state) => ({
                chatMessages: [...state.chatMessages, assistantMsg],
                isChatLoading: false,
                currentToolCall: null,
                sessionId: event.sessionId || state.sessionId,
              }));

              if (event.toolCalls?.some((tc: { name: string }) => tc.name === "transfer_to_savings")) {
                get().loadPendingTransfers();
              }
            }

            if (event.type === "error") {
              const errorMsg: ChatMessageUI = {
                id: uuidv4(),
                role: "assistant",
                content: "Bir hata oluştu. Lütfen tekrar deneyin.",
                createdAt: new Date().toISOString(),
              };
              set((state) => ({
                chatMessages: [...state.chatMessages, errorMsg],
                isChatLoading: false,
                currentToolCall: null,
              }));
            }
          } catch {
            // Ignore malformed JSON lines
          }
        }
      }

      // If stream ended without a done event
      if (get().isChatLoading) {
        set({ isChatLoading: false, currentToolCall: null });
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      set({
        isChatLoading: false,
        currentToolCall: null,
      });
    }
  },

  // Init
  isInitialized: false,
  isLoading: false,
  initializeDashboard: async () => {
    if (get().isInitialized || get().isLoading) return;
    set({ isLoading: true });

    await Promise.all([
      get().loadWallets(),
      get().loadTransactions(),
      get().loadInsights(),
      get().loadPendingTransfers(),
    ]);

    set({ isInitialized: true, isLoading: false });

    // Run inference in background after initial load
    get().runInference();
  },
}));
