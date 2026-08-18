/**
 * The exact sentence a coach is told to say before entering someone else's
 * phone number.
 *
 * ⚠️ ONE CANONICAL COPY, imported by both places that show it: /terms, where it
 * is the binding obligation, and the add-student screen, where it is the only
 * place a coach can actually act on it. It lived only in /terms until Aug 18
 * 2026 — buried in a document nothing in the app ever linked to, which is the
 * gap this closes.
 *
 * ⚠️ Do NOT reword it in one place. The Aug 16 /faq removal is the precedent:
 * a second, softer telling of this same requirement was written and pulled
 * before it ever shipped, because it read as reassurance where the legal pages
 * read as an obligation. Two versions of this sentence is exactly that failure.
 *
 * ⚠️ The Twilio toll-free registration rests on this requirement, so it is the
 * one clause here with an outside party relying on it.
 *
 * Quotation marks are NOT part of the string — each render site wraps it, since
 * the quotes are presentation rather than content.
 */
export const SMS_CONSENT_SCRIPT =
  "I'd like to send your practice assignments through Reps. You'll get a text with a link to view and log your work. Is that okay?";
