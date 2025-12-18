/**
 * Mongoose Service for Expense Tracking with MongoDB Atlas
 */

import mongoose, { Schema, Document, Model } from "mongoose";

// MongoDB Atlas connection URL
const MONGO_URI =
  Bun.env.BUN_PUBLIC_MONGODB_URI || "mongodb://localhost:27017/expense_tracker";

// Define Expense interface
interface IExpense extends Document {
  //   _id?: any;
  description: string;
  amount: number;
  category: string;
  date: string;
  userId?: number;
  created_at: Date;
  updated_at: Date;
}

// Define Expense Schema
const expenseSchema = new Schema<IExpense>(
  {
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: String,
      required: true,
    },
    userId: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Create indexes for better query performance
expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ userId: 1 });

// Create model
let Expense: Model<IExpense>;

try {
  Expense = mongoose.model<IExpense>("Expense", expenseSchema);
} catch {
  Expense = mongoose.model<IExpense>("Expense");
}

// Connect to MongoDB Atlas
export async function connectMongoDB(): Promise<void> {
  try {
    if (mongoose.connection.readyState === 1) {
      console.log("✅ Already connected to MongoDB Atlas");
      return;
    }

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log("✅ Connected to MongoDB Atlas successfully");
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error);
    throw error;
  }
}

// Disconnect from MongoDB Atlas
export async function disconnectMongoDB(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log("✅ Disconnected from MongoDB Atlas");
  } catch (error) {
    console.error("❌ MongoDB disconnection failed:", error);
    throw error;
  }
}

// Add a new expense to MongoDB
export async function addExpenseToMongo(
  description: string,
  amount: number,
  category: string,
  date: string,
  userId?: number
): Promise<any> {
  try {
    const expense = new Expense({
      description,
      amount,
      category,
      date,
      userId: userId || null,
    });

    const savedExpense = await expense.save();
    console.log(`✅ Expense added with ID: ${savedExpense._id}`);
    return savedExpense;
  } catch (error) {
    console.error("❌ Failed to add expense:", error);
    throw error;
  }
}

// Get all expenses from MongoDB
export async function getExpensesFromMongo(userId?: number): Promise<any[]> {
  try {
    const query = userId ? { userId } : {};
    const expenses = await Expense.find(query).sort({ date: -1 });
    return expenses;
  } catch (error) {
    console.error("❌ Failed to fetch expenses:", error);
    throw error;
  }
}

// Get expense by ID from MongoDB
export async function getExpenseByIdFromMongo(id: string): Promise<any> {
  try {
    const expense = await Expense.findById(id);
    return expense;
  } catch (error) {
    console.error("❌ Failed to fetch expense:", error);
    throw error;
  }
}

// Update expense in MongoDB
export async function updateExpenseInMongo(
  id: string,
  updates: Partial<{
    description: string;
    amount: number;
    category: string;
    date: string;
  }>
): Promise<any> {
  try {
    const updated = await Expense.findByIdAndUpdate(
      id,
      { ...updates },
      { new: true, runValidators: true }
    );
    console.log(`✅ Expense ${id} updated`);
    return updated;
  } catch (error) {
    console.error("❌ Failed to update expense:", error);
    throw error;
  }
}

// Delete expense from MongoDB
export async function deleteExpenseFromMongo(id: string): Promise<boolean> {
  try {
    const result = await Expense.findByIdAndDelete(id);
    console.log(`✅ Expense ${id} deleted`);
    return !!result;
  } catch (error) {
    console.error("❌ Failed to delete expense:", error);
    throw error;
  }
}

// Get expenses grouped by category
export async function getExpensesByCategoryFromMongo(
  userId?: number
): Promise<any[]> {
  try {
    const query = userId ? { userId } : {};
    const results = await Expense.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { total: -1 } },
    ]);

    return results;
  } catch (error) {
    console.error("❌ Failed to fetch expenses by category:", error);
    throw error;
  }
}

// Get expense statistics from MongoDB
export async function getExpenseStatsFromMongo(userId?: number): Promise<any> {
  try {
    const query = userId ? { userId } : {};

    const stats = await Expense.aggregate([
      { $match: query },
      {
        $facet: {
          summary: [
            {
              $group: {
                _id: null,
                total: { $sum: "$amount" },
                count: { $sum: 1 },
                average: { $avg: "$amount" },
              },
            },
          ],
          byCategory: [
            {
              $group: {
                _id: "$category",
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { total: -1 } },
          ],
          byDate: [
            {
              $group: {
                _id: "$date",
                total: { $sum: "$amount" },
                count: { $sum: 1 },
              },
            },
            { $sort: { _id: -1 } },
          ],
        },
      },
    ]);

    return stats[0];
  } catch (error) {
    console.error("❌ Failed to fetch expense stats:", error);
    throw error;
  }
}

// Get expenses within a date range
export async function getExpensesByDateRangeFromMongo(
  startDate: string,
  endDate: string,
  userId?: number
): Promise<any[]> {
  try {
    const query = {
      date: { $gte: startDate, $lte: endDate },
      ...(userId && { userId }),
    };

    const expenses = await Expense.find(query).sort({ date: -1 });
    return expenses;
  } catch (error) {
    console.error("❌ Failed to fetch expenses by date range:", error);
    throw error;
  }
}

// Delete all expenses from MongoDB (use with caution!)
export async function clearExpensesFromMongo(userId?: number): Promise<number> {
  try {
    const query = userId ? { userId } : {};
    const result = await Expense.deleteMany(query);

    console.log(`✅ Deleted ${result.deletedCount} expenses`);
    return result.deletedCount;
  } catch (error) {
    console.error("❌ Failed to clear expenses:", error);
    throw error;
  }
}

// Bulk insert multiple expenses into MongoDB
export async function bulkInsertExpensesToMongo(expenses: any[]): Promise<any> {
  try {
    const result = await Expense.insertMany(expenses);

    console.log(`✅ Bulk inserted ${result.length} expenses`);
    return {
      insertedIds: result.map((exp) => exp._id),
      insertedCount: result.length,
    };
  } catch (error) {
    console.error("❌ Failed to bulk insert expenses:", error);
    throw error;
  }
}
