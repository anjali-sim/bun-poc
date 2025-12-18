interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  expenseDescription?: string;
  expenseAmount?: number;
}

export function DeleteConfirmationModal({
  isOpen,
  title = "Delete Expense",
  message = "Are you sure you want to delete this expense?",
  onConfirm,
  onCancel,
  isLoading = false,
  expenseDescription,
  expenseAmount,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      {/* Modal Card */}
      <div className="bg-white/10 backdrop-blur rounded-lg shadow-2xl p-6 border border-white/20 max-w-sm mx-4 animate-in">
        {/* Header */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-2xl">⚠️</span> {title}
          </h2>
        </div>

        {/* Message */}
        <p className="text-gray-300 mb-4">{message}</p>

        {/* Expense Details */}
        {expenseDescription && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-200">
              <span className="font-semibold">Description:</span>{" "}
              {expenseDescription}
            </p>
            {expenseAmount && (
              <p className="text-sm text-red-200 mt-1">
                <span className="font-semibold">Amount:</span> ₹
                {expenseAmount.toFixed(2)}
              </p>
            )}
          </div>
        )}

        {/* Warning */}
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
          <p className="text-xs text-yellow-200">
            This action cannot be undone. Please confirm before proceeding.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg border border-white/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <span className="animate-spin">⏳</span> Deleting...
              </>
            ) : (
              <>🗑️ Yes, Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
