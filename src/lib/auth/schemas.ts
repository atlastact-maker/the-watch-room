import * as z from "zod";

export const LoginSchema = z.object({
  email: z.email({ error: "Enter a valid email." }).trim(),
  password: z.string().min(1, { error: "Password is required." }),
});

export const SignupSchema = z.object({
  callsign: z
    .string()
    .trim()
    .min(2, { error: "At least 2 characters." })
    .max(24, { error: "24 characters max." })
    .regex(/^[a-zA-Z0-9 _-]+$/, {
      error: "Letters, numbers, spaces, - and _ only.",
    }),
  email: z.email({ error: "Enter a valid email." }).trim(),
  password: z
    .string()
    .min(8, { error: "At least 8 characters." })
    .regex(/[a-zA-Z]/, { error: "Include a letter." })
    .regex(/[0-9]/, { error: "Include a number." }),
  acceptTerms: z.literal(true, {
    error: "You must accept the terms & conditions.",
  }),
  newsletter: z.boolean(),
});

export const ForgotPasswordSchema = z.object({
  email: z.email({ error: "Enter a valid email." }).trim(),
});

export const ResetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { error: "At least 8 characters." })
      .regex(/[a-zA-Z]/, { error: "Include a letter." })
      .regex(/[0-9]/, { error: "Include a number." }),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    error: "Passwords don't match.",
    path: ["confirm"],
  });

export type AuthFormState =
  | {
      ok?: boolean;
      /** Signup succeeded but the account needs email confirmation. */
      needsConfirmation?: boolean;
      /** Positive feedback line (e.g. reset email sent). */
      message?: string;
      errors?: {
        callsign?: string[];
        email?: string[];
        password?: string[];
        confirm?: string[];
        acceptTerms?: string[];
        form?: string[];
      };
    }
  | undefined;
