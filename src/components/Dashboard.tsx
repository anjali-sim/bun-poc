import { useExpenseContext } from "../hooks/useExpenseContext";
import { BarChart, PieChart } from "./Charts";
import { Link } from "react-router-dom";

interface CategoryStat {
  category?: string;
  _id?: string;
  total: number;
}

export function Dashboard() {
  const { stats } = useExpenseContext();

  if (!stats) {
    return (
      <div className="p-8 text-center text-gray-300">Loading dashboard...</div>
    );
  }

  const chartData =
    stats.byCategory?.map((cat: CategoryStat) => ({
      label: cat.category || cat._id || "Unknown",
      value: cat.total || 0,
      color: getCategoryChartColor(cat.category || cat._id || "Other"),
    })) || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-white mb-2">
          💰 Expense Dashboard
        </h1>
        <p className="text-gray-300">
          Track and analyze your spending patterns
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 border border-blue-400">
          <p className="text-blue-100 text-sm font-semibold mb-2">
            TOTAL EXPENSES
          </p>
          <p className="text-4xl font-bold text-white">
            ₹
            {(Array.isArray(stats.total)
              ? stats.total[0]?.total ?? 0
              : stats.total?.total ?? 0
            ).toFixed(2)}
          </p>
          <p className="text-blue-100 text-xs mt-2">Across all categories</p>
        </div>

        <div className="bg-linear-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 border border-green-400">
          <p className="text-green-100 text-sm font-semibold mb-2">
            TOTAL TRANSACTIONS
          </p>
          <p className="text-4xl font-bold text-white">
            {Array.isArray(stats.total)
              ? stats.total[0]?.count ?? 0
              : stats.count?.count ?? 0}
          </p>
          <p className="text-green-100 text-xs mt-2">Number of expenses</p>
        </div>

        <div className="bg-linear-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 border border-purple-400">
          <p className="text-purple-100 text-sm font-semibold mb-2">
            AVERAGE EXPENSE
          </p>
          <p className="text-4xl font-bold text-white">
            ₹
            {(() => {
              const total = Array.isArray(stats.total)
                ? stats.total[0]?.total ?? 0
                : stats.total?.total ?? 0;
              const count = Array.isArray(stats.total)
                ? stats.total[0]?.count ?? 1
                : stats.count?.count ?? 1;
              return (total / count).toFixed(2);
            })()}
          </p>
          <p className="text-purple-100 text-xs mt-2">Per transaction</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {chartData && chartData.length > 0 ? (
          <>
            <BarChart
              data={chartData}
              title="Spending by Category (Bar Chart)"
            />
            <PieChart
              data={chartData}
              title="Category Distribution (Pie Chart)"
            />
          </>
        ) : (
          <div className="col-span-2 bg-white/10 backdrop-blur rounded-lg shadow-lg p-8 border border-white/20 text-center">
            <p className="text-gray-300 text-lg">
              No data to display. Add some expenses to see charts!
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          to="/add-expense"
          className="bg-linear-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-4 rounded-lg shadow-lg transition-all text-center"
        >
          ➕ Add New Expense
        </Link>
        <Link
          to="/categories"
          className="bg-linear-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold py-4 rounded-lg shadow-lg transition-all text-center"
        >
          🏷️ Manage Categories
        </Link>
      </div>
    </div>
  );
}

function getCategoryChartColor(category: string): string {
  const colors: Record<string, string> = {
    Food: "#f97316",
    Transport: "#3b82f6",
    Entertainment: "#a855f7",
    Utilities: "#eab308",
    Shopping: "#ec4899",
    Health: "#10b981",
    Other: "#6b7280",
  };
  return colors[category] || "#6b7280";
}
