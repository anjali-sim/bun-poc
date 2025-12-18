/**
 * File Operations Hook for React
 * Provides easy-to-use functions for importing/exporting data via file I/O
 *
 * Usage:
 * const { exportJSON, exportCSV, importFile, downloadLogs } = useFileOperations();
 */

import { useState, useCallback } from "react";
import { API_ENDPOINTS } from "../constants";

interface BackupInfo {
  name: string;
  size: number;
  modified?: string;
}

interface FileInfoResponse {
  database?: { exists: boolean; size: number; type: string };
  logs?: { exists: boolean; size: number; type: string };
}

interface ExportResponse {
  success: boolean;
  filename: string;
  message?: string;
  importedCount?: number;
}

interface UseFileOperationsReturn {
  loading: boolean;
  error: string | null;
  success: string | null;
  exportJSON: (filename?: string) => Promise<void>;
  exportCSV: (filename?: string) => Promise<void>;
  exportSummary: () => Promise<void>;
  importFile: (file: File) => Promise<void>;
  downloadLogs: () => Promise<void>;
  createBackup: () => Promise<void>;
  listBackups: () => Promise<BackupInfo[]>;
  getFileInfo: () => Promise<FileInfoResponse | null>;
}

export function useFileOperations(): UseFileOperationsReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setTimeout(() => {
      setError(null);
      setSuccess(null);
    }, 3000);
  }, []);

  /**
   * Export expenses as JSON file
   * Calls /api/export endpoint
   */
  const exportJSON = useCallback(
    async (filename?: string) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const response = await fetch(API_ENDPOINTS.EXPORT.JSON);
        const data = (await response.json()) as ExportResponse;

        if (!response.ok) {
          throw new Error(data.message || "Failed to export JSON");
        }

        setSuccess(`✅ Exported to ${data.filename}`);
        clearMessages();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed";
        setError(`❌ ${message}`);
        clearMessages();
      } finally {
        setLoading(false);
      }
    },
    [clearMessages]
  );

  /**
   * Export expenses as CSV file
   * Calls /api/export/csv endpoint
   */
  const exportCSV = useCallback(
    async (filename?: string) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        const response = await fetch(API_ENDPOINTS.EXPORT.CSV);
        const data = (await response.json()) as ExportResponse;

        if (!response.ok) {
          throw new Error(data.message || "Failed to export CSV");
        }

        setSuccess(`✅ Exported CSV to ${data.filename}`);
        clearMessages();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Export failed";
        setError(`❌ ${message}`);
        clearMessages();
      } finally {
        setLoading(false);
      }
    },
    [clearMessages]
  );

  /**
   * Export category summary
   * Calls /api/export/summary endpoint
   */
  const exportSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(API_ENDPOINTS.EXPORT.SUMMARY);
      const data = (await response.json()) as ExportResponse;

      if (!response.ok) {
        throw new Error(data.message || "Failed to export summary");
      }

      setSuccess(`✅ Summary exported to ${data.filename}`);
      clearMessages();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Export failed";
      setError(`❌ ${message}`);
      clearMessages();
    } finally {
      setLoading(false);
    }
  }, [clearMessages]);

  /**
   * Import expenses from a JSON file
   * Calls /api/import endpoint with FormData
   */
  const importFile = useCallback(
    async (file: File) => {
      try {
        setLoading(true);
        setError(null);
        setSuccess(null);

        // Create FormData for file upload
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(API_ENDPOINTS.IMPORT.UPLOAD, {
          method: "POST",
          body: formData,
        });

        const data = (await response.json()) as ExportResponse;

        if (!response.ok) {
          throw new Error(data.message || "Failed to import file");
        }

        setSuccess(`✅ Imported ${data.importedCount} expenses`);
        clearMessages();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Import failed";
        setError(`❌ ${message}`);
        clearMessages();
      } finally {
        setLoading(false);
      }
    },
    [clearMessages]
  );

  /**
   * Download transaction logs as text file
   * Calls /api/logs/download endpoint
   */
  const downloadLogs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(API_ENDPOINTS.LOGS.DOWNLOAD);

      if (!response.ok) {
        throw new Error("Failed to download logs");
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "transactions.log";
      link.click();
      URL.revokeObjectURL(url);

      setSuccess("✅ Logs downloaded successfully");
      clearMessages();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed";
      setError(`❌ ${message}`);
      clearMessages();
    } finally {
      setLoading(false);
    }
  }, [clearMessages]);

  /**
   * Create database backup
   * Calls /api/backup/create endpoint
   */
  const createBackup = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(API_ENDPOINTS.BACKUP.CREATE, {
        method: "POST",
      });

      const data = (await response.json()) as { path?: string; message?: string };

      if (!response.ok) {
        throw new Error(data.message || "Failed to create backup");
      }

      setSuccess(`✅ Backup created: ${data.path}`);
      clearMessages();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Backup failed";
      setError(`❌ ${message}`);
      clearMessages();
    } finally {
      setLoading(false);
    }
  }, [clearMessages]);

  /**
   * List all available backups
   * Calls /api/backup/list endpoint
   */
  const listBackups = useCallback(async (): Promise<BackupInfo[]> => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.BACKUP.LIST);
      const data = (await response.json()) as { backups?: BackupInfo[] };

      if (!response.ok) {
        throw new Error("Failed to list backups");
      }

      return data.backups || [];
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to list backups";
      setError(`❌ ${message}`);
      clearMessages();
      return [];
    } finally {
      setLoading(false);
    }
  }, [clearMessages]);

  /**
   * Get file information (size, type, existence)
   * Calls /api/files/info endpoint
   */
  const getFileInfo = useCallback(async (): Promise<FileInfoResponse | null> => {
    try {
      const response = await fetch(API_ENDPOINTS.FILES.INFO);
      const data = (await response.json()) as { files?: FileInfoResponse };

      if (!response.ok) {
        throw new Error("Failed to get file info");
      }

      return data.files || null;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get file info";
      setError(`❌ ${message}`);
      clearMessages();
      return null;
    }
  }, [clearMessages]);

  return {
    loading,
    error,
    success,
    exportJSON,
    exportCSV,
    exportSummary,
    importFile,
    downloadLogs,
    createBackup,
    listBackups,
    getFileInfo,
  };
}
