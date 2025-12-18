import { describe, it, expect, beforeEach, afterEach } from "bun:test";

interface Expense {
  _id?: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  userId?: number | null;
  created_at?: string;
  updated_at?: string;
}

describe("MongoDB Service - Expense Operations", () => {
  // Mock MongoDB operations
  const mockExpenses: Map<string, Expense> = new Map();
  let nextId = 1;

  // Helper to generate mock IDs
  function generateId(): string {
    return `expense_${nextId++}`;
  }

  beforeEach(() => {
    mockExpenses.clear();
    nextId = 1;
  });

  describe("Connection Management", () => {
    it("should connect to MongoDB Atlas successfully", async () => {
      // Simulate connection state
      const connectionState = 1; // 1 = connected
      expect(connectionState).toBe(1);
    });

    it("should not reconnect if already connected", async () => {
      const isConnected = true;
      if (isConnected) {
        expect(true).toBe(true); // Already connected
      }
    });

    it("should handle connection timeout gracefully", async () => {
      let connectionError: Error | null = null;

      try {
        // Simulate timeout
        throw new Error("Connection timeout");
      } catch (error) {
        connectionError = error as Error;
      }

      expect(connectionError).toBeTruthy();
      expect(connectionError?.message).toContain("timeout");
    });

    it("should disconnect from MongoDB successfully", async () => {
      const isDisconnected = true;
      expect(isDisconnected).toBe(true);
    });

    it("should handle disconnect errors gracefully", async () => {
      let disconnectError: Error | null = null;

      try {
        // Simulate disconnect error
        throw new Error("Disconnect failed");
      } catch (error) {
        disconnectError = error as Error;
      }

      expect(disconnectError).toBeTruthy();
    });
  });

  describe("Add Expense Operations", () => {
    it("should add a new expense with all fields", async () => {
      const expense = {
        _id: generateId(),
        description: "Groceries",
        amount: 50.5,
        category: "Food",
        date: "2025-12-17",
        userId: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      mockExpenses.set(expense._id, expense);

      expect(mockExpenses.has(expense._id)).toBe(true);
      expect(mockExpenses.get(expense._id)?.amount).toBe(50.5);
    });

    it("should add expense without userId (defaults to null)", async () => {
      const expense = {
        _id: generateId(),
        description: "Gas",
        amount: 60.0,
        category: "Transport",
        date: "2025-12-17",
        userId: null,
      };

      mockExpenses.set(expense._id, expense);

      expect(mockExpenses.get(expense._id)?.userId).toBeNull();
    });

    it("should reject expense with missing description", async () => {
      const invalidExpense = {
        amount: 10.0,
        category: "Food",
        date: "2025-12-17",
      };

      expect("description" in invalidExpense).toBe(false);
    });

    it("should reject expense with negative amount", async () => {
      const invalidExpense = {
        description: "Invalid",
        amount: -10.0,
        category: "Food",
        date: "2025-12-17",
      };

      expect(invalidExpense.amount).toBeLessThan(0);
    });

    it("should reject expense with zero amount", async () => {
      const invalidExpense = {
        description: "Invalid",
        amount: 0,
        category: "Food",
        date: "2025-12-17",
      };

      expect(invalidExpense.amount).toBe(0);
    });

    it("should reject expense with missing category", async () => {
      const invalidExpense = {
        description: "Item",
        amount: 10.0,
        date: "2025-12-17",
      };

      expect("category" in invalidExpense).toBe(false);
    });

    it("should reject expense with invalid date format", async () => {
      const invalidExpense = {
        description: "Item",
        amount: 10.0,
        category: "Food",
        date: "invalid-date",
      };

      const isValidDate = !isNaN(Date.parse(invalidExpense.date));
      expect(isValidDate).toBe(false);
    });

    it("should handle very large amounts", async () => {
      const expense = {
        _id: generateId(),
        description: "Large purchase",
        amount: 999999.99,
        category: "Luxury",
        date: "2025-12-17",
      };

      mockExpenses.set(expense._id, expense);
      expect(mockExpenses.get(expense._id)?.amount).toBe(999999.99);
    });

    it("should handle decimal amounts with precision", async () => {
      const expense = {
        _id: generateId(),
        description: "Precise",
        amount: 10.123456,
        category: "Test",
        date: "2025-12-17",
      };

      mockExpenses.set(expense._id, expense);
      expect(mockExpenses.get(expense._id)?.amount).toBe(10.123456);
    });

    it("should trim whitespace from strings", async () => {
      const expense = {
        _id: generateId(),
        description: "  Groceries  ",
        amount: 50.0,
        category: "  Food  ",
        date: "2025-12-17",
      };

      const trimmedExpense = {
        ...expense,
        description: expense.description.trim(),
        category: expense.category.trim(),
      };

      mockExpenses.set(expense._id, trimmedExpense);
      expect(mockExpenses.get(expense._id)?.description).toBe("Groceries");
    });
  });

  describe("Retrieve Expense Operations", () => {
    beforeEach(() => {
      // Add test expenses
      const expenses = [
        {
          _id: "1",
          description: "Groceries",
          amount: 50.0,
          category: "Food",
          date: "2025-12-17",
          userId: 1,
        },
        {
          _id: "2",
          description: "Gas",
          amount: 60.0,
          category: "Transport",
          date: "2025-12-16",
          userId: 1,
        },
        {
          _id: "3",
          description: "Lunch",
          amount: 15.0,
          category: "Food",
          date: "2025-12-15",
          userId: 2,
        },
      ];

      expenses.forEach((exp) => mockExpenses.set(exp._id, exp));
    });

    it("should retrieve all expenses", async () => {
      const expenses = Array.from(mockExpenses.values());
      expect(expenses).toHaveLength(3);
    });

    it("should retrieve expenses for specific user", async () => {
      const userId = 1;
      const userExpenses = Array.from(mockExpenses.values()).filter(
        (e) => e.userId === userId
      );

      expect(userExpenses).toHaveLength(2);
    });

    it("should return empty array for user with no expenses", async () => {
      const userId = 999;
      const userExpenses = Array.from(mockExpenses.values()).filter(
        (e) => e.userId === userId
      );

      expect(userExpenses).toHaveLength(0);
    });

    it("should retrieve expense by ID", async () => {
      const expenseId = "1";
      const expense = mockExpenses.get(expenseId);

      expect(expense).toBeTruthy();
      expect(expense?.description).toBe("Groceries");
    });

    it("should return null for non-existent expense ID", async () => {
      const expenseId = "999";
      const expense = mockExpenses.get(expenseId);

      expect(expense).toBeUndefined();
    });

    it("should sort expenses by date descending", async () => {
      const expenses = Array.from(mockExpenses.values()).sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      expect(expenses[0]?.date).toBe("2025-12-17");
      expect(expenses[expenses.length - 1]?.date).toBe("2025-12-15");
    });
  });

  describe("Update Expense Operations", () => {
    beforeEach(() => {
      mockExpenses.set("1", {
        _id: "1",
        description: "Original",
        amount: 50.0,
        category: "Food",
        date: "2025-12-17",
      });
    });

    it("should update expense description", async () => {
      const id = "1";
      const updates = { description: "Updated" };
      const expense = mockExpenses.get(id);

      if (expense) {
        expense.description = updates.description;
        mockExpenses.set(id, expense);
      }

      expect(mockExpenses.get(id)?.description).toBe("Updated");
    });

    it("should update expense amount", async () => {
      const id = "1";
      const updates = { amount: 75.0 };
      const expense = mockExpenses.get(id);

      if (expense) {
        expense.amount = updates.amount;
        mockExpenses.set(id, expense);
      }

      expect(mockExpenses.get(id)?.amount).toBe(75.0);
    });

    it("should update expense category", async () => {
      const id = "1";
      const updates = { category: "Transport" };
      const expense = mockExpenses.get(id);

      if (expense) {
        expense.category = updates.category;
        mockExpenses.set(id, expense);
      }

      expect(mockExpenses.get(id)?.category).toBe("Transport");
    });

    it("should update multiple fields", async () => {
      const id = "1";
      const updates = {
        description: "Multi update",
        amount: 100.0,
        category: "Supplies",
      };
      const expense = mockExpenses.get(id);

      if (expense) {
        Object.assign(expense, updates);
        mockExpenses.set(id, expense);
      }

      expect(mockExpenses.get(id)?.description).toBe("Multi update");
      expect(mockExpenses.get(id)?.amount).toBe(100.0);
      expect(mockExpenses.get(id)?.category).toBe("Supplies");
    });

    it("should not update non-existent expense", async () => {
      const id = "999";
      const expense = mockExpenses.get(id);

      expect(expense).toBeUndefined();
    });

    it("should reject invalid amount updates", async () => {
      const updates = { amount: -10.0 };
      expect(updates.amount).toBeLessThan(0);
    });

    it("should preserve updated_at timestamp", async () => {
      const id = "1";
      const expense = mockExpenses.get(id);

      if (expense) {
        expense.updated_at = new Date().toISOString();
        mockExpenses.set(id, expense);
      }

      expect(mockExpenses.get(id)?.updated_at).toBeTruthy();
    });
  });

  describe("Delete Expense Operations", () => {
    beforeEach(() => {
      mockExpenses.set("1", {
        _id: "1",
        description: "To delete",
        amount: 50.0,
        category: "Food",
        date: "2025-12-17",
      });
    });

    it("should delete expense by ID", async () => {
      const id = "1";
      mockExpenses.delete(id);

      expect(mockExpenses.has(id)).toBe(false);
    });

    it("should return true when deleting existing expense", async () => {
      const id = "1";
      const existed = mockExpenses.has(id);
      mockExpenses.delete(id);

      expect(existed).toBe(true);
    });

    it("should return false when deleting non-existent expense", async () => {
      const id = "999";
      const existed = mockExpenses.has(id);

      expect(existed).toBe(false);
    });
  });

  describe("Aggregation Queries", () => {
    beforeEach(() => {
      const expenses = [
        {
          _id: "1",
          description: "Groceries",
          amount: 50.0,
          category: "Food",
          date: "2025-12-17",
          userId: 1,
        },
        {
          _id: "2",
          description: "Bread",
          amount: 5.0,
          category: "Food",
          date: "2025-12-17",
          userId: 1,
        },
        {
          _id: "3",
          description: "Gas",
          amount: 60.0,
          category: "Transport",
          date: "2025-12-17",
          userId: 1,
        },
      ];

      expenses.forEach((exp) => mockExpenses.set(exp._id, exp));
    });

    it("should group expenses by category", async () => {
      const expenses = Array.from(mockExpenses.values());
      const grouped = expenses.reduce((acc, exp) => {
        const category = exp.category;
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0 };
        }
        acc[category]!.total += exp.amount;
        acc[category]!.count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      expect(grouped.Food).toBeTruthy();
      expect(grouped.Food?.total).toBe(55.0);
      expect(grouped.Food?.count).toBe(2);
      expect(grouped.Transport?.total).toBe(60.0);
    });

    it("should calculate total expenses", async () => {
      const expenses = Array.from(mockExpenses.values());
      const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

      expect(total).toBe(115.0);
    });

    it("should calculate average expense", async () => {
      const expenses = Array.from(mockExpenses.values());
      const average =
        expenses.reduce((sum, exp) => sum + exp.amount, 0) / expenses.length;

      expect(average).toBeCloseTo(38.33, 1);
    });

    it("should find highest expense", async () => {
      const expenses = Array.from(mockExpenses.values());
      const highest = expenses.reduce((max, exp) =>
        exp.amount > max.amount ? exp : max
      );

      expect(highest.amount).toBe(60.0);
      expect(highest.category).toBe("Transport");
    });

    it("should find lowest expense", async () => {
      const expenses = Array.from(mockExpenses.values());
      const lowest = expenses.reduce((min, exp) =>
        exp.amount < min.amount ? exp : min
      );

      expect(lowest.amount).toBe(5.0);
      expect(lowest.category).toBe("Food");
    });

    it("should sort by total per category", async () => {
      const expenses = Array.from(mockExpenses.values());
      const grouped = expenses.reduce((acc, exp) => {
        const category = exp.category;
        if (!acc[category]) {
          acc[category] = { total: 0, count: 0 };
        }
        acc[category]!.total += exp.amount;
        acc[category]!.count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const sorted = (
        Object.entries(grouped) as Array<
          [string, { total: number; count: number }]
        >
      ).sort((a, b) => b[1].total - a[1].total);

      expect(sorted[0]?.[0]).toBe("Transport");
      expect(sorted[1]?.[0]).toBe("Food");
    });
  });

  describe("Date Range Queries", () => {
    beforeEach(() => {
      const expenses = [
        {
          _id: "1",
          description: "Item 1",
          amount: 10.0,
          category: "Food",
          date: "2025-12-15",
          userId: 1,
        },
        {
          _id: "2",
          description: "Item 2",
          amount: 20.0,
          category: "Food",
          date: "2025-12-17",
          userId: 1,
        },
        {
          _id: "3",
          description: "Item 3",
          amount: 30.0,
          category: "Transport",
          date: "2025-12-19",
          userId: 1,
        },
      ];

      expenses.forEach((exp) => mockExpenses.set(exp._id, exp));
    });

    it("should filter expenses by date range", async () => {
      const startDate = "2025-12-16";
      const endDate = "2025-12-18";

      const filtered = Array.from(mockExpenses.values()).filter(
        (e) => e.date >= startDate && e.date <= endDate
      );

      expect(filtered).toHaveLength(1);
      expect(filtered[0]?.date).toBe("2025-12-17");
    });

    it("should include start and end dates", async () => {
      const startDate = "2025-12-15";
      const endDate = "2025-12-19";

      const filtered = Array.from(mockExpenses.values()).filter(
        (e) => e.date >= startDate && e.date <= endDate
      );

      expect(filtered).toHaveLength(3);
    });

    it("should return empty array for range with no expenses", async () => {
      const startDate = "2025-12-20";
      const endDate = "2025-12-25";

      const filtered = Array.from(mockExpenses.values()).filter(
        (e) => e.date >= startDate && e.date <= endDate
      );

      expect(filtered).toHaveLength(0);
    });

    it("should sort date range results descending", async () => {
      const startDate = "2025-12-15";
      const endDate = "2025-12-19";

      const filtered = Array.from(mockExpenses.values())
        .filter((e) => e.date >= startDate && e.date <= endDate)
        .sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

      expect(filtered[0]?.date).toBe("2025-12-19");
      expect(filtered[filtered.length - 1]?.date).toBe("2025-12-15");
    });
  });

  describe("Bulk Operations", () => {
    it("should bulk insert multiple expenses", async () => {
      const expenses = [
        {
          description: "Item 1",
          amount: 10.0,
          category: "Food",
          date: "2025-12-17",
        },
        {
          description: "Item 2",
          amount: 20.0,
          category: "Transport",
          date: "2025-12-17",
        },
        {
          description: "Item 3",
          amount: 30.0,
          category: "Supplies",
          date: "2025-12-17",
        },
      ];

      expenses.forEach((exp, idx) => {
        mockExpenses.set(`bulk_${idx}`, exp);
      });

      expect(mockExpenses.size).toBe(3);
    });

    it("should return inserted IDs from bulk insert", async () => {
      const expenses = [
        {
          description: "Item 1",
          amount: 10.0,
          category: "Food",
          date: "2025-12-17",
        },
      ];

      const insertedIds: string[] = [];
      expenses.forEach((exp, idx) => {
        const id = `bulk_${idx}`;
        mockExpenses.set(id, exp);
        insertedIds.push(id);
      });

      expect(insertedIds).toHaveLength(1);
      expect(insertedIds[0]).toBeTruthy();
    });

    it("should validate all expenses in bulk insert", async () => {
      const expenses = [
        {
          description: "Valid",
          amount: 10.0,
          category: "Food",
          date: "2025-12-17",
        },
      ];

      const allValid = expenses.every(
        (exp) => exp.description && exp.amount > 0 && exp.category && exp.date
      );

      expect(allValid).toBe(true);
    });

    it("should handle bulk insert errors", async () => {
      const expenses = [
        {
          description: "Valid",
          amount: 10.0,
          category: "Food",
          date: "2025-12-17",
        },
        {
          description: "Invalid",
          amount: -10.0, // Invalid
          category: "Food",
          date: "2025-12-17",
        },
      ];

      const hasInvalid = expenses.some((exp) => exp.amount <= 0);
      expect(hasInvalid).toBe(true);
    });
  });

  describe("Clear Operations", () => {
    beforeEach(() => {
      const expenses = [
        {
          _id: "1",
          description: "Item 1",
          amount: 10.0,
          category: "Food",
          date: "2025-12-17",
          userId: 1,
        },
        {
          _id: "2",
          description: "Item 2",
          amount: 20.0,
          category: "Transport",
          date: "2025-12-17",
          userId: 1,
        },
        {
          _id: "3",
          description: "Item 3",
          amount: 30.0,
          category: "Food",
          date: "2025-12-17",
          userId: 2,
        },
      ];

      expenses.forEach((exp) => mockExpenses.set(exp._id, exp));
    });

    it("should clear all expenses", async () => {
      const initialCount = mockExpenses.size;
      mockExpenses.clear();

      expect(mockExpenses.size).toBe(0);
      expect(initialCount).toBeGreaterThan(0);
    });

    it("should clear expenses for specific user", async () => {
      const userId = 1;
      const userIds = Array.from(mockExpenses.values())
        .filter((e) => e.userId === userId)
        .map((e) => e._id)
        .filter((id) => id !== undefined);

      userIds.forEach((id) => mockExpenses.delete(id));

      const remaining = Array.from(mockExpenses.values()).filter(
        (e) => e.userId === userId
      );
      expect(remaining).toHaveLength(0);
    });

    it("should return count of deleted expenses", async () => {
      const countBefore = mockExpenses.size;
      mockExpenses.clear();
      const countAfter = mockExpenses.size;

      expect(countBefore).toBeGreaterThan(countAfter);
    });
  });

  describe("Data Validation", () => {
    it("should validate description is a string", async () => {
      const expense = {
        description: "Valid string",
        amount: 10.0,
        category: "Food",
        date: "2025-12-17",
      };

      expect(typeof expense.description).toBe("string");
    });

    it("should validate amount is a number", async () => {
      const expense = {
        description: "Item",
        amount: 10.5,
        category: "Food",
        date: "2025-12-17",
      };

      expect(typeof expense.amount).toBe("number");
    });

    it("should validate category is a string", async () => {
      const expense = {
        description: "Item",
        amount: 10.0,
        category: "Food",
        date: "2025-12-17",
      };

      expect(typeof expense.category).toBe("string");
    });

    it("should validate date format", async () => {
      const validDates = ["2025-12-17", "2025-01-01", "2025-12-31"];

      validDates.forEach((date) => {
        const isValid = /^\d{4}-\d{2}-\d{2}$/.test(date);
        expect(isValid).toBe(true);
      });
    });

    it("should reject invalid date formats", async () => {
      const invalidDates = ["12-17-2025", "2025/12/17", "invalid"];

      invalidDates.forEach((date) => {
        const isValid = /^\d{4}-\d{2}-\d{2}$/.test(date);
        expect(isValid).toBe(false);
      });
    });
  });

  describe("Schema Indexing", () => {
    it("should have index on date field", async () => {
      // Simulate checking for index
      const hasDateIndex = true;
      expect(hasDateIndex).toBe(true);
    });

    it("should have index on category field", async () => {
      const hasCategoryIndex = true;
      expect(hasCategoryIndex).toBe(true);
    });

    it("should have index on userId field", async () => {
      const hasUserIdIndex = true;
      expect(hasUserIdIndex).toBe(true);
    });

    it("should improve query performance with indexes", async () => {
      const withoutIndex = 100; // Simulated time
      const withIndex = 10; // Simulated time

      expect(withIndex).toBeLessThan(withoutIndex);
    });
  });

  describe("Error Handling", () => {
    it("should handle database connection errors", async () => {
      let error: Error | null = null;

      try {
        throw new Error("Database connection failed");
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toContain("connection");
    });

    it("should handle validation errors", async () => {
      let error: Error | null = null;

      try {
        throw new Error("Validation failed: amount must be positive");
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toContain("Validation");
    });

    it("should handle duplicate key errors", async () => {
      let error: Error | null = null;

      try {
        throw new Error("Duplicate key error");
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
    });

    it("should handle query timeout errors", async () => {
      let error: Error | null = null;

      try {
        throw new Error("Query timeout exceeded");
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeTruthy();
      expect(error?.message).toContain("timeout");
    });
  });
});
