"use client";

import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app-store";
import WalletCard from "@/components/dashboard/WalletCard";
import SavingsGoals from "@/components/dashboard/SavingsGoals";
import ProactiveAlerts from "@/components/dashboard/ProactiveAlerts";
import PendingTransfers from "@/components/dashboard/PendingTransfers";
import TransactionList from "@/components/dashboard/TransactionList";
import SpendingChart from "@/components/dashboard/SpendingChart";
import HealthScore from "@/components/dashboard/HealthScore";
import WeeklySummary from "@/components/dashboard/WeeklySummary";
import SpendingTrends from "@/components/dashboard/SpendingTrends";
import RecurringPayments from "@/components/dashboard/RecurringPayments";
import BudgetTracker from "@/components/dashboard/BudgetTracker";
import TaksitTracker from "@/components/dashboard/TaksitTracker";
import SavingsStreaks from "@/components/dashboard/SavingsStreaks";
import ChatPanel from "@/components/chat/ChatPanel";
import { MessageCircle, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const initializeDashboard = useAppStore((s) => s.initializeDashboard);
  const isInitialized = useAppStore((s) => s.isInitialized);
  const isLoading = useAppStore((s) => s.isLoading);
  const [mobileTab, setMobileTab] = useState<"dashboard" | "chat">("dashboard");

  useEffect(() => {
    initializeDashboard();
  }, [initializeDashboard]);

  if (isLoading && !isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Parafin yükleniyor">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <span className="text-xl font-bold text-white">P</span>
          </div>
          <div className="flex gap-1 mt-1" aria-hidden="true">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-brand-dark overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {/* Dashboard */}
        <main
          className={`flex-1 overflow-y-auto scrollbar-thin ${
            mobileTab === "chat" ? "hidden lg:block" : ""
          } lg:w-[58%]`}
          aria-label="Finansal özet"
        >
          <div className="max-w-xl mx-auto px-4 pt-6 pb-20 lg:pb-6 space-y-3">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-between mb-2"
            >
              <div>
                <p className="text-emerald-300/40 text-xs font-medium">Merhaba, Efe</p>
                <h1 className="text-xl font-extrabold tracking-tight -mt-0.5">Dashboard</h1>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 flex items-center justify-center border border-emerald-500/[0.12]">
                <span className="text-emerald-400 text-sm font-bold">E</span>
              </div>
            </motion.div>

            <WalletCard />

            <div className="grid grid-cols-2 gap-3">
              <HealthScore />
              <WeeklySummary />
            </div>

            <SpendingTrends />
            <ProactiveAlerts />
            <PendingTransfers />
            <SavingsGoals />
            <SavingsStreaks />
            <BudgetTracker />
            <TaksitTracker />
            <TransactionList />
            <RecurringPayments />
            <SpendingChart />
          </div>
        </main>

        {/* Chat */}
        <aside
          className={`lg:w-[42%] lg:border-l border-emerald-500/[0.06] ${
            mobileTab === "dashboard" ? "hidden lg:flex" : "flex"
          } flex-col w-full`}
          aria-label="Parafin sohbet"
        >
          <ChatPanel />
        </aside>
      </div>

      {/* Mobile tab — floating pill */}
      <nav className="lg:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50" aria-label="Mobil navigasyon">
        <div className="flex bg-brand-dark/90 backdrop-blur-xl rounded-2xl border border-emerald-500/[0.12] shadow-2xl shadow-emerald-900/30 p-1" role="tablist">
          <button
            onClick={() => setMobileTab("dashboard")}
            role="tab"
            aria-selected={mobileTab === "dashboard"}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all focus-ring ${
              mobileTab === "dashboard"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "text-slate-500"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" aria-hidden="true" />
            Özet
          </button>
          <button
            onClick={() => setMobileTab("chat")}
            role="tab"
            aria-selected={mobileTab === "chat"}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all focus-ring ${
              mobileTab === "chat"
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "text-slate-500"
            }`}
          >
            <MessageCircle className="w-4 h-4" aria-hidden="true" />
            Parafin
          </button>
        </div>
      </nav>
    </div>
  );
}
