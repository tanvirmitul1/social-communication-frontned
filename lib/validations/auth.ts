/**
 * Authentication validation schemas using Zod
 */

import { z } from "zod";
import { VALIDATION } from "@/lib/constants";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z
    .string()
    .min(VALIDATION.USERNAME.MIN_LENGTH, `Username must be at least ${VALIDATION.USERNAME.MIN_LENGTH} characters`)
    .max(VALIDATION.USERNAME.MAX_LENGTH, `Username must be less than ${VALIDATION.USERNAME.MAX_LENGTH} characters`)
    .regex(VALIDATION.USERNAME.PATTERN, "Username can only contain letters, numbers, and underscores"),
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z
    .string()
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `Password must be at least ${VALIDATION.PASSWORD.MIN_LENGTH} characters`)
    .max(VALIDATION.PASSWORD.MAX_LENGTH, `Password must be less than ${VALIDATION.PASSWORD.MAX_LENGTH} characters`)
    .regex(
      VALIDATION.PASSWORD.PATTERN,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
