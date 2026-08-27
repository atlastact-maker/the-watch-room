// Registration opens Tuesday 1st September 2026, as announced in the
// weekly dev update. Until then the signup page shows a holding state
// and the signup action refuses submissions — the page gate alone would
// leave the endpoint open to anyone who kept the form HTML around.
//
// UK-anchored (BST) rather than the visitor's clock, because the
// announcement was made to a UK audience and the date must flip at the
// same moment for everyone.

export const SIGNUP_OPENS_AT = Date.parse("2026-09-01T00:00:00+01:00");

export function signupOpen(now = Date.now()): boolean {
  return now >= SIGNUP_OPENS_AT;
}
