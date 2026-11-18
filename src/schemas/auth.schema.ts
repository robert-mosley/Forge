import { z } from "zod";

const email = z.string().trim().email("Enter a valid email address.").toLowerCase();

export const signInSchema = z.object({
  email,
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z
  .object({
    email,
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(72, "Use a password under 72 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords do not match.",
  });

export const resetRequestSchema = z.object({ email });

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .max(72, "Use a password under 72 characters."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "The passwords do not match.",
  });
