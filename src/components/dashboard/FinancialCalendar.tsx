"use client";

import { useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Receipt,
  Gift,
  Wallet,
  CreditCard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { tr } from "date-fns/locale";

interface CalendarEvent {
  date: string;
  title: string;
  type: "bill" | "subscription" | "installment" | "birthday" | "payday";
  amount?: number;
  merchant?: string;
  icon_hint: "receipt" | "gift" | "wallet" | "credit-card" | "calendar";
}

interface CalendarData {
  events: CalendarEvent[];
  total_upcoming_bills: number;
  next_payday: string | null;
}

const typeColors: Record<string, { dot: string; bg: string; text: string; border: string }> = {
  bill: { dot: "bg-violet-400", bg: "bg-violet-500/10", text: "text-violet-400", border: "border-violet-500/20" },
  subscription: { dot: "bg-purple-400", bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  installment: { dot: "bg-cyan-400", bg: "bg-cyan-500/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  birthday: { dot: "bg-pink-400", bg: "bg-pink-500/10", text: "text-pink-400", border: "border-pink-500/20" },
  payday: { dot: "bg-emerald-400", bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
};

const iconMap: Record<string, typeof Receipt> = {
  receipt: Receipt,
  gift: Gift,
  wallet: Wallet,
  "credit-card": CreditCard,
  calendar: Calendar,
};

const DAY_LABELS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

export default function FinancialCalendar() {
  const [data, setData] = useState<CalendarData | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await fetch("/api/calendar-events");
        const json = await res.json();
        if (json.events) {
          setData(json);
        }
      } catch {
        // silently fail
      }
    };
    fetchEvents();
  }, []);

  // Build event map keyed by date string
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    if (!data) return map;
    for (const event of data.events) {
      if (!map[event.date]) map[event.date] = [];
      map[event.date].push(event);
    }
    return map;
  }, [data]);

  // Generate calendar grid days
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days: Date[] = [];
    let day = calStart;
    while (day <= calEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  // Get events for selected date
  const selectedEvents = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return eventsByDate[key] || [];
  }, [selectedDate, eventsByDate]);

  if (!data || data.events.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card p-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Finansal Takvim
          </h2>
        </div>
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-slate-400" />
        </button>
        <span className="text-sm font-semibold text-slate-300">
          {format(currentMonth, "MMMM yyyy", { locale: tr })}
        </span>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="w-7 h-7 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-semibold text-slate-600 py-1"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDate[dateKey] || [];
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const today = isToday(day);
          const isSelected = selectedDate && isSameDay(day, selectedDate);

          // Get unique event types for dots (max 3)
          const uniqueTypes = [...new Set(dayEvents.map((e) => e.type))].slice(0, 3);

          return (
            <button
              key={dateKey}
              onClick={() => {
                if (dayEvents.length > 0) {
                  setSelectedDate(isSelected ? null : day);
                }
              }}
              className={`
                relative flex flex-col items-center py-1.5 rounded-lg transition-all min-h-[40px]
                ${!inCurrentMonth ? "opacity-25" : ""}
                ${today ? "bg-blue-500/10" : ""}
                ${isSelected ? "bg-white/[0.08] ring-1 ring-blue-400/40" : ""}
                ${dayEvents.length > 0 && inCurrentMonth ? "hover:bg-white/[0.06] cursor-pointer" : "cursor-default"}
              `}
            >
              <span
                className={`text-[11px] font-medium tabular-nums leading-none ${
                  today
                    ? "text-blue-400 font-bold"
                    : inCurrentMonth
                    ? "text-slate-300"
                    : "text-slate-600"
                }`}
              >
                {format(day, "d")}
              </span>

              {/* Event dots */}
              {uniqueTypes.length > 0 && inCurrentMonth && (
                <div className="flex gap-[3px] mt-1">
                  {uniqueTypes.map((type) => (
                    <div
                      key={type}
                      className={`w-[5px] h-[5px] rounded-full ${
                        typeColors[type]?.dot || "bg-slate-500"
                      }`}
                    />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-3 pt-3 border-t border-white/[0.06]">
        {[
          { type: "bill", label: "Fatura" },
          { type: "subscription", label: "Abonelik" },
          { type: "installment", label: "Taksit" },
          { type: "payday", label: "Maaş" },
          { type: "birthday", label: "Doğum Günü" },
        ].map(({ type, label }) => (
          <div key={type} className="flex items-center gap-1">
            <div
              className={`w-[6px] h-[6px] rounded-full ${
                typeColors[type]?.dot || "bg-slate-500"
              }`}
            />
            <span className="text-[9px] text-slate-500">{label}</span>
          </div>
        ))}
      </div>

      {/* Selected date events */}
      <AnimatePresence>
        {selectedDate && selectedEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-white/[0.06]">
              <div className="text-[11px] font-semibold text-slate-400 mb-2">
                {format(selectedDate, "d MMMM, EEEE", { locale: tr })}
              </div>
              <div className="space-y-1.5">
                {selectedEvents.map((event, idx) => {
                  const colors = typeColors[event.type] || typeColors.bill;
                  const Icon = iconMap[event.icon_hint] || Calendar;

                  return (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${colors.bg} border ${colors.border}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${colors.text} flex-shrink-0`} />
                      <span className="text-sm font-medium flex-1 truncate">
                        {event.title}
                      </span>
                      {event.amount != null && (
                        <span
                          className={`text-xs font-semibold tabular-nums ${
                            event.type === "payday" ? "text-emerald-400" : colors.text
                          }`}
                        >
                          {event.type === "payday" ? "+" : ""}₺
                          {event.amount.toLocaleString("tr-TR", {
                            minimumFractionDigits: 0,
                          })}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Total upcoming bills footer */}
      {data.total_upcoming_bills > 0 && !selectedDate && (
        <div className="mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[11px] text-slate-500">Yaklaşan toplam fatura</span>
          <span className="text-sm font-bold text-slate-300 tabular-nums">
            ₺{data.total_upcoming_bills.toLocaleString("tr-TR", {
              minimumFractionDigits: 0,
            })}
          </span>
        </div>
      )}
    </motion.div>
  );
}
