/**
 * Authentication Schemas
 * Zod validation schemas for login and registration forms
 */

import { z } from "zod";
import { AUTH_MESSAGES, AUTH_CONSTRAINTS } from "../constants";

/**
 * Login form validation schema
 */
export const loginSchema = z.object({
  email: z.string().email(AUTH_MESSAGES.ERRORS.INVALID_EMAIL),
  password: z
    .string()
    .min(1, AUTH_MESSAGES.ERRORS.PASSWORD_REQUIRED)
    .min(6, AUTH_MESSAGES.ERRORS.PASSWORD_TOO_SHORT),
});

/**
 * Register form validation schema
 * Includes password confirmation validation
 */
export const registerSchema = z
  .object({
    username: z
      .string()
      .min(1, AUTH_MESSAGES.ERRORS.USERNAME_REQUIRED)
      .min(
        AUTH_CONSTRAINTS.USERNAME_MIN_LENGTH,
        AUTH_MESSAGES.ERRORS.USERNAME_TOO_SHORT
      )
      .max(
        AUTH_CONSTRAINTS.USERNAME_MAX_LENGTH,
        AUTH_MESSAGES.ERRORS.USERNAME_TOO_LONG
      )
      .regex(/^[a-zA-Z0-9_-]+$/, AUTH_MESSAGES.ERRORS.USERNAME_INVALID_CHARS),
    email: z.string().email(AUTH_MESSAGES.ERRORS.INVALID_EMAIL),
    password: z
      .string()
      .min(1, AUTH_MESSAGES.ERRORS.PASSWORD_REQUIRED)
      .min(
        AUTH_CONSTRAINTS.PASSWORD_MIN_LENGTH,
        AUTH_MESSAGES.ERRORS.PASSWORD_TOO_SHORT
      )
      .max(
        AUTH_CONSTRAINTS.PASSWORD_MAX_LENGTH,
        AUTH_MESSAGES.ERRORS.PASSWORD_TOO_LONG
      ),
    confirmPassword: z
      .string()
      .min(1, AUTH_MESSAGES.ERRORS.CONFIRM_PASSWORD_REQUIRED),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: AUTH_MESSAGES.ERRORS.PASSWORDS_DONT_MATCH,
    path: ["confirmPassword"],
  });

/**
 * Type inference from schemas
 */
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

/**
 * Generic form errors type
 */
export type AuthFormErrors = Partial<Record<string, string>>;
