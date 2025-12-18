import { useState, useEffect } from "react";
import { z } from "zod";
import { useExpenseContext } from "../hooks/useExpenseContext";
import {
  CATEGORY_LIST,
  getCategoryEmoji,
  FORM_MESSAGES,
  API_ENDPOINTS,
  API_CONFIG,
} from "../constants";
import {
  expenseFormSchema,
  type ExpenseFormData,
  type FormErrors,
} from "../schemas";

interface Expense {
  _id?: string;
  id?: string | number;
  description: string;
  amount: number;
  category: string;
  date: string;
}

interface EditExpenseModalProps {
  isOpen: boolean;
  expenseId?: string | number;
  onClose: () => void;
  onSuccess?: () => void;
}

export function EditExpenseModal({
  isOpen,
  expenseId,
  onClose,
  onSuccess,
}: EditExpenseModalProps) {
  const { fetchExpenses, fetchStats } = useExpenseContext();

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
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Fetch expense details when modal opens
  useEffect(() => {
    if (isOpen && expenseId) {
      fetchExpenseDetails();
    }
  }, [isOpen, expenseId]);

  const fetchExpenseDetails = async () => {
    try {
      setIsLoadingDetails(true);
      setError("");
      const res = await fetch(API_ENDPOINTS.EXPENSES.LIST);
      const json = await res.json();

      let expensesData = Array.isArray(json)
        ? json
        : json.data || json.expenses || [];

      const expense = expensesData.find(
        (e: Expense) => String(e._id || e.id) === String(expenseId)
      );

      if (expense) {
        setFormData({
          description: expense.description,
          amount: expense.amount.toString(),
          category: expense.category,
          date: expense.date,
        });
      } else {
        setError("Expense not found");
      }
    } catch (err) {
      setError("Failed to load expense details");
      console.error(err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

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
      const endpoint = API_ENDPOINTS.EXPENSES.UPDATE(String(expenseId));
      console.log("Updating expense at:", endpoint);

      const res = await fetch(endpoint, {
        method: "PUT",
        headers: API_CONFIG.DEFAULT_HEADERS,
        body: JSON.stringify({
          description: validatedData.description,
          amount: validatedData.amount,
          category: validatedData.category,
          date: validatedData.date,
        }),
      });

      const responseData = await res.json();
      console.log("Response:", res.status, responseData);

      if (res.ok) {
        setSuccess("✅ Expense updated successfully!");

        await fetchExpenses();
        await fetchStats();

        setTimeout(() => {
          onSuccess?.();
          onClose();
          setSuccess("");
        }, 1500);
      } else {
        const errorMessage =
          responseData?.message ||
          responseData?.error ||
          FORM_MESSAGES.ERRORS.ADD_EXPENSE_FAILED;
        setError(errorMessage);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: FormErrors = {};
        error.issues.forEach((issue) => {
          const path = issue.path[0] as keyof ExpenseFormData;
          fieldErrors[path] = issue.message;
        });
        setValidationErrors(fieldErrors);

        const firstError = error.issues[0];
        if (firstError) {
          setError(`${String(firstError.path[0])}: ${firstError.message}`);
        }
      } else {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        setError("Failed to update expense: " + errorMessage);
        console.error("Update error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      description: "",
      amount: "",
      category: "Food",
      date: new Date().toISOString().split("T")[0],
    });
    setValidationErrors({});
    setError("");
    setSuccess("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      {/* Modal Card */}
      <div className="bg-white/10 backdrop-blur rounded-lg shadow-2xl p-8 border border-white/20 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto animate-in">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              ✏️ Edit Expense
            </h2>
            <p className="text-gray-300 text-sm mt-1">
              Update the details of your expense
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {isLoadingDetails ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-300">Loading expense details...</div>
          </div>
        ) : (
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
                className="flex-1 px-6 py-3 bg-linear-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Updating..." : "✏️ Update Expense"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
