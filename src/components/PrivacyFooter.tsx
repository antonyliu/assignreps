import Link from "next/link";

/**
 * The quiet footer line on every student- and parent-facing screen.
 *
 * ⚠️ WHY IT EXISTS: until now nothing under /student or /parent linked to
 * /privacy, /terms or /faq — every reference lived in the landing page and
 * /faq alone. That mattered most for the people least able to do anything
 * about it: students on a token link, many of them minors, and the parents
 * whose data the policy actually describes.
 *
 * ⚠️ NOT a new pattern. The parent view already shipped this exact treatment —
 * 11px, `mt-auto pt-8 text-center` — as "Read-only view · Reps". This lifts it
 * into one place so the four call sites cannot drift, and adds a link to it.
 * ⚠️ The COLOUR is no longer that line's original text-reps-dim/50; see the
 * note at the paragraph below.
 *
 * ⚠️ Links to the MINORS ANCHOR, not the top of /privacy. That page is
 * addressed to coaches for five sections before reaching the one written for
 * parents; a parent who taps this should land where the answer is, not read
 * about Stripe customer IDs first.
 *
 * ⚠️ NOT on the log screen or the celebrate screen, deliberately. The log
 * screen's bottom is a `sticky bottom-0` CTA whose spacing and gradient are
 * documented to the pixel in CLAUDE.md; anything below it either sits under a
 * sticky element or fights it. Celebrate is a single congratulatory beat and is
 * one tap from the home screen, which has this.
 */
export default function PrivacyFooter({
  /** Optional text before the link — the parent view's "Read-only view". */
  prefix,
}: {
  prefix?: string;
}) {
  return (
    <div className="mt-auto pt-8 text-center">
      {/* ⚠️ #7a8090 (4.99:1), NOT the text-reps-dim/50 this shipped with.
          That resolved to #494d5c at 2.35:1 and FAILED AA. The comment here
          used to defend it as "fine for a decorative label" — but this line
          carries the parent view's "Read-only view" prefix, which states what
          the screen IS. That is information, not decoration. Fixed in the
          Aug 21 contrast sweep.

          ⚠️ THE HIERARCHY THE OLD VALUE EXISTED FOR IS PRESERVED. The point
          was that the line sits quieter than the link inside it, and it still
          does: #7a8090 at 4.99:1 against the link's #8a8fa8 at 6.17:1. Both
          now clear 4.5. No alpha of reps-dim could do this — /80 is still only
          4.31:1, so opacity had to give way to a solid value. */}
      <p className="text-[11px] text-[#7a8090]">
        {prefix ? `${prefix} · ` : ""}
        {/* ⚠️ The LINK is text-reps-sub at full opacity, NOT the dim/50 the line
            around it uses. Measured on the app background: dim/50 resolves to
            #494d5c at 2.35:1, which is fine for a decorative label and not fine
            for something a person is meant to find and tap. Full-opacity
            #8a8fa8 is 6.17:1.

            ⚠️ min-h-[44px] gives it a real tap target. At 11px the label is
            about 13px tall, which is a dead zone on a phone — the same defect
            that made seven back links need several taps. The negative margin
            keeps that target from adding height to the footer, so the line
            looks identical to the one the parent view already shipped. */}
        <Link
          href="/privacy#students-and-minors"
          className="inline-flex min-h-[44px] items-center px-2 -my-[16px] align-middle text-reps-sub underline underline-offset-2 hover:text-reps-ink transition-colors"
          style={{ WebkitTapHighlightColor: "transparent" }}
        >
          Privacy
        </Link>
        {" · Reps"}
      </p>
    </div>
  );
}
