// One answer to "is this coach entitled to paid features?", asked from more
// than one place.
//
// The free tier is 3 students forever; the paywall sits at the 4th. Two
// surfaces need this question answered and they must never disagree:
//
//   1. ProfileMenu — whether to offer "Upgrade to Pro"
//   2. The add-student gate — whether to allow a 4th student
//
// A coach shown "Upgrade" who is already paying, or blocked at 3 students
// despite an active subscription, are the same bug seen from two ends. This is
// the isComplete() lesson applied before the drift rather than after it: one
// rule, every caller routed through it.

/** Stripe subscription statuses that grant access. */
const ENTITLED_STATUSES = new Set(["active", "trialing"]);

/**
 * ⚠️ An ALLOWLIST, deliberately, not a denylist.
 *
 * Stripe owns this vocabulary — incomplete, incomplete_expired, trialing,
 * active, past_due, canceled, unpaid, paused — and has extended it before. A
 * denylist would silently grant access to any status Stripe invents next; an
 * allowlist denies it. Unrecognised means unentitled: this FAILS CLOSED.
 *
 * That is also why `subscription_status` carries no CHECK constraint at the
 * database level. The column accepts whatever Stripe reports so the webhook can
 * never be rejected mid-update, and the judgement about what those values MEAN
 * lives here instead. See the coaches billing columns note in CLAUDE.md.
 *
 * `past_due` is deliberately NOT entitled. Stripe keeps retrying a failed
 * payment for weeks before giving up, and treating that window as paid means a
 * coach who never successfully pays keeps full access throughout it.
 *
 * ⚠️ COACHRJ needs no special case. A 100%-off-forever coupon still produces a
 * real subscription reporting 'active' at $0, so RJ passes this check by the
 * same rule as a paying coach — matching the decision that the 3-student limit
 * applies identically to everyone regardless of how they got past it.
 */
export function isEntitled(subscriptionStatus: string | null | undefined): boolean {
  if (!subscriptionStatus) return false;
  return ENTITLED_STATUSES.has(subscriptionStatus);
}

/** The free tier's student limit. The paywall is the 4th student. */
export const FREE_STUDENT_LIMIT = 3;
