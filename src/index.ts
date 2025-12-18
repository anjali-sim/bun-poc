import { serve } from "bun";
import { mkdir } from "node:fs/promises";
import index from "./index.html";
import {
  exportToCSV,
  exportSummaryToJSON,
  createBackup,
  listBackups,
} from "./services/fileService";
import {
  initializeAuthDatabase,
  registerUser,
  authenticateUser,
  verifySession,
  getUserById,
  logoutUser,
} from "./services/authService";
import {
  getSessionFromCookies,
  setSessionCookie,
  clearSessionCookie,
} from "./services/cookieMiddleware";
import {
  connectMongoDB,
  disconnectMongoDB,
  addExpenseToMongo,
  getExpensesFromMongo,
  deleteExpenseFromMongo,
  updateExpenseInMongo,
  getExpensesByCategoryFromMongo,
  getExpenseStatsFromMongo,
} from "./services/mongoService";

// Ensure logs directory exists
await mkdir(process.env.BUN_PUBLIC_LOGS_DIR || "logs", { recursive: true });
await mkdir(process.env.BUN_PUBLIC_BACKUPS_DIR || "backups", {
  recursive: true,
});

// Initialize authentication database (SQLite)
initializeAuthDatabase();

// Initialize MongoDB connection for expenses
try {
  await connectMongoDB();
  console.log("🗄️  MongoDB connected for expenses");
} catch (error) {
  console.error(
    "⚠️  MongoDB connection failed, expenses will not be available"
  );
}

// Initialize transaction log using Bun.file() writer
const logFile = Bun.file("logs/transactions.log");
let transactionLogger = logFile.writer({ highWaterMark: 64 * 1024 });

