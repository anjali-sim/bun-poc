import { useState, useEffect } from "react";
import { API_ENDPOINTS } from "../constants";

interface Expense {
  _id?: string;
  id?: string | number;
  description: string;
  amount: number;
  category: string;
  date: string;
  userId?: number;
  created_at?: string;
  updated_at?: string;
}

interface CategoryStat {
  category?: string;
  _id: string;
  total: number;
  count: number;
}

interface DateStat {
  date: string;
  total: number;
}

interface Stats {
  total?:
    | { total: number }
    | Array<{ total: number; count: number; average: number }>;
  count?: { count: number };
  summary?: Array<{ total: number; count: number; average: number }>;
  byCategory?: CategoryStat[];
  byDate?: DateStat[];
}

export interface ExpenseContextType {
  expenses: Expense[];
  stats: Stats | null;
  loading: boolean;
  setExpenses: (expenses: Expense[]) => void;
  setStats: (stats: Stats | null) => void;
  setLoading: (loading: boolean) => void;
  fetchExpenses: () => Promise<void>;
  fetchStats: () => Promise<void>;
}

export const useExpenseContext = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_ENDPOINTS.EXPENSES.LIST);
      const json = await res.json();

      // Handle both array and object responses
      let expensesData = Array.isArray(json)
        ? json
        : json.data || json.expenses || [];

      if (!Array.isArray(expensesData)) {
        console.error("Unexpected response format:", json);
        setExpenses([]);
        return;
      }

      setExpenses(expensesData);
    } catch (error) {
      console.error("Failed to fetch expenses:", error);
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(API_ENDPOINTS.EXPENSES.STATS);
      const json = await res.json();

      // Handle MongoDB aggregation response format
      let statsData = json.data || json;

      if (statsData && !statsData.total && statsData.summary) {
        const summary = statsData.summary?.[0] || {
          total: 0,
          count: 0,
          average: 0,
        };
        statsData = {
          total: { total: summary.total || 0 },
          count: { count: summary.count || 0 },
          byCategory: statsData.byCategory || [],
          byDate: statsData.byDate || [],
        };
      }

      setStats(statsData);
    } catch (error) {
      console.error("Failed to fetch stats:", error);
      setStats(null);
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchStats();
  }, []);

  return {
    expenses,
    stats,
    loading,
    setExpenses,
    setStats,
    setLoading,
    fetchExpenses,
    fetchStats,
  };
};

export type { Expense, Stats };
