/**
 * Expense Constants
 * Configuration and constraints for expenses
 */

export const EXPENSE_CONSTRAINTS = {
  DESCRIPTION_MIN_LENGTH: 3,
  DESCRIPTION_MAX_LENGTH: 100,
  AMOUNT_MAX_VALUE: 1000000,
  REDIRECT_DELAY_MS: 1500,
} as const;

export const FORM_MESSAGES = {
  ERRORS: {
    DESCRIPTION_REQUIRED: "Description is required",
    DESCRIPTION_TOO_SHORT: `Description must be at least ${EXPENSE_CONSTRAINTS.DESCRIPTION_MIN_LENGTH} characters`,
    DESCRIPTION_TOO_LONG: `Description must be less than ${EXPENSE_CONSTRAINTS.DESCRIPTION_MAX_LENGTH} characters`,
    AMOUNT_INVALID: "Amount must be greater than 0",
    AMOUNT_NOT_FINITE: "Amount must be a valid number",
    AMOUNT_TOO_LARGE: "Amount is too large",
    CATEGORY_INVALID: "Please select a valid category",
    DATE_INVALID: "Invalid date format",
    DATE_IN_FUTURE: "Date cannot be in the future",
    ADD_EXPENSE_FAILED: "Failed to add expense",
  },
  SUCCESS: {
    EXPENSE_ADDED: "✅ Expense added successfully!",
  },
  LOADING: {
    ADDING: "Adding...",
    ADD_BUTTON: "✅ Add Expense",
  },
  INFO: {
    TIP: "💡 Tip: Expenses are saved with the current date by default. You can change this before submitting.",
  },
} as const;
