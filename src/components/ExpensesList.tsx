import { useState } from "react";
import { useExpenseContext } from "../hooks/useExpenseContext";
import { Link } from "react-router-dom";
import { API_ENDPOINTS } from "../constants";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";
import { EditExpenseModal } from "./EditExpense";

type SortField = "date" | "amount" | "category";
type SortOrder = "asc" | "desc";

export function ExpensesList() {
  const { expenses, fetchExpenses, fetchStats, loading } = useExpenseContext();

  const [sortField, setSortField] = useState<SortField>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    expenseId: null as string | number | null,
    expenseDescription: "",
    expenseAmount: 0,
  });
  const [editModal, setEditModal] = useState({
    isOpen: false,
    expenseId: null as string | number | null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const categories = Array.from(
    new Set(expenses.map((e) => e.category))
  ).sort();

  // Filter and sort expenses
  const filteredExpenses = expenses
    .filter((expense) => {
      if (filterCategory !== "all" && expense.category !== filterCategory)
        return false;
      if (
        searchTerm &&
        !expense.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
        return false;
      return true;
    })
    .sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;

      if (sortField === "amount") {
        aVal = parseFloat(a.amount.toString());
        bVal = parseFloat(b.amount.toString());
      } else if (sortField === "date") {
        aVal = a.date;
        bVal = b.date;
      } else {
        aVal = a.category;
        bVal = b.category;
      }

      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === "asc" ? comparison : -comparison;
    });

  const openDeleteModal = (
    id: string | number | undefined,
    description: string,
    amount: number
  ) => {
    setDeleteModal({
      isOpen: true,
      expenseId: id || null,
      expenseDescription: description,
      expenseAmount: amount,
    });
  };

  const closeDeleteModal = () => {
    setDeleteModal({
      isOpen: false,
      expenseId: null,
      expenseDescription: "",
      expenseAmount: 0,
    });
  };

  const openEditModal = (id: string | number | undefined) => {
    setEditModal({
      isOpen: true,
      expenseId: id || null,
    });
  };

  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      expenseId: null,
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.expenseId) return;

    try {
      setIsDeleting(true);
      const res = await fetch(
        API_ENDPOINTS.EXPENSES.DELETE(String(deleteModal.expenseId)),
        { method: "DELETE" }
      );
      if (res.ok) {
        await fetchExpenses();
        await fetchStats();
        closeDeleteModal();
      } else {
        console.error("Failed to delete expense");
      }
    } catch (error) {
      console.error("Failed to delete expense:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
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
        <h1 className="text-4xl font-bold text-white mb-2">📋 All Expenses</h1>
        <p className="text-gray-300">
          {filteredExpenses.length} expense
          {filteredExpenses.length !== 1 ? "s" : ""} found
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white/10 backdrop-blur rounded-lg shadow-lg p-6 border border-white/20 mb-6 space-y-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Search by Description
          </label>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search expenses..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
          />
        </div>

        {/* Filter */}
        <div>
          <label className="block text-sm font-semibold text-gray-300 mb-2">
            Filter by Category
          </label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white text-gray-900"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/10 backdrop-blur rounded-lg shadow-xl overflow-hidden border border-white/20">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-gray-300">
              Loading expenses...
            </div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <p className="text-lg mb-4">No expenses found</p>
              <Link
                to="/add-expense"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors inline-block"
              >
                Add Your First Expense
              </Link>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/20">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => toggleSort("date")}
                      className="flex items-center gap-2 font-semibold text-gray-300 hover:text-white"
                    >
                      Date {getSortIndicator(sortField, "date", sortOrder)}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-300">
                    Category
                  </th>
                  <th className="px-6 py-3 text-right">
                    <button
                      onClick={() => toggleSort("amount")}
                      className="flex items-center gap-2 font-semibold text-gray-300 hover:text-white ml-auto"
                    >
                      Amount {getSortIndicator(sortField, "amount", sortOrder)}
                    </button>
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-300">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map((expense) => (
                  <tr
                    key={expense._id || expense.id}
                    className="border-b border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-6 py-4 text-gray-300 whitespace-nowrap">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-gray-300">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getCategoryColor(
                          expense.category
                        )}`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-semibold text-gray-300">
                      ₹{expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() =>
                            openEditModal(expense._id || expense.id)
                          }
                          className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded hover:bg-blue-500/40 transition-colors text-sm font-semibold border border-blue-500/30"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() =>
                            openDeleteModal(
                              expense._id || expense.id,
                              expense.description,
                              expense.amount
                            )
                          }
                          className="px-3 py-1 bg-red-500/20 text-red-300 rounded hover:bg-red-500/40 transition-colors text-sm font-semibold border border-red-500/30"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Summary */}
      {filteredExpenses.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
            <p className="text-gray-400 text-sm mb-2">Total Filtered</p>
            <p className="text-2xl font-bold text-white">
              ₹
              {filteredExpenses
                .reduce((sum, e) => sum + e.amount, 0)
                .toFixed(2)}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
            <p className="text-gray-400 text-sm mb-2">Count</p>
            <p className="text-2xl font-bold text-white">
              {filteredExpenses.length}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-4 border border-white/20">
            <p className="text-gray-400 text-sm mb-2">Average</p>
            <p className="text-2xl font-bold text-white">
              ₹
              {(
                filteredExpenses.reduce((sum, e) => sum + e.amount, 0) /
                filteredExpenses.length
              ).toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Expense"
        message="Are you sure you want to delete this expense? This action cannot be undone."
        expenseDescription={deleteModal.expenseDescription}
        expenseAmount={deleteModal.expenseAmount}
        onConfirm={confirmDelete}
        onCancel={closeDeleteModal}
        isLoading={isDeleting}
      />

      {/* Edit Expense Modal */}
      <EditExpenseModal
        isOpen={editModal.isOpen}
        expenseId={editModal.expenseId || undefined}
        onClose={closeEditModal}
        onSuccess={() => {
          // Refresh data when edit is successful
          fetchExpenses();
          fetchStats();
        }}
      />
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colors: Record<string, string> = {
    Food: "bg-orange-100 text-orange-800",
    Transport: "bg-blue-100 text-blue-800",
    Entertainment: "bg-purple-100 text-purple-800",
    Utilities: "bg-yellow-100 text-yellow-800",
    Shopping: "bg-pink-100 text-pink-800",
    Health: "bg-green-100 text-green-800",
    Other: "bg-gray-100 text-gray-800",
  };
  return colors[category] || "bg-gray-100 text-gray-800";
}

function getSortIndicator(
  field: SortField,
  target: SortField,
  order: SortOrder
): string {
  if (field !== target) return "↕️";
  return order === "asc" ? "↑" : "↓";
}
