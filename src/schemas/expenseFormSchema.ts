/**
 * Zod Schemas
 * Centralized validation schemas for expense forms
 */

import { z } from "zod";
import {
  CATEGORY_NAMES,
  EXPENSE_CONSTRAINTS,
  FORM_MESSAGES,
} from "../constants";

const { ERRORS } = FORM_MESSAGES;
const { DESCRIPTION_MIN_LENGTH, DESCRIPTION_MAX_LENGTH, AMOUNT_MAX_VALUE } =
  EXPENSE_CONSTRAINTS;

/**
 * Expense form validation schema
 */
export const expenseFormSchema = z.object({
  description: z
    .string()
    .min(1, ERRORS.DESCRIPTION_REQUIRED)
    .min(DESCRIPTION_MIN_LENGTH, ERRORS.DESCRIPTION_TOO_SHORT)
    .max(DESCRIPTION_MAX_LENGTH, ERRORS.DESCRIPTION_TOO_LONG)
    .trim(),
  amount: z.coerce
    .number()
    .positive(ERRORS.AMOUNT_INVALID)
    .finite(ERRORS.AMOUNT_NOT_FINITE)
    .max(AMOUNT_MAX_VALUE, ERRORS.AMOUNT_TOO_LARGE),
  category: z.enum(CATEGORY_NAMES).refine((val) => val !== undefined, {
    message: ERRORS.CATEGORY_INVALID,
  }),
  date: z
    .string()
    .date(ERRORS.DATE_INVALID)
    .refine((date) => new Date(date) <= new Date(), ERRORS.DATE_IN_FUTURE),
});

/**
 * Type inference from schema
 */
export type ExpenseFormData = z.infer<typeof expenseFormSchema>;

/**
 * Partial error type for form fields
 */
export type FormErrors = Partial<Record<keyof ExpenseFormData, string>>;
