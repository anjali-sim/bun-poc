/**
 * File I/O Service using Bun File Operations
 */

import { Database } from "bun:sqlite";
import { existsSync, mkdirSync } from "fs";
import { mkdir } from "fs/promises";

interface ExpenseRecord {
  id?: string | number;
  description: string;
  amount: number;
  category: string;
  date: string;
  created_at?: string;
}

interface SummaryCategoryData {
  total: number;
  count: number;
  items: Array<{ description: string; amount: number; date: string }>;
}

interface BackupFileInfo {
  name: string;
  size: number;
  modified: Date;
}

interface ExportSummaryData {
  exportedAt: string;
  totalAmount: number;
  totalCount: number;
  byCategory: Record<string, SummaryCategoryData>;
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

// Export expenses to CSV format
export async function exportToCSV(
  expenses: ExpenseRecord[],
  filename: string = "expenses_backup.csv"
): Promise<string> {
  try {
    // Create CSV header
    const header = "ID,Description,Amount,Category,Date,CreatedAt\n";

    // Convert rows to CSV format
    const rows = expenses
      .map(
        (exp) =>
          `${exp.id},"${escapeCsvField(exp.description)}",${exp.amount},"${
            exp.category
          }","${exp.date}","${exp.created_at || ""}"`
      )
      .join("\n");

    const csv = header + rows;

    // Write to file using Bun.write()
    await Bun.write(filename, csv);

    console.log(`✅ Exported ${expenses.length} expenses to ${filename}`);
    return filename;
  } catch (error) {
    console.error(`❌ CSV export failed:`, error);
    throw error;
  }
}

// Export expenses to JSON format
export async function exportToJSON(
  expenses: ExpenseRecord[],
  filename: string = "expenses_backup.json"
): Promise<string> {
  try {
    const jsonData = {
      exportedAt: new Date().toISOString(),
      totalExpenses: expenses.length,
      expenses,
    };

    // Write JSON using Bun.write() - automatically handles string/buffer conversion
    await Bun.write(filename, JSON.stringify(jsonData, null, 2));

    console.log(`✅ Exported ${expenses.length} expenses to ${filename}`);
    return filename;
  } catch (error) {
    console.error(`❌ JSON export failed:`, error);
    throw error;
  }
}

// Export expenses grouped by category (summary)
export async function exportSummaryToJSON(
  expenses: ExpenseRecord[],
  filename: string = "expenses_summary.json"
): Promise<string> {
  try {
    // Group by category
    const summary = expenses.reduce<Record<string, SummaryCategoryData>>(
      (acc, exp) => {
        const category = exp.category;
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0, items: [] };
        }
        const categoryData = acc[category]!;
        categoryData.total += exp.amount;
        categoryData.count += 1;
        categoryData.items.push({
          description: exp.description,
          amount: exp.amount,
          date: exp.date,
        });
        return acc;
      },
      {} as Record<string, SummaryCategoryData>
    );

    const summaryData: ExportSummaryData = {
      exportedAt: new Date().toISOString(),
      totalAmount: expenses.reduce((sum, e) => sum + e.amount, 0),
      totalCount: expenses.length,
      byCategory: summary,
    };

    // Write using Bun.write() which is optimized for performance
    await Bun.write(filename, JSON.stringify(summaryData, null, 2));

    console.log(`✅ Exported summary to ${filename}`);
    return filename;
  } catch (error) {
    console.error(`❌ Summary export failed:`, error);
    throw error;
  }
}

// ============================================
// IMPORT FUNCTIONS
// ============================================

// Import expenses from JSON file
export async function importFromJSON(
  filename: string,
  db: Database
): Promise<number> {
  try {
    const file = Bun.file(filename);

    // Check if file exists using file.exists()
    if (!(await file.exists())) {
      throw new Error(`File not found: ${filename}`);
    }

    // Read and parse JSON using file.json()
    const data = (await file.json()) as
      | { expenses?: ExpenseRecord[] }
      | ExpenseRecord[];
    const expenses = Array.isArray(data) ? data : data.expenses;

    if (!expenses || !Array.isArray(expenses)) {
      throw new Error("Invalid JSON format: expected expenses array");
    }

    // Insert into database
    const stmt = db.prepare(
      "INSERT INTO expenses (description, amount, category, date) VALUES (?, ?, ?, ?)"
    );

    for (const expense of expenses) {
      if (
        !expense.description ||
        !expense.amount ||
        !expense.category ||
        !expense.date
      ) {
        console.warn(`⚠️ Skipping invalid expense:`, expense);
        continue;
      }
      stmt.run(
        expense.description,
        expense.amount,
        expense.category,
        expense.date
      );
    }

    console.log(`✅ Imported ${expenses.length} expenses from ${filename}`);
    return expenses.length;
  } catch (error) {
    console.error(`❌ JSON import failed:`, error);
    throw error;
  }
}

