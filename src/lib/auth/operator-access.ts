// Closed development: the game is locked to an allowlist while accounts
// and advisor sign-ups stay open. Signing up is the advisor programme's
// front door, so registration must keep working — what is gated is the
// operator side: the menu and the shift itself.
//
// The allowlist is OPERATOR_ALLOWLIST, a comma-separated list of emails,
// with the developer's own account as the zero-config default so an
// unset variable locks the site without locking Luke out of it.

const DEFAULT_OPERATORS = ["atlastact@gmail.com"];

export function isOperator(email: string | undefined | null): boolean {
  if (!email) return false;
  const raw = process.env.OPERATOR_ALLOWLIST;
  const list = raw
    ? raw
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    : DEFAULT_OPERATORS;
  return list.includes(email.trim().toLowerCase());
}
