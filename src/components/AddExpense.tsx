import { useState } from "react";
import { z } from "zod";
import { useExpenseContext } from "../hooks/useExpenseContext";
import { Link, useNavigate } from "react-router-dom";
import {
  CATEGORY_LIST,
  getCategoryEmoji,
  EXPENSE_CONSTRAINTS,
  FORM_MESSAGES,
  API_ENDPOINTS,
  API_CONFIG,
} from "../constants";
import {
  expenseFormSchema,
  type ExpenseFormData,
  type FormErrors,
} from "../schemas";

export function AddExpense() {
  const { fetchExpenses, fetchStats } = useExpenseContext();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Food",
    date: new Date().toISOString().split("T")[0],
  });

  const [validationErrors, setValidationErrors] = useState<FormErrors>({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setValidationErrors({});

    try {
      // Validate form data using Zod
      const validatedData = expenseFormSchema.parse({
        description: formData.description,
        amount: formData.amount,
        category: formData.category,
        date: formData.date,
      });

      setLoading(true);
      const res = await fetch(API_ENDPOINTS.EXPENSES.CREATE, {
        method: "POST",
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify({
          description: validatedData.description,
          amount: validatedData.amount,
          category: validatedData.category,
          date: validatedData.date,
        }),
      });

      if (res.ok) {
        setSuccess("✅ Expense added successfully!");
        setFormData({
          description: "",
          amount: "",
          category: "Food",
          date: new Date().toISOString().split("T")[0],
        });

        // Refresh data
        await fetchExpenses();
        await fetchStats();

        // Redirect to dashboard after 1.5 seconds
        setTimeout(() => {
          navigate("/");
        }, EXPENSE_CONSTRAINTS.REDIRECT_DELAY_MS);
      } else {
        setError(FORM_MESSAGES.ERRORS.ADD_EXPENSE_FAILED);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Extract field-specific errors from Zod
        const fieldErrors: FormErrors = {};
        error.issues.forEach((issue) => {
          const path = issue.path[0] as keyof ExpenseFormData;
          fieldErrors[path] = issue.message;
        });
        setValidationErrors(fieldErrors);

        // Also show the first error as a general error message
        const firstError = error.issues[0];
        if (firstError) {
          setError(`${String(firstError.path[0])}: ${firstError.message}`);
        }
      } else {
        setError("Failed to add expense: " + String(error));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="text-indigo-400 hover:text-indigo-300 font-semibold mb-4 flex items-center gap-2"
        >
          ← Back to Dashboard
        </Link>
        <h1 className="text-4xl font-bold text-white mb-2">
          ➕ Add New Expense
        </h1>
        <p className="text-gray-300">
          Track a new expense and keep your budget in check
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white/10 backdrop-blur rounded-lg shadow-xl p-8 border-2 border-indigo-400/50">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Description <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="e.g., Coffee at Starbucks, Grocery shopping..."
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-white text-gray-900 placeholder-gray-500 ${
                validationErrors.description
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-indigo-500"
              }`}
            />
            {validationErrors.description && (
              <p className="text-red-400 text-sm mt-1">
                {validationErrors.description}
              </p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Amount (₹) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="0.00"
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-white text-gray-900 placeholder-gray-500 ${
                validationErrors.amount
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-indigo-500"
              }`}
            />
            {validationErrors.amount && (
              <p className="text-red-400 text-sm mt-1">
                {validationErrors.amount}
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-white text-gray-900 font-medium ${
                validationErrors.category
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-indigo-500"
              }`}
            >
              {CATEGORY_LIST.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryEmoji(cat)} {cat}
                </option>
              ))}
            </select>
            {validationErrors.category && (
              <p className="text-red-400 text-sm mt-1">
                {validationErrors.category}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-semibold text-gray-300 mb-3">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) =>
                setFormData({ ...formData, date: e.target.value })
              }
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 bg-white text-gray-900 ${
                validationErrors.date
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-indigo-500"
              }`}
            />
            {validationErrors.date && (
              <p className="text-red-400 text-sm mt-1">
                {validationErrors.date}
              </p>
            )}
          </div>

          {/* Messages */}
          {error && (
            <div className="bg-red-500/20 border border-red-500/50 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/20 border border-green-500/50 text-green-300 px-4 py-3 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-linear-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? FORM_MESSAGES.LOADING.ADDING
                : FORM_MESSAGES.LOADING.ADD_BUTTON}
            </button>
            <Link
              to="/"
              className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-sm text-blue-200">{FORM_MESSAGES.INFO.TIP}</p>
      </div>
    </div>
  );
}