// ============================================
// BACKUP FUNCTIONS
// ============================================

// Create a timestamped backup of the database
export async function createBackup(
  sourceDb: string = "expenses.db",
  backupDir: string = "backups"
): Promise<string> {
  try {
    // Create backup directory if it doesn't exist
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    // Check if source database exists
    const sourceFile = Bun.file(sourceDb);
    const sourceExists = await sourceFile.exists();

    if (!sourceExists) {
      throw new Error(`Source database file not found: ${sourceDb}`);
    }

    // Generate timestamped filename
    const timestamp = new Date()
      .toISOString()
      .replace(/[:.]/g, "-")
      .split("T")[0];
    const backupName = `${backupDir}/expenses_${timestamp}_${Date.now()}.db`;

    // Read source database
    const source = await sourceFile.arrayBuffer();

    // Write backup
    await Bun.write(backupName, source);

    console.log(`✅ Created backup: ${backupName}`);
    return backupName;
  } catch (error) {
    console.error(`❌ Backup creation failed:`, error);
    throw error;
  }
}

// List all available backups
export async function listBackups(
  backupDir: string = "backups"
): Promise<BackupFileInfo[]> {
  try {
    if (!existsSync(backupDir)) {
      return [];
    }

    const file = Bun.file(backupDir);
    const text = await file.text().catch(() => "");
    if (!text) return [];

    // Bun.file() works with files, not directories, so we use fs for directory listing
    const backups: BackupFileInfo[] = [];

    try {
      const { readdirSync } = require("fs");
      const entries = readdirSync(backupDir, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isFile() && entry.name.endsWith(".db")) {
          const filepath = `${backupDir}/${entry.name}`;
          const backupFile = Bun.file(filepath);
          const stat: BackupFileInfo = {
            name: entry.name,
            size: backupFile.size,
            modified: new Date(backupFile.lastModified || 0),
          };
          backups.push(stat);
        }
      }
    } catch {
      // Fallback: empty array if directory reading fails
      return [];
    }

    return backups.sort((a, b) => b.modified.getTime() - a.modified.getTime());
  } catch (error) {
    console.error(`❌ Failed to list backups:`, error);
    throw error;
  }
}

// ============================================
// LOGGING FUNCTIONS
// ============================================

// Append log entries using Bun's streaming writer
export async function appendLog(
  message: string,
  data?: Record<string, unknown>,
  logFile: string = "logs/transactions.log"
): Promise<void> {
  try {
    // Ensure log directory exists
    const parts = logFile.split("/");
    const logDir = parts.length > 1 ? parts.slice(0, -1).join("/") : "logs";

    if (!existsSync(logDir)) {
      await mkdir(logDir, { recursive: true });
    }

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}${
      data ? ` | ${JSON.stringify(data)}` : ""
    }\n`;

    // Use Bun.file() for efficient appending
    const file = Bun.file(logFile);
    const writer = file.writer({ highWaterMark: 64 * 1024 });
    writer.write(logEntry);
    await writer.end();
  } catch (error) {
    console.error(`❌ Logging failed:`, error);
  }
}

// Get recent log entries
export async function getRecentLogs(
  lines: number = 50,
  logDir: string = "logs"
): Promise<string[]> {
  try {
    if (!existsSync(logDir)) {
      return [];
    }

    // Get today's log file
    const date = new Date().toISOString().split("T")[0];
    const logFile = `${logDir}/app_${date}.log`;
    const file = Bun.file(logFile);

    if (!(await file.exists())) {
      return [];
    }

    const content = await file.text();
    return content
      .split("\n")
      .filter((line) => line.trim())
      .slice(-lines);
  } catch (error) {
    console.error(`❌ Failed to retrieve logs:`, error);
    throw error;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

// Escape special characters in CSV fields
function escapeCsvField(field: string): string {
  if (!field) return "";
  return field.replace(/"/g, '""');
}

export default {
  exportToCSV,
  exportToJSON,
  exportSummaryToJSON,
  importFromJSON,
  createBackup,
  listBackups,
  appendLog,
  getRecentLogs,
};
