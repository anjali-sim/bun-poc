/**
 * Authentication Constants
 * Messages and constraints for authentication forms
 */

export const AUTH_CONSTRAINTS = {
  USERNAME_MIN_LENGTH: 3,
  USERNAME_MAX_LENGTH: 20,
  PASSWORD_MIN_LENGTH: 6,
  PASSWORD_MAX_LENGTH: 50,
  EMAIL_VALIDATION: "email",
} as const;

export const AUTH_MESSAGES = {
  ERRORS: {
    INVALID_EMAIL: "Invalid email address",
    PASSWORD_REQUIRED: "Password is required",
    PASSWORD_TOO_SHORT: `Password must be at least ${AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH} characters`,
    PASSWORD_TOO_LONG: `Password must be less than ${AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH} characters`,
    USERNAME_REQUIRED: "Username is required",
    USERNAME_TOO_SHORT: `Username must be at least ${AUTH_CONSTRAINTS.USERNAME_MIN_LENGTH} characters`,
    USERNAME_TOO_LONG: `Username must be less than ${AUTH_CONSTRAINTS.USERNAME_MAX_LENGTH} characters`,
    USERNAME_INVALID_CHARS:
      "Username can only contain letters, numbers, underscores, and hyphens",
    CONFIRM_PASSWORD_REQUIRED: "Please confirm your password",
    PASSWORDS_DONT_MATCH: "Passwords do not match",
    LOGIN_FAILED: "Login failed",
    REGISTRATION_FAILED: "Registration failed",
    AUTO_LOGIN_FAILED:
      "Registration successful, but auto-login failed. Please login.",
    LOGOUT_FAILED: "Logout failed",
    GENERAL_ERROR: "An error occurred. Please try again.",
  },
  LOADING: {
    LOADING: "Loading...",
    LOGIN: "Login",
    REGISTER: "Register",
  },
  UI: {
    LOGIN: "Login",
    REGISTER: "Register",
    LOGOUT: "Logout",
    LOGIN_REGISTER: "Login / Register",
    NO_ACCOUNT: "Don't have an account?",
    HAVE_ACCOUNT: "Already have an account?",
  },
} as const;