function logTransaction(action: string, data: Record<string, unknown>) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${action}: ${JSON.stringify(data)}\n`;
  transactionLogger.write(logEntry);
}

// MongoDB helper functions for expenses
async function getExpenses() {
  return await getExpensesFromMongo();
}

async function addExpense(
  description: string,
  amount: number,
  category: string,
  date: string
) {
  await addExpenseToMongo(description, amount, category, date);
  const expenses = await getExpensesFromMongo();
  logTransaction("ADD_EXPENSE", { description, amount, category, date });
  return expenses;
}

async function deleteExpense(id: string) {
  await deleteExpenseFromMongo(id);
  const expenses = await getExpensesFromMongo();
  logTransaction("DELETE_EXPENSE", { id });
  return expenses;
}

async function getExpensesByCategory() {
  return await getExpensesByCategoryFromMongo();
}

async function getStats() {
  return await getExpenseStatsFromMongo();
}

const server = serve({
  // Error handling - global error callback
  error(error) {
    console.error("Server error:", error);
    return Response.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  },

  routes: {
    // Authentication routes
    "/api/auth/register": {
      async POST(req) {
        try {
          const body = (await req.json()) as {
            username?: string;
            email?: string;
            password?: string;
          };
          const { username = "", email = "", password = "" } = body;

          const result = registerUser(username, email, password);

          if (!result.success) {
            return Response.json({ error: result.message }, { status: 400 });
          }

          return Response.json(
            { success: true, message: result.message, userId: result.userId },
            { status: 201 }
          );
        } catch (error) {
          return Response.json(
            { error: "Registration failed" },
            { status: 500 }
          );
        }
      },
    },

    "/api/auth/login": {
      async POST(req) {
        try {
          const body = (await req.json()) as {
            email?: string;
            password?: string;
          };
          const { email = "", password = "" } = body;

          const result = authenticateUser(email, password);

          if (!result.success) {
            return Response.json({ error: result.message }, { status: 401 });
          }

          // Get user info
          const userInfo = getUserById(result.userId!);

          const response = Response.json(
            {
              success: true,
              message: result.message,
              user: userInfo,
              sessionToken: result.sessionToken,
            },
            { status: 200 }
          );

          // Set session cookie using Bun's cookie concepts
          return setSessionCookie(response, result.sessionToken!, 7);
        } catch (error) {
          return Response.json({ error: "Login failed" }, { status: 500 });
        }
      },
    },

    "/api/auth/logout": {
      async POST(req) {
        try {
          const sessionToken = getSessionFromCookies(req);
          if (sessionToken) {
            logoutUser(sessionToken);
          }

          // Clear session cookie
          const response = Response.json(
            { success: true, message: "Logged out successfully" },
            { status: 200 }
          );

          return clearSessionCookie(response);
        } catch (error) {
          return Response.json({ error: "Logout failed" }, { status: 500 });
        }
      },
    },

    "/api/auth/me": {
      async GET(req) {
        try {
          const sessionToken = getSessionFromCookies(req);

          if (!sessionToken) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          const sessionResult = verifySession(sessionToken);

          if (!sessionResult.valid || !sessionResult.userId) {
            return Response.json({ error: "Session expired" }, { status: 401 });
          }

          const userInfo = getUserById(sessionResult.userId);

          if (!userInfo) {
            return Response.json({ error: "User not found" }, { status: 404 });
          }

          return Response.json(
            { success: true, user: userInfo },
            { status: 200 }
          );
        } catch (error) {
          return Response.json(
            { error: "Failed to get user info" },
            { status: 500 }
          );
        }
      },
    },

    // Serve index.html for all unmatched routes.
    "/*": index,

    "/api/expenses": {
      async GET(req) {
        // Verify session
        const sessionToken = getSessionFromCookies(req);
        if (!sessionToken || !verifySession(sessionToken).valid) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const expenses = await getExpenses();
        return Response.json({ data: expenses });
      },

      async POST(req) {
        // Verify session
        const sessionToken = getSessionFromCookies(req);
        if (!sessionToken || !verifySession(sessionToken).valid) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const body = (await req.json()) as {
            description?: string;
            amount?: number;
            category?: string;
            date?: string;
          };
          const { description, amount, category, date } = body;

          if (!description || !amount || !category || !date) {
            return Response.json(
              { error: "Missing required fields" },
              { status: 400 }
            );
          }

          const expenses = await addExpense(
            description,
            amount,
            category,
            date
          );
          return Response.json({ data: expenses }, { status: 201 });
        } catch (error) {
          return Response.json(
            { error: "Failed to add expense" },
            { status: 500 }
          );
        }
      },
    },

    "/api/expenses/:id": {
      async DELETE(req) {
        try {
          const id = req.params.id;
          const expenses = await deleteExpense(id);
          return Response.json({ data: expenses });
        } catch (error) {
          return Response.json(
            { error: "Failed to delete expense" },
            { status: 500 }
          );
        }
      },

      async PUT(req) {
        try {
          const id = req.params.id;
          const body = await req.json();
          const { description, amount, category, date } = body;

          if (!description || !amount || !category || !date) {
            return Response.json(
              { error: "Missing required fields" },
              { status: 400 }
            );
          }

          await updateExpenseInMongo(id, {
            description,
            amount: parseFloat(String(amount)),
            category,
            date,
          });

          const expenses = await getExpenses();
          logTransaction("UPDATE_EXPENSE", {
            id,
            description,
            amount,
            category,
            date,
          });

          return Response.json({ data: expenses, success: true });
        } catch (error) {
          console.error("Update expense error:", error);
          return Response.json(
            {
              error: "Failed to update expense",
              message: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
          );
        }
      },
    },

    "/api/export": {
      async GET(req) {
        try {
          const expenses = await getExpenses();
          const timestamp = new Date().toISOString().split("T")[0];
          const filename = `expenses_${timestamp}.json`;
          const filepath = `logs/${filename}`;

          // Write expenses to JSON file using Bun.write()
          await Bun.write(filepath, JSON.stringify(expenses, null, 2));
          logTransaction("EXPORT_EXPENSES", {
            filename,
            count: expenses.length,
          });

          return Response.json({
            success: true,
            message: `Exported ${expenses.length} expenses to ${filename}`,
            filename,
          });
        } catch (error) {
          return Response.json(
            { error: "Failed to export expenses" },
            { status: 500 }
          );
        }
      },
    },

    "/api/export/csv": {
      async GET(req) {
        try {
          const expenses = await getExpenses();
          const timestamp = new Date().toISOString().split("T")[0];

          // Use exportToCSV from fileService demonstrating Bun.write()
          const filename = `expenses_${timestamp}.csv`;
          const filepath = await exportToCSV(expenses, `logs/${filename}`);

          logTransaction("EXPORT_CSV", {
            filename,
            count: expenses.length,
          });

          return Response.json({
            success: true,
            message: `Exported ${expenses.length} expenses as CSV`,
            filename,
          });
        } catch (error) {
          return Response.json(
            { error: "Failed to export CSV" },
            { status: 500 }
          );
        }
      },
    },

    "/api/export/summary": {
      async GET(req) {
        try {
          const expenses = await getExpenses();
          const timestamp = new Date().toISOString().split("T")[0];

          // Export summary using fileService function
          const filename = `summary_${timestamp}.json`;
          const filepath = await exportSummaryToJSON(
            expenses,
            `logs/${filename}`
          );

          logTransaction("EXPORT_SUMMARY", {
            filename,
            count: expenses.length,
          });

          return Response.json({
            success: true,
            message: `Exported expense summary`,
            filename,
          });
        } catch (error) {
          return Response.json(
            { error: "Failed to export summary" },
            { status: 500 }
          );
        }
      },
    },

    "/api/import": {
      async POST(req) {
        try {
          const formData = await req.formData();
          const file = formData.get("file") as File | null;

          if (!file) {
            return Response.json(
              { error: "No file provided" },
              { status: 400 }
            );
          }

          // Read file using Bun.file() and convert to JSON
          const fileBuffer = await file.arrayBuffer();
          const jsonData = JSON.parse(
            new TextDecoder().decode(fileBuffer)
          ) as Array<{
            description?: string;
            amount?: number;
            category?: string;
            date?: string;
          }>;

          let importedCount = 0;
          for (const expense of jsonData) {
            if (
              expense.description &&
              expense.amount &&
              expense.category &&
              expense.date
            ) {
              await addExpenseToMongo(
                expense.description,
                expense.amount,
                expense.category,
                expense.date
              );
              importedCount++;
            }
          }

          logTransaction("IMPORT_EXPENSES", {
            importedCount,
            totalInFile: jsonData.length,
          });
          const expenses = await getExpenses();

          return Response.json(
            {
              success: true,
              message: `Imported ${importedCount} expenses`,
              data: expenses,
            },
            { status: 201 }
          );
        } catch (error) {
          return Response.json(
            { error: "Failed to import expenses" },
            { status: 500 }
          );
        }
      },
    },

    "/api/logs": {
      async GET(req) {
        try {
          const logsFile = Bun.file("logs/transactions.log");
          const exists = await logsFile.exists();

          if (!exists) {
            return Response.json({ data: [] });
          }

          // Read log file as text using Bun.file().text()
          const logContent = await logsFile.text();
          const logLines = logContent.split("\n").filter((line) => line.trim());

          return Response.json({
            data: logLines,
            totalEntries: logLines.length,
          });
        } catch (error) {
          return Response.json(
            { error: "Failed to read logs" },
            { status: 500 }
          );
        }
      },
    },

    "/api/logs/download": {
      async GET(req) {
        try {
          const logsFile = Bun.file("logs/transactions.log");
          const exists = await logsFile.exists();

          if (!exists) {
            return Response.json(
              { error: "No logs available" },
              { status: 404 }
            );
          }

          // Read and return log file using Bun.file().text()
          const content = await logsFile.text();
          return new Response(content, {
            headers: {
              "Content-Type": "text/plain",
              "Content-Disposition": "attachment; filename=transactions.log",
            },
          });
        } catch (error) {
          return Response.json(
            { error: "Failed to download logs" },
            { status: 500 }
          );
        }
      },
    },

    "/api/backup/create": {
      async POST(req) {
        try {
          // Create database backup using fileService
          const backupPath = await createBackup(
            Bun.env.BUN_PUBLIC_EXPENSES_DB_PATH || "expenses.db",
            Bun.env.BUN_PUBLIC_BACKUPS_DIR || "backups"
          );
          logTransaction("CREATE_BACKUP", {
            path: backupPath,
            timestamp: new Date().toISOString(),
          });

          return Response.json({
            success: true,
            message: "Backup created successfully",
            path: backupPath,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          console.error("Backup creation error:", errorMessage);
          return Response.json(
            { error: `Failed to create backup: ${errorMessage}` },
            { status: 500 }
          );
        }
      },
    },

    "/api/backup/list": {
      async GET(req) {
        try {
          // List all backups demonstrating directory traversal
          const backups = await listBackups("backups");

          return Response.json({
            success: true,
            backups,
            count: backups.length,
          });
        } catch (error) {
          return Response.json(
            { error: "Failed to list backups" },
            { status: 500 }
          );
        }
      },
    },

    "/api/files/info": {
      async GET(req) {
        try {
          // Demonstrate file metadata operations with Bun.file()
          const dbFile = Bun.file(
            import.meta.env.BUN_PUBLIC_EXPENSES_DB_PATH || "expenses.db"
          );

          const logFile = Bun.file("logs/transactions.log");

          const dbExists = await dbFile.exists();
          const logExists = await logFile.exists();

          const fileInfo = {
            database: {
              exists: dbExists,
              size: dbExists ? dbFile.size : 0,
              type: dbFile.type,
            },
            logs: {
              exists: logExists,
              size: logExists ? logFile.size : 0,
              type: logFile.type,
            },
          };

          return Response.json({
            success: true,
            files: fileInfo,
          });
        } catch (error) {
          return Response.json(
            { error: "Failed to retrieve file info" },
            { status: 500 }
          );
        }
      },
    },

    "/api/stats": {
      async GET(req) {
        // Verify session
        const sessionToken = getSessionFromCookies(req);
        if (!sessionToken || !verifySession(sessionToken).valid) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const stats = await getStats();
        return Response.json({ data: stats });
      },
    },

    "/api/categories": {
      async GET(req) {
        // Verify session
        const sessionToken = getSessionFromCookies(req);
        if (!sessionToken || !verifySession(sessionToken).valid) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        const expenses = await getExpenses();
        const categories = [
          ...new Set(expenses.map((e: any) => e.category)),
        ].sort();
        return Response.json({ data: categories });
      },
    },

    // Redirect route examples demonstrating Bun.serve redirect functionality
    "/redirect-to-dashboard": Response.redirect("/", 302),
  },

  development: process.env.NODE_ENV !== "production" && {
    // Enable browser hot reloading in development
    hmr: true,

    // Echo console logs from the browser to the server
    console: true,
  },

  fetch(req) {
    return new Response("Not Found", { status: 404 });
  },
});

console.log(`🚀 Expense Tracker running at ${server.url}`);

// Graceful shutdown - flush and close transaction logger, disconnect MongoDB
process.on("SIGINT", async () => {
  console.log("\n📴 Shutting down...");
  await transactionLogger.end();
  await disconnectMongoDB();
  process.exit(0);
});
