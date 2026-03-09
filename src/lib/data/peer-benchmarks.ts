// Istanbul Gen Z (25-30) average monthly spending benchmarks in TRY
export interface PeerBenchmark {
  category: string;
  label: string;
  averageMonthly: number; // TRY
}

export const peerBenchmarks: PeerBenchmark[] = [
  { category: "rent", label: "Kira", averageMonthly: 9500 },
  { category: "groceries", label: "Market", averageMonthly: 4200 },
  { category: "transport", label: "Ulaşım", averageMonthly: 1800 },
  { category: "dining", label: "Yemek", averageMonthly: 3500 },
  { category: "coffee", label: "Kahve", averageMonthly: 1200 },
  { category: "subscription", label: "Abonelik", averageMonthly: 900 },
  { category: "shopping", label: "Alışveriş", averageMonthly: 2500 },
  { category: "utilities", label: "Faturalar", averageMonthly: 1300 },
];
