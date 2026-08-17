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

/** The free tier's ACTIVE-student limit. The paywall is the 4th active student. */
export const FREE_STUDENT_LIMIT = 3;

/**
 * The Pro plan's ACTIVE-student ceiling.
 *
 * ⚠️ NEW as of the deactivation build. Until then "up to 30" was copy on three
 * unlinked surfaces — the landing pricing card, /faq, and the in-app paywall in
 * AddPlayerForm — with nothing behind it, and a Pro coach could pass 30 freely.
 * Those three strings and this constant now have to move together; changing one
 * without the others puts the number a coach reads out of step with the number
 * the gate enforces.
 */
export const PRO_STUDENT_LIMIT = 30;

/**
 * How many ACTIVE students this coach's current plan allows.
 *
 * ⚠️ ACTIVE, not total. A deactivated student (players.deactivated_at IS NOT
 * NULL) is a full pause — no new work can be assigned to them and they cannot
 * log — so they do not consume a seat. That is the whole reason deactivation
 * closes the loophole it was built for: a Pro coach could otherwise add 30
 * students, cancel, and keep all 30 running on Free forever.
 *
 * ⚠️ ONE HELPER, asked by every gate, for the same reason isEntitled() is one
 * helper. Two places enforce a seat limit and must never disagree about what the
 * limit IS:
 *
 *   1. addPlayer()      — adding a new student
 *   2. activatePlayer() — bringing a paused student back
 *
 * Those are the same question from two directions: "does this coach have room
 * for one more active student?" A coach blocked from reactivating someone they
 * could have added fresh, or the reverse, is one bug seen from two ends.
 *
 * ⚠️ Routed through isEntitled() rather than comparing status strings here, so
 * the plan question is answered in exactly one place and this helper inherits
 * its fail-closed behaviour: an unrecognised Stripe status is unentitled, and an
 * unentitled coach gets the free limit.
 */
export function activeStudentLimit(
  subscriptionStatus: string | null | undefined
): number {
  return isEntitled(subscriptionStatus) ? PRO_STUDENT_LIMIT : FREE_STUDENT_LIMIT;
}
