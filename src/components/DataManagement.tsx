import {
  ExportExpenses,
  ImportExpenses,
  ExportAsCSV,
  QuickBackup,
} from "./FileOperationsComponents";

export function DataManagement() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-5xl font-bold text-white mb-2">
          📋 Data Management
        </h1>
        <p className="text-gray-300">
          Export, import, and backup your expense data
        </p>
      </div>

      {/* File Operations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Export Section */}
        <div className="bg-white/10 backdrop-blur rounded-lg shadow-lg p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">📤 Export Data</h2>
          <div className="space-y-4">
            <ExportExpenses />
            <ExportAsCSV />
          </div>
        </div>

        {/* Import Section */}
        <div className="bg-white/10 backdrop-blur rounded-lg shadow-lg p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">📥 Import Data</h2>
          <div className="space-y-4">
            <ImportExpenses />
          </div>
        </div>

        {/* Backup Section */}
        <div className="bg-white/10 backdrop-blur rounded-lg shadow-lg p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">💾 Backup</h2>
          <div className="space-y-4">
            <QuickBackup />
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-white/10 backdrop-blur rounded-lg shadow-lg p-6 border border-white/20">
          <h2 className="text-xl font-bold text-white mb-4">ℹ️ About</h2>
          <div className="space-y-3 text-sm text-gray-300">
            <p>
              <strong>Export JSON:</strong> Download all your expenses in JSON
              format
            </p>
            <p>
              <strong>Export CSV:</strong> Get your data in spreadsheet format
            </p>
            <p>
              <strong>Import:</strong> Restore expenses from a JSON file
            </p>
            <p>
              <strong>Backup:</strong> Create automatic backups of your database
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
