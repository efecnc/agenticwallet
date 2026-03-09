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
import QuickActions from "@/components/dashboard/QuickActions";
import BudgetTracker from "@/components/dashboard/BudgetTracker";
import ChatPanel from "@/components/chat/ChatPanel";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import { MessageCircle, LayoutDashboard } from "lucide-react";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

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
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <LoadingSpinner size="lg" />
        <p className="text-slate-400 text-sm">Dashboard yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-teal to-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            P
          </div>
          <span className="text-lg font-bold tracking-tight">Parafin</span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400 hidden sm:block">
            {format(new Date(), "d MMMM yyyy", { locale: tr })}
          </span>
          <div className="w-8 h-8 rounded-full bg-brand-teal/20 flex items-center justify-center text-brand-teal text-sm font-bold">
            E
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Dashboard panel */}
        <div
          className={`flex-1 overflow-y-auto scrollbar-thin p-6 ${
            mobileTab === "chat" ? "hidden lg:block" : ""
          } lg:w-[60%]`}
        >
          <div className="max-w-2xl mx-auto space-y-6">
            <WalletCard />
            <QuickActions />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <HealthScore />
              <WeeklySummary />
            </div>
            <SavingsGoals />
            <ProactiveAlerts />
            <PendingTransfers />
            <BudgetTracker />
            <SpendingTrends />
            <RecurringPayments />
            <TransactionList />
            <SpendingChart />
          </div>
        </div>

        {/* Chat panel */}
        <div
          className={`lg:w-[40%] lg:border-l border-white/10 ${
            mobileTab === "dashboard" ? "hidden lg:flex" : "flex"
          } flex-col w-full`}
        >
          <ChatPanel />
        </div>
      </div>

      {/* Mobile tab bar */}
      <div className="lg:hidden flex border-t border-white/10">
        <button
          onClick={() => setMobileTab("dashboard")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            mobileTab === "dashboard"
              ? "text-brand-teal bg-brand-teal/10"
              : "text-slate-400"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          Panel
        </button>
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            mobileTab === "chat"
              ? "text-brand-teal bg-brand-teal/10"
              : "text-slate-400"
          }`}
        >
          <MessageCircle className="w-5 h-5" />
          Sohbet
        </button>
      </div>
    </div>
  );
}
