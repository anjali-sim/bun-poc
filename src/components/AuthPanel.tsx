import { useState } from "react";
import { loginSchema, registerSchema, type AuthFormErrors } from "../schemas";
import { AUTH_MESSAGES, API_ENDPOINTS, API_CONFIG } from "../constants";

interface AuthProps {
  onLogin: (user: { id: number; username: string; email: string }) => void;
  onLogout?: () => void;
  isLoggedIn?: boolean;
  currentUser?: { id: number; username: string; email: string };
}

export function AuthPanel({
  onLogin,
  onLogout,
  isLoggedIn,
  currentUser,
}: AuthProps) {
  const [showForm, setShowForm] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationErrors, setValidationErrors] = useState<AuthFormErrors>({});
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setValidationErrors({});
    setLoading(true);

    try {
      if (isLogin) {
        // Login validation
        const result = loginSchema.safeParse({
          email: formData.email,
          password: formData.password,
        });

        if (!result.success) {
          const fieldErrors: AuthFormErrors = {};
          result.error.issues.forEach((issue) => {
            const path = issue.path[0] as string;
            fieldErrors[path] = issue.message;
          });
          setValidationErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
          method: "POST",
          headers: API_CONFIG.DEFAULT_HEADERS,
          body: JSON.stringify({
            email: result.data.email,
            password: result.data.password,
          }),
          credentials: "include",
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || AUTH_MESSAGES.ERRORS.LOGIN_FAILED);
          setLoading(false);
          return;
        }

        onLogin(data.user);
        setFormData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        setShowForm(false);
      } else {
        // Register validation
        const result = registerSchema.safeParse({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });

        if (!result.success) {
          const fieldErrors: AuthFormErrors = {};
          result.error.issues.forEach((issue) => {
            const path = issue.path[0] as string;
            fieldErrors[path] = issue.message;
          });
          setValidationErrors(fieldErrors);
          setLoading(false);
          return;
        }

        const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
          method: "POST",
          headers: API_CONFIG.DEFAULT_HEADERS,
          body: JSON.stringify({
            username: result.data.username,
            email: result.data.email,
            password: result.data.password,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || AUTH_MESSAGES.ERRORS.REGISTRATION_FAILED);
          setLoading(false);
          return;
        }

        // Auto-login after registration
        const loginResponse = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
          method: "POST",
          headers: API_CONFIG.DEFAULT_HEADERS,
          body: JSON.stringify({
            email: result.data.email,
            password: result.data.password,
          }),
          credentials: "include",
        });

        const loginData = await loginResponse.json();
        if (loginResponse.ok) {
          onLogin(loginData.user);
          setFormData({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
          });
          setShowForm(false);
        } else {
          setError(AUTH_MESSAGES.ERRORS.AUTO_LOGIN_FAILED);
        }
      }
    } catch (err) {
      setError(AUTH_MESSAGES.ERRORS.GENERAL_ERROR);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
        method: "POST",
        credentials: "include",
      });
      onLogout?.();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  if (isLoggedIn && currentUser) {
    return (
      <div className="flex items-center gap-4">
        <div className="text-white">
          <p className="text-sm font-semibold">{currentUser.username}</p>
          <p className="text-xs text-gray-400">{currentUser.email}</p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-all"
        >
          {AUTH_MESSAGES.UI.LOGOUT}
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {!showForm ? (
        <button
          onClick={() => {
            setShowForm(true);
            setIsLogin(true);
            setError("");
          }}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition-all"
        >
          {AUTH_MESSAGES.UI.LOGIN_REGISTER}
        </button>
      ) : (
        <div className="absolute right-0 mt-2 w-96 bg-white/10 backdrop-blur rounded-lg shadow-lg p-6 border border-white/20 z-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-white">
              {isLogin ? AUTH_MESSAGES.UI.LOGIN : AUTH_MESSAGES.UI.REGISTER}
            </h3>
            <button
              onClick={() => setShowForm(false)}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ×
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-white/5 border rounded text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 ${
                    validationErrors.username
                      ? "border-red-500"
                      : "border-white/20"
                  }`}
                  placeholder="Your username"
                />
                {validationErrors.username && (
                  <p className="text-red-400 text-xs mt-1">
                    {validationErrors.username}
                  </p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-white/5 border rounded text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 ${
                  validationErrors.email ? "border-red-500" : "border-white/20"
                }`}
                placeholder="your@email.com"
              />
              {validationErrors.email && (
                <p className="text-red-400 text-xs mt-1">
                  {validationErrors.email}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Password <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 bg-white/5 border rounded text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 ${
                  validationErrors.password
                    ? "border-red-500"
                    : "border-white/20"
                }`}
                placeholder="Your password"
              />
              {validationErrors.password && (
                <p className="text-red-400 text-xs mt-1">
                  {validationErrors.password}
                </p>
              )}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-white mb-2">
                  Confirm Password <span className="text-red-400">*</span>
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 bg-white/5 border rounded text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 ${
                    validationErrors.confirmPassword
                      ? "border-red-500"
                      : "border-white/20"
                  }`}
                  placeholder="Confirm password"
                />
                {validationErrors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">
                    {validationErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-600 text-white rounded-lg font-semibold transition-all"
            >
              {loading
                ? AUTH_MESSAGES.LOADING.LOADING
                : isLogin
                ? AUTH_MESSAGES.LOADING.LOGIN
                : AUTH_MESSAGES.LOADING.REGISTER}
            </button>
          </form>

          <div className="mt-4 text-center">
            <p className="text-sm text-gray-400">
              {isLogin
                ? AUTH_MESSAGES.UI.NO_ACCOUNT
                : AUTH_MESSAGES.UI.HAVE_ACCOUNT}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setValidationErrors({});
                  setFormData({
                    username: "",
                    email: "",
                    password: "",
                    confirmPassword: "",
                  });
                }}
                className="ml-1 text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                {isLogin ? AUTH_MESSAGES.UI.REGISTER : AUTH_MESSAGES.UI.LOGIN}
              </button>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
