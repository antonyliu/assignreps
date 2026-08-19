/**
 * The exact sentence a coach is told to say before entering someone else's
 * phone number.
 *
 * ⚠️ ONE CONSUMER as of Aug 18 2026: /terms, in "Your responsibilities".
 *
 * It briefly had two. The add-student screen showed it behind a "What to say"
 * disclosure, and that was pulled the same day after a design review — the
 * script read as an unfamiliar pattern on a screen whose other copy is a single
 * short line. That screen still states the REQUIREMENT, in its own plain
 * wording behind an info icon; it just no longer quotes this.
 *
 * ⚠️ The constant is kept rather than inlined back into /terms, because the
 * moment a second surface needs this sentence it must be THIS sentence. The Aug
 * 16 /faq removal is the precedent for what a second, independently-worded
 * telling costs: it read as reassurance where the legal pages read as an
 * obligation, and was pulled before it ever shipped.
 *
 * ⚠️ The Twilio toll-free registration rests on this requirement, so it is the
 * one clause here with an outside party relying on it.
 *
 * Quotation marks are NOT part of the string — each render site wraps it, since
 * the quotes are presentation rather than content.
 */
export const SMS_CONSENT_SCRIPT =
  "I'd like to send your practice assignments through Reps. You'll get a text with a link to view and log your work. Is that okay?";
