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

export type AuthFormState =
  | {
      ok?: false;
      errors?: {
        callsign?: string[];
        email?: string[];
        password?: string[];
        acceptTerms?: string[];
        form?: string[];
      };
    }
  | undefined;
