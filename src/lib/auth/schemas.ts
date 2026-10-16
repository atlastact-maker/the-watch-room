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

export const ADVISOR_SERVICES = [
  "Fire & Rescue",
  "Ambulance",
  "Police",
  // Deliberately service-neutral: fire control, ambulance EOC and police
  // FCC are all control rooms, and control room experience is exactly
  // what an operator game needs advising on.
  "Control Room / 999",
  "Other",
] as const;

export const ADVISOR_STATUSES = [
  "Currently serving",
  "Retired",
  "Previously served",
] as const;

export const ADVISOR_TOPICS = [
  "Control room & mobilising",
  "Incident command & JESIP",
  "BA & firefighting operations",
  "RTCs & technical rescue",
  "Clinical & casualty care",
  "Police operations & scene management",
  "Aviation (HEMS / NPAS)",
  "Appliances, kit & equipment",
  "Wildfire & specialist operations",
] as const;

export const ADVISOR_INVOLVEMENT = [
  "Occasional questions",
  "Review new features",
  "Regular playtesting & feedback",
  "Whatever helps",
] as const;

export const AdvisorSchema = z.object({
  advisorService: z.enum(ADVISOR_SERVICES, {
    error: "Pick your service.",
  }),
  advisorStatus: z.enum(ADVISOR_STATUSES, {
    error: "Pick your current status.",
  }),
  advisorBackground: z
    .string()
    .trim()
    .min(2, { error: "Tell us your role — e.g. Crew Manager · 12 years." })
    .max(120, { error: "120 characters max." }),
  advisorForce: z.string().trim().max(60, { error: "60 characters max." }).optional(),
  advisorTopics: z
    .array(z.enum(ADVISOR_TOPICS))
    .min(1, { error: "Pick at least one area you can advise on." }),
  advisorInvolvement: z.enum(ADVISOR_INVOLVEMENT, {
    error: "Pick how involved you'd like to be.",
  }),
  advisorNotes: z.string().trim().max(600, { error: "600 characters max." }).optional(),
  advisorContactOk: z.boolean(),
  advisorDiscord: z.string().trim().max(40, { error: "40 characters max." }).optional(),
});

export type AdvisorAnswers = z.infer<typeof AdvisorSchema>;

export const CodeRequestSchema = z.object({
  email: z.email({ error: "Enter a valid email." }).trim(),
});

export const CodeVerifySchema = z.object({
  email: z.email({ error: "Enter a valid email." }).trim(),
  // Supabase issues the code at the length the project is set to (eight
  // digits here; six is its default), so both are taken. Spaces typed
  // between groups of digits are dropped.
  token: z.preprocess((v) => (typeof v === "string" ? v.replace(/\s+/g, "") : v), z.string().regex(/^[0-9]{6,8}$/, { error: "Enter the digits of the code from the message." })),
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
      /** Sign-in refused because this address has not confirmed its email. */
      unconfirmed?: string;
      /** A sign-in code has been requested for this address. */
      codeSent?: string;
      errors?: {
        callsign?: string[];
        email?: string[];
        password?: string[];
        confirm?: string[];
        acceptTerms?: string[];
        advisorService?: string[];
        advisorStatus?: string[];
        advisorBackground?: string[];
        advisorForce?: string[];
        advisorTopics?: string[];
        advisorInvolvement?: string[];
        advisorNotes?: string[];
        advisorDiscord?: string[];
        token?: string[];
        form?: string[];
      };
    }
  | undefined;
