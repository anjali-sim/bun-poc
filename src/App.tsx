import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
  Link,
} from "react-router-dom";
import "./index.css";
import { useExpenseContext } from "./hooks/useExpenseContext";
import { AuthPanel } from "./components/AuthPanel";
import { Dashboard } from "./components/Dashboard";
import { AddExpense } from "./components/AddExpense";
import { ManageCategories } from "./components/ManageCategories";
import { ExpensesList } from "./components/ExpensesList";
import { DataManagement } from "./components/DataManagement";
import { API_ENDPOINTS } from "./constants";

export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<{
    id: number;
    username: string;
    email: string;
  } | null>(null);
  const expenseContext = useExpenseContext();

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch(API_ENDPOINTS.AUTH.ME, {
          credentials: "include",
        });
        if (response.ok) {
          const data = await response.json();
          setCurrentUser(data.user);
          setIsLoggedIn(true);
        }
      } catch (err) {
        // User is not logged in
        setIsLoggedIn(false);
      }
    };
    checkAuth();
  }, []);

  const handleLogin = (user: {
    id: number;
    username: string;
    email: string;
  }) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  return (
    <Router>
      <div className="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Navigation */}
          <nav className="mb-8 flex justify-between items-center">
            <div className="flex gap-2 flex-wrap">
              {isLoggedIn && (
                <>
                  <NavButton label="📊 Dashboard" href="/dashboard" />
                  <NavButton label="➕ Add Expense" href="/add-expense" />
                  <NavButton label="📋 All Expenses" href="/expenses" />
                  <NavButton label="🏷️ Categories" href="/categories" />
                  <NavButton
                    label="📊 Data Management"
                    href="/data-management"
                  />
                </>
              )}
            </div>
            <AuthPanel
              onLogin={handleLogin}
              onLogout={handleLogout}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser || undefined}
            />
          </nav>

          {/* Page Content */}
          {!isLoggedIn ? (
            <div className="text-center py-20">
              <h2 className="text-4xl font-bold text-white mb-4">
                Welcome to Expense Tracker
              </h2>
              <p className="text-xl text-gray-300 mb-8">
                Please login or register to get started
              </p>
              <p className="text-gray-400">
                This app demonstrates Bun's authentication concepts with cookies
                and hashing
              </p>
            </div>
          ) : (
            <Routes>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add-expense" element={<AddExpense />} />
              <Route path="/categories" element={<ManageCategories />} />
              <Route path="/expenses" element={<ExpensesList />} />
              <Route path="/data-management" element={<DataManagement />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          )}

          {/* Footer */}
          <footer className="mt-12 text-center text-gray-400 text-sm border-t border-white/10 pt-6">
            <p>
              Built with <span className="text-indigo-400">Bun</span> +{" "}
              <span className="text-blue-400">React</span> +{" "}
              <span className="text-green-400">SQLite</span> - A POC showcasing
              Bun concepts
            </p>
          </footer>
        </div>
      </div>
    </Router>
  );
}

interface NavButtonProps {
  label: string;
  href: string;
}

function NavButton({ label, href }: NavButtonProps) {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={`px-4 py-2 rounded-lg font-semibold transition-all ${
        isActive
          ? "bg-indigo-600 text-white shadow-lg"
          : "bg-white/10 text-gray-300 hover:bg-white/20 border border-white/20"
      }`}
    >
      {label}
    </Link>
  );
}

export default App;
