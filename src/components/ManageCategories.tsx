import { useState } from "react";
import { useExpenseContext } from "../hooks/useExpenseContext";
import { Link } from "react-router-dom";
import { DEFAULT_CATEGORIES } from "../constants";

export function ManageCategories() {
  const { stats } = useExpenseContext();

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get all categories from stats, enriched with default info
  const allCategories =
    stats?.byCategory
      ?.map((cat) => {
        const defaultCat = DEFAULT_CATEGORIES.find((dc) => dc.name === cat._id);
        return {
          name: cat._id,
          emoji: defaultCat?.emoji || "📦",
          description: defaultCat?.description || "Custom category",
          total: cat.total,
          count: cat.count,
        };
      })
      .sort((a, b) => b.total - a.total) || [];

  const getCategoryStats = (categoryName: string) => {
    return allCategories.find((c) => c.name === categoryName);
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="text-indigo-400 hover:text-indigo-300 font-semibold mb-4 flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          🏷️ Manage Categories
        </h1>
        <p className="text-gray-300">
          View category statistics and manage your expense categories
        </p>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {allCategories.map((cat) => {
          const isActive = selectedCategory === cat.name;

          return (
            <div
              key={cat.name}
              onClick={() => setSelectedCategory(isActive ? null : cat.name)}
              className={`
                rounded-lg shadow-lg p-6 border-2 transition-all cursor-pointer
                ${
                  isActive
                    ? "bg-white/20 border-indigo-400 scale-105"
                    : "bg-white/10 border-white/20 hover:bg-white/15"
                }
              `}
            >
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{cat.emoji}</span>
                <div>
                  <h3 className="text-lg font-bold text-white">{cat.name}</h3>
                  <p className="text-xs text-gray-400">{cat.description}</p>
                </div>
              </div>

              {/* Stats */}
              <div className="space-y-2 border-t border-white/20 pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Spending</span>
                  <span className="text-white font-semibold">
                    ₹{cat.total.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Transactions</span>
                  <span className="text-white font-semibold">{cat.count}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg. per Transaction</span>
                  <span className="text-white font-semibold">
                    ₹{(cat.total / cat.count).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Panel */}
      {selectedCategory && (
        <div className="mt-8 bg-white/10 backdrop-blur rounded-lg shadow-xl p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <span className="text-5xl">
                {allCategories.find((c) => c.name === selectedCategory)?.emoji}
              </span>
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {selectedCategory} Details
                </h2>
                <p className="text-gray-400">
                  {
                    allCategories.find((c) => c.name === selectedCategory)
                      ?.description
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Category Statistics */}
          {getCategoryStats(selectedCategory) ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded p-4">
                <p className="text-gray-400 text-sm mb-2">Total Spending</p>
                <p className="text-3xl font-bold text-white">
                  ₹{getCategoryStats(selectedCategory)?.total.toFixed(2)}
                </p>
              </div>
              <div className="bg-white/5 rounded p-4">
                <p className="text-gray-400 text-sm mb-2">Transactions</p>
                <p className="text-3xl font-bold text-white">
                  {getCategoryStats(selectedCategory)?.count}
                </p>
              </div>
              <div className="bg-white/5 rounded p-4">
                <p className="text-gray-400 text-sm mb-2">
                  Average per Transaction
                </p>
                <p className="text-3xl font-bold text-white">
                  ₹
                  {(
                    (getCategoryStats(selectedCategory)?.total || 0) /
                    (getCategoryStats(selectedCategory)?.count || 1)
                  ).toFixed(2)}
                </p>
              </div>
              <div className="bg-white/5 rounded p-4">
                <p className="text-gray-400 text-sm mb-2">
                  % of Total Spending
                </p>
                <p className="text-3xl font-bold text-white">
                  {(
                    ((getCategoryStats(selectedCategory)?.total || 0) /
                      (stats?.summary?.[0]?.total || 1)) *
                    100
                  ).toFixed(1)}
                  %
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-400 text-lg">
                No expenses in this category yet.
              </p>
              <Link
                to="/add-expense"
                className="mt-4 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors inline-block"
              >
                Add Expense to {selectedCategory}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="mt-8 bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
        <p className="text-sm text-cyan-200">
          💡 <strong>Tip:</strong> Click on any category to see detailed
          statistics and insights about your spending in that category.
        </p>
      </div>
    </div>
  );
}
