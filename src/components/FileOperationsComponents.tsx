import { useRef } from "react";
import { useFileOperations } from "../hooks/useFileOperations";

// Export expenses
export function ExportExpenses() {
  const { loading, error, success, exportJSON } = useFileOperations();

  return (
    <div className="space-y-2">
      <button
        onClick={() => exportJSON()}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-4 py-2 rounded text-white transition-all"
      >
        {loading ? "⏳ Exporting..." : "📥 Export Expenses (JSON)"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}
    </div>
  );
}

// Import expenses
export function ImportExpenses() {
  const { loading, error, success, importFile } = useFileOperations();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await importFile(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="space-y-2">
      <label className="block">
        <span className="text-sm font-medium mb-1 block">
          📂 Import Expenses (JSON)
        </span>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          disabled={loading}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-green-600 file:text-white hover:file:bg-green-700"
        />
      </label>
      {loading && <p className="text-blue-500 text-sm">📤 Importing...</p>}
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}
    </div>
  );
}

// Export as CSV
export function ExportAsCSV() {
  const { loading, error, success, exportCSV } = useFileOperations();

  return (
    <div className="space-y-2">
      <button
        onClick={() => exportCSV()}
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 px-4 py-2 rounded text-white transition-all"
      >
        {loading ? "⏳ Exporting..." : "� Export as CSV"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}
    </div>
  );
}

// Quick backup
export function QuickBackup() {
  const { loading, error, success, createBackup } = useFileOperations();

  return (
    <div className="space-y-2">
      <button
        onClick={createBackup}
        disabled={loading}
        className="w-full bg-orange-600 hover:bg-orange-700 disabled:opacity-50 px-4 py-2 rounded text-white transition-all"
      >
        {loading ? "⏳ Creating..." : "� Create Backup"}
      </button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      {success && <p className="text-green-500 text-sm">{success}</p>}
    </div>
  );
}
