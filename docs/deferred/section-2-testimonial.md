# Deferred — Section 2's closing testimonial

**Status: BUILT, PULLED, NOT APPROVED. Low priority.**
Removed from `src/app/page.tsx` on **Aug 16 2026** and parked here.

## Why it was pulled

It was placeholder copy making three unverified claims about a **real, named
person** on a public page. It was never approved by RJ, and it was blocking
`src/app/page.tsx` from being committed — that one file also carries the header
nav, the hero CTA rename, the section 2 rewrite, the pricing eyebrow and the
footer colour, all of which are fine to ship. Pulling the testimonial unblocks
the rest.

⚠️ **This markup existed only in the uncommitted working tree — it was in no
commit.** That is why it is saved here in full rather than left to `git show`.
There is nothing to recover it from if this file is lost.

## What needs to happen before it goes back

1. ⚠️ **The quote is a RECONSTRUCTION, not a verbatim sentence.** What is on
   record (see *RJ feedback captured* in CLAUDE.md) is four separate fragments
   reported from a call — "template", "record", "streamlined", "stick to it".
   He never said them as one continuous sentence. Presenting assembled
   fragments inside quotation marks needs his explicit OK on the exact wording.
2. ⚠️ **"AAU coach" is unverified.** It appears nowhere in anything recorded
   about him; the only AAU mention in CLAUDE.md is an unrelated org-licensing
   idea.
3. ⚠️ **"RJW Skills & Development" is unconfirmed by RJ.** It matches the only
   other occurrence in the codebase (a `ProfileMenu` comment), but matching an
   internal comment is not the same as him having checked it.

As of the Aug 6 pause note, RJ had seen it, liked the direction, and was
workshopping his own wording — he said he would reply "by tonight". **That
reply is the most likely thing waiting whenever this is picked up.** Check with
him before restoring anything below.

## How to restore

Both blocks go back into `src/app/page.tsx`.

- The **JSX** goes at the end of `<section className="program-section">`, after
  the closing `</div>` of `.program-inner` and immediately before `</section>`.
  ⚠️ It must sit **OUTSIDE** `.program-inner` — that container becomes a flex
  ROW at >=1024, so a third child would render as a third column beside the copy
  and the screens instead of as a closing line underneath them.
- The **CSS** goes into the `<style href="landing">` block, after the
  `.program-screen-item` rule and before the `.program-caption` comment.
  ⚠️ The `@media (min-width: 768px)` rule at the end MUST stay after the
  `.program-quote-*` base rules. It was first written into the `min-width:768`
  block further up the stylesheet, which sits BEFORE those base rules — equal
  specificity, later wins, so the base silently overrode it and the desktop
  value never applied at any width.

---

## JSX

```tsx
        {/* ⚠️ PLACEHOLDER COPY — NOT APPROVED. Pending RJ's sign-off on the
            exact wording, the business name and the role line before this ships
            to strangers. Three specific things to get confirmed, because each
            is a claim about a real, named person on a public page:

            1. ⚠️ The quote is a RECONSTRUCTION, not a verbatim sentence. What is
               on record (see RJ feedback captured) is four separate fragments
               reported from a call — "template", "record", "streamlined" and
               "stick to it". He never said them as one continuous sentence.
               Presenting assembled fragments inside quotation marks needs his
               explicit OK on the exact wording.
            2. ⚠️ "AAU coach" appears NOWHERE in anything recorded about him. The
               only AAU mention in CLAUDE.md is an unrelated org-licensing
               business idea. This role line is unverified.
            3. ✅ The business name now reads "RJW Skills & Development",
               matching the only other occurrence in this codebase (a
               ProfileMenu comment). It read "RJ Skills & Development" for part
               of Aug 6 and the two disagreed; that is reconciled. ⚠️ Still
               unconfirmed BY RJ, like the two points above — matching an
               internal comment is not the same as him having checked it.

            ⚠️ This sits OUTSIDE .program-inner deliberately. That container turns
            into a flex ROW at >=1024, so a third child would become a third
            column beside the copy and the screens instead of a closing line
            underneath them. */}
        <figure className="program-quote">
          <blockquote className="program-quote-text">
            &ldquo;It&apos;s become a template of my program, a record of it. It&apos;s
            streamlined — it helps me stick to it.&rdquo;
          </blockquote>
          <figcaption>
            <span className="program-quote-name">RJW Skills &amp; Development</span>
            <span className="program-quote-role">AAU coach and private instructor</span>
          </figcaption>
        </figure>
```

## CSS

```css
        /* ---- Section 2's closing testimonial -------------------------------
           A standalone centred note under the two-column layout, in the same
           spirit as "Everything included, always" sitting below the pricing
           cards — it closes the section rather than joining the grid above it.

           ⚠️ It must NOT compete with the CTA. Everything here is quieter than
           "Get organized": no fill, no elevation, no brand colour, and the
           brightest ink in the block (#c8cdd8 on the name) is still well below
           the heading's #eef0f4. The quote is italic, which reads as reported
           speech rather than as another thing to click. */
        .program-quote {
          margin: 52px auto 0;
          max-width: 560px;
          text-align: center;
        }
        .program-quote-text {
          margin: 0;
          font-size: 19px;
          font-style: italic;
          line-height: 1.5;
          /* ⚠️ #9095ac is the value already proven on this exact #262a39 band
             — it is what .program-caption uses and what the footer moved to.
             Re-measured here anyway rather than assumed, because the AA
             requirement depends on size and weight, not just the ratio. */
          color: #9095ac;
          text-wrap: pretty;
        }
        .program-quote figcaption {
          margin-top: 18px;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .program-quote-name {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.4;
          color: #c8cdd8;
        }
        /* ⚠️ #9095ac, NOT the #7d8494 this was specified as. Measured, #7d8494
           is 3.80:1 on this band — under AA for 13px text. This is the
           .program-caption lesson again: a plausible-looking muted grey that
           fails once measured.

           ⚠️ There is no darker option worth taking. On #262a39 the 4.5 floor
           lands almost exactly at #9095ac (4.81:1); the only darker passing
           values are #8d93a8 at 4.67 and #8a91a2 at 4.52, both newly invented
           and the second only 0.02 above failing. So the third tier is carried
           by SIZE and WEIGHT instead of colour — 13px/400 against the name's
           14px/600 and 8.95:1. It still reads as the quieter of the two. */
        .program-quote-role {
          font-size: 13px;
          line-height: 1.4;
          color: #9095ac;
        }

        /* ⚠️ This block MUST stay after the .program-quote-* base rules above.
           It was first written into the min-width:768 block further up the
           stylesheet, which sits BEFORE those base rules — equal specificity,
           later wins, so the base silently overrode it and the desktop value
           never applied at any width. Measured 19px at 1280 when it should have
           been the desktop value. That is the fifth instance of this exact bug
           in this file.

           ⚠️ No font-size bump here on purpose. The quote stays 19px at every
           width: the section 2 CTA is 19px too, and a quote set LARGER than the
           button it sits under starts competing with it. Separation comes from
           weight, style and fill, not size. */
        @media (min-width: 768px) {
          .program-quote { margin-top: 68px; }
        }
```
