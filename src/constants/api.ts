/**
 * API Endpoints and Configuration
 * Centralized API endpoint constants for all fetch requests
 */

export const API_ENDPOINTS = {
  EXPENSES: {
    CREATE: "/api/expenses",
    LIST: "/api/expenses",
    UPDATE: (id: string) => `/api/expenses/${id}`,
    DELETE: (id: string) => `/api/expenses/${id}`,
    STATS: "/api/stats",
  },
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    REGISTER: "/api/auth/register",
    ME: "/api/auth/me",
  },
//   CATEGORIES: {
//     LIST: "/api/categories",
//     CREATE: "/api/categories",
//     UPDATE: (id: string) => `/api/categories/${id}`,
//     DELETE: (id: string) => `/api/categories/${id}`,
//   },
  EXPORT: {
    JSON: "/api/export",
    CSV: "/api/export/csv",
    SUMMARY: "/api/export/summary",
  },
  IMPORT: {
    UPLOAD: "/api/import",
  },
  LOGS: {
    DOWNLOAD: "/api/logs/download",
  },
  BACKUP: {
    CREATE: "/api/backup/create",
    LIST: "/api/backup/list",
  },
  FILES: {
    INFO: "/api/files/info",
  },
} as const;

export const API_CONFIG = {
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
  },
  TIMEOUT_MS: 30000,
} as const;
