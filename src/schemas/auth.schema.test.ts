import { describe, expect, it } from "vitest";
import {
  signInSchema,
  signUpSchema,
  updatePasswordSchema,
} from "@/schemas/auth.schema";

describe("authentication validation", () => {
  it("normalizes email addresses", () => {
    const result = signInSchema.safeParse({
      email: "  Student@Example.edu ",
      password: "long-enough-password",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("student@example.edu");
    }
  });

  it("rejects passwords that do not match during signup", () => {
    const result = signUpSchema.safeParse({
      email: "student@example.edu",
      password: "long-enough-password",
      confirmPassword: "a-different-password",
    });

    expect(result.success).toBe(false);
  });

  it("applies the same confirmation rule to password resets", () => {
    const result = updatePasswordSchema.safeParse({
      password: "long-enough-password",
      confirmPassword: "long-enough-password",
    });

    expect(result.success).toBe(true);
  });
});
