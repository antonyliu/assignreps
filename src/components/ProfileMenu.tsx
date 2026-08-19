"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";
import { User } from "lucide-react";
import { useUpgrade } from "@/lib/use-upgrade";
import { createPortalSession } from "@/app/instructor/billing/actions";

// The display name is what students and parents see — "[Coach] assigned you
// basketball homework" in the SMS, "[Coach] will see this" on the celebrate
// screen, and the header of the parent digest. The roster itself no longer
// prints it, so this menu is the only place it is visible to the coach.

// Profile control: a person silhouette on the right of the header, in a
// contained circle echoing the roster's student avatars (26px, #252830 on a
// hairline #2a2d36) so the header's right end matches the rows below it. It is
// the only thing on that side — the coach's name used to sit beside it in the
// header, and now appears at the top of the dropdown instead, where it labels
// the account the actions below belong to. "Sign out" is gated behind a
// confirmation dialog so an accidental tap can't end the session.
export default function ProfileMenu({
  coachName,
  // Whether the coach is on a paid plan. Decided by isEntitled() on the server
  // — the same helper the add-student gate uses, so this menu and the paywall
  // can never disagree about what "Pro" means.
  isPro,
}: {
  coachName: string;
  isPro: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState(coachName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Shared with the add-student paywall so the two upgrade entry points cannot
  // drift in behaviour — see src/lib/use-upgrade.ts. The menu stays open while
  // it runs; the item reports progress rather than appearing to do nothing.
  const { startUpgrade, upgrading, upgradeError } = useUpgrade();

  // ⚠️ Local state rather than a useBillingPortal hook, deliberately.
  // useUpgrade is a hook because it has TWO call sites — this menu and the
  // add-student paywall — and what must not drift between them is the handler.
  // "Manage subscription" has exactly one entry point, so there is nothing to keep
  // in sync and a hook would be indirection for its own sake. If a second entry
  // point ever appears (a billing screen, the paywall), extract it then, the
  // same way and for the same reason.
  const [portalPending, setPortalPending] = useState(false);
  const [portalError, setPortalError] = useState("");

  async function openBillingPortal() {
    if (portalPending) return;
    setPortalPending(true);
    setPortalError("");

    let result;
    try {
      result = await createPortalSession();
    } catch {
      setPortalPending(false);
      setPortalError("Couldn't open billing. Try again in a moment.");
      return;
    }

    if (!result.ok) {
      setPortalPending(false);
      setPortalError(result.error);
      return;
    }

    // ⚠️ A full navigation, not router.push — Stripe's portal is a different
    // origin and the Next router cannot route to it. Same reason useUpgrade
    // uses window.location.href for Checkout.
    //
    // Deliberately does NOT clear portalPending on success: the tab is leaving,
    // and resetting it would flash the row back to its idle label during the
    // hand-off.
    window.location.href = result.url;
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
  }

  function openEdit() {
    setMenuOpen(false);
    setDraft(coachName);
    setError("");
    setEditOpen(true);
  }

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault();
    const next = draft.trim();
    if (!next) {
      setError("Enter a name.");
      return;
    }
    if (next === coachName.trim()) {
      setEditOpen(false);
      return;
    }
    setSaving(true);
    setError("");

    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      setSaving(false);
      setError("You're signed out. Sign in again to change your name.");
      return;
    }

    // .select() is load-bearing, not decoration. An UPDATE that no RLS policy
    // permits comes back 200 with zero rows rather than as an error, so without
    // asking for the row back this would report success while saving nothing.
    const { data, error: updateError } = await supabase
      .from("coaches")
      .update({ name: next })
      .eq("id", auth.user.id)
      .select("name");

    setSaving(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    if (!data || data.length === 0) {
      setError("Couldn't save that name. Your account may not have permission to change it.");
      return;
    }

    setEditOpen(false);
    // The name is server-rendered on the screens that show it, so re-fetch
    // rather than trusting local state to match what students will see.
    router.refresh();
  }

  return (
    <>
      <div className="relative">
        {/* The tap target and the visible circle are deliberately different
            sizes: 44px is the minimum a thumb should have to find on a court,
            but a 44px disc reads as a button competing with the logo. So the
            button stays 44px and transparent while the mark inside is 26px.
            The -9px margins pull the visible circle back onto the page gutter
            horizontally, and vertically collapse the row to the 26px circle
            instead of the 44px target — otherwise the invisible padding would
            set the height of the whole top bar. The target keeps its full 44px
            for the thumb either way.

            The margin is half the difference between the two sizes, so it is
            derived from the circle and has to move with it: at 26px that is
            (44-26)/2 = 9. Leaving it at the old 7 would inset the circle 2px
            from the gutter and leave the row 2px taller than the circle. */}
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="group flex items-center justify-center shrink-0 -mr-[9px] -my-[9px]"
          style={{ width: 44, height: 44, WebkitTapHighlightColor: "transparent" }}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Profile menu"
        >
          <span
            className="flex items-center justify-center rounded-full transition-transform group-active:scale-[0.95]"
            style={{
              width: 26,
              height: 26,
              background: "#252830",
              border: "0.5px solid #2a2d36",
            }}
          >
            <User size={16} color="#8a8fa8" strokeWidth={2} />
          </span>
        </button>

        {menuOpen && (
          <>
            {/* Full-screen click-away layer so a tap anywhere closes the menu. */}
            <button
              type="button"
              aria-label="Close menu"
              className="fixed inset-0 z-40 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            {/* Sizes to its widest item (no fixed width) with equal p-1 padding
                on all sides — the pattern future menu items should follow. The
                max-width is what makes the name below truncatable: under w-max
                alone the box would simply grow to fit any name and the ellipsis
                would never appear. Names are expected to be short ("Coach RJ",
                "Debbie", "Mr. Chen"), which leaves the two menu items setting
                the width at ~98px. The cap is deliberately close to that rather
                than generous — at 200px a name like "RJW Skills & Development"
                still fitted and simply stretched the menu to 183px, which is the
                oversized shape this is meant to avoid; at 160px it truncates
                instead and the menu stays compact.

                ⚠️ RAISED 160px -> 176px on Aug 17 2026, because "Manage
                subscription" did not fit and was being CRUSHED rather than
                merely tight. The arithmetic, since it is not obvious from the
                class alone — the cap covers the panel's own box, not the text:

                  text                       135px
                  row px-3, both sides      + 24px
                  panel p-1, both sides     +  8px
                  panel border, both sides  +  2px
                  natural width needed       169px

                At the old 160px cap the row's 12px right padding was consumed
                and the label overran it by 9px, sitting hard against the panel
                edge. ⚠️ An earlier note here recorded "one pixel of slack",
                which was WRONG: it compared the row's width to the cap without
                subtracting the panel's own padding and borders. The row padding
                was never the problem and is unchanged — px-3, identical to
                every other row.

                176px was chosen over the bare 169px it needs so there is ~7px
                of headroom for font-metric variance on other devices. It does
                NOT make the menu wider at rest: w-max still sizes the panel to
                its content, so this row renders at 169px and every shorter
                row — Edit name, Sign out, Upgrade to Pro — is untouched. A
                free-tier coach sees exactly the menu they saw before.

                ⚠️ The cap still does real work: it is what truncates a long
                coach name rather than letting the box grow to fit any name. At
                200px "RJW Skills & Development" stretched the menu to 183px,
                the oversized shape this exists to avoid. 176px keeps that
                behaviour while clearing the widest ACTION. */}
            <div
              role="menu"
              className="absolute right-0 top-full mt-1.5 z-50 w-max max-w-[176px] bg-reps-card border border-reps-line rounded-[10px] p-1 shadow-lg shadow-black/40"
            >
              {/* Identity, not an action: a plain div, so it is neither tappable
                  nor focusable, and role="presentation" keeps it out of the
                  menu's item list for screen readers. Guarded because the roster
                  passes "" when the coach row has no name — an empty string here
                  would render a blank line above a stray divider. `title` keeps
                  the full name reachable on hover once it truncates. */}
              {coachName && (
                <>
                  <div
                    role="presentation"
                    title={coachName}
                    className="px-3 pt-1.5 pb-2 text-[12px] text-[#8a8fa8] truncate"
                  >
                    {coachName}
                  </div>
                  {/* Inset by the menu's own p-1 rather than bled to the edges
                      with a negative margin — the bleed pattern is what has been
                      failing on iOS elsewhere in this header, and 4px of inset
                      reads as deliberate in a rounded card. */}
                  <div
                    role="presentation"
                    className="h-px mb-1"
                    style={{ background: "#2a2d36" }}
                  />
                </>
              )}
              {/* First, above Edit name, with Sign out staying last — that is
                  the one action a thumb should not find by accident.

                  ⚠️ Hidden entirely for a coach already on a paid plan rather
                  than shown disabled: offering "Upgrade" to someone who has
                  already upgraded is worse than offering nothing. Managing an
                  existing subscription is a separate action (Billing Portal)
                  and is not built yet, so a Pro coach currently sees the menu
                  exactly as it was before this feature. */}
              {!isPro && (
                <>
                  <button
                    role="menuitem"
                    onClick={startUpgrade}
                    disabled={upgrading}
                    className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[14px] text-reps-ink whitespace-nowrap hover:bg-reps-raised transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {upgrading ? "Starting…" : "Upgrade to Pro"}
                  </button>
                  {/* Inline rather than a toast: this menu has no toast, and the
                      errors reachable here are configuration problems a coach
                      cannot act on beyond retrying. Wraps rather than truncating
                      so the message is actually readable in a 176px panel. */}
                  {upgradeError && (
                    <p className="px-3 pb-1.5 text-[12px] leading-snug text-red-400 whitespace-normal">
                      {upgradeError}
                    </p>
                  )}
                </>
              )}
              {/* The mirror of "Upgrade to Pro" above: that row shows to a coach
                  WITHOUT a subscription, this one to a coach WITH one, so the
                  menu always offers exactly one billing action and never both.
                  Cancelling is only meaningful for a subscriber, which is why
                  isPro is the right condition and no new prop has to be threaded
                  through the roster page.

                  ⚠️ isPro is a page-load-old RENDER HINT, not the guard. The
                  action re-reads the coach's own row and refuses if there is no
                  stripe_customer_id — the same rule createCheckoutSession's
                  already-subscribed guard follows, since a server action can be
                  invoked with no UI in front of it.

                  "Manage subscription" rather than "Cancel": the portal also
                  carries invoices and the payment method, and an item reading
                  "Cancel" would suggest it cancels on the spot rather than
                  opening a screen where that is one of the options.

                  ⚠️ IT IS THE WIDEST ITEM THIS MENU CAN RENDER. The label is
                  135.0px at 14px in the app's font stack, against "Upgrade to
                  Pro" at 98.4px and "Sign out" at 53.3px — so this row alone
                  decides the panel's width, and the cap was raised to 176px to
                  fit it. See the arithmetic on the panel above.

                  ⚠️ A previous note here claimed "one pixel of slack". That was
                  WRONG — it compared the row's 159px to the 160px cap without
                  subtracting the panel's own 4px padding and 1px borders, which
                  left only 126px for a 135px label. The label was overrunning
                  its right padding by 9px, not fitting by 1px.

                  Do not shorten this label back to make it fit a narrower
                  panel; it was chosen deliberately over "Manage billing". Widen
                  the cap instead, and redo the arithmetic above. */}
              {isPro && (
                <>
                  <button
                    role="menuitem"
                    onClick={openBillingPortal}
                    disabled={portalPending}
                    className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[14px] text-reps-ink whitespace-nowrap hover:bg-reps-raised transition-colors disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {portalPending ? "Opening…" : "Manage subscription"}
                  </button>
                  {/* Inline and wrapping, matching the upgrade error above — this
                      panel has no toast, and a truncated message in a 176px
                      panel is unreadable. */}
                  {portalError && (
                    <p className="px-3 pb-1.5 text-[12px] leading-snug text-red-400 whitespace-normal">
                      {portalError}
                    </p>
                  )}
                </>
              )}
              <button
                role="menuitem"
                onClick={openEdit}
                className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[14px] text-reps-ink whitespace-nowrap hover:bg-reps-raised transition-colors"
              >
                Edit name
              </button>
              {/* ─── Reference group ───────────────────────────────────────
                  ⚠️ WHY IT EXISTS: a signed-in coach could not reach /faq,
                  /privacy or /terms from ANYWHERE in the instructor app. Every
                  link to all three lived on the public landing page, so the
                  only route in was to sign out or type the URL. This menu is
                  the fix, and it is deliberately the ONLY host — see below.

                  ⚠️ NOT PrivacyFooter, and not a variant of it. That component
                  sends students and parents to ONE page, deep-linked to
                  /privacy#students-and-minors because that section is written
                  to parents. A coach needs all THREE pages and must land on
                  the TOP of /privacy, which is written to them. Widening
                  PrivacyFooter would also hand students a /terms link they
                  never agreed to.

                  ⚠️ ROSTER-ONLY, and that is the decision rather than a
                  limitation. An earlier note in CLAUDE.md claimed this menu
                  renders on every instructor screen; it does not — the roster
                  is its single call site. A persistent footer was the
                  alternative and was rejected: four of the eight coach screens
                  end in a `sticky bottom-0 mt-auto` CTA, so a footer would sit
                  under a sticky element or fight it (the same argument that
                  keeps PrivacyFooter off the student log screen), and the only
                  shared wrapper — instructor/layout.tsx — is shared with the
                  signup tree, which already carries its own consent notice.
                  Students get one visit and need this surfaced; a coach
                  returns daily and goes LOOKING for it, so the account menu is
                  where it belongs.

                  ⚠️ ONE STEP QUIETER THAN THE ACTIONS ABOVE — 13px in
                  text-reps-sub, against the 14px text-reps-ink of Upgrade /
                  Manage subscription / Edit name. Three tiers of weight, not
                  six flat rows: the account actions are what a coach comes
                  here to DO, these are reference material they come here to
                  READ. Height stays h-9 so the tap targets match the rest of
                  the menu; only size and colour drop.

                  ⚠️ FAQ LEADS, deliberately. It is the only one of the three a
                  coach would open voluntarily — the other two are documents
                  you consult, not pages you visit.

                  ⚠️ NEW TAB ON ALL THREE, and this is its OWN decision — NOT a
                  reuse of the signup-consent precedent. That one opens in a new
                  tab to protect in-memory SignupProvider state, which nothing
                  here has. The reason here is different: all three pages set
                  their own back arrow to `/` — the MARKETING LANDING PAGE, not
                  into the app. So a signed-in coach who taps Privacy and then
                  taps that page's own back control is stranded outside their
                  own app, with no route back in but signing in again. Browser
                  back works; the on-page control lies. Opening in a new tab
                  means the app tab is never navigated away from at all.

                  ⚠️ The panel cap is UNCHANGED at 176px, and that was MEASURED
                  in the app's own font stack rather than estimated. At 13px:
                  "Terms of Service" 101.8px, "Privacy Policy" 83.9px, "FAQ"
                  25.1px — so the widest of the three needs a 135.8px panel,
                  against the 169px "Manage subscription" already demands. No
                  row added here widens the menu at any plan state, and the cap
                  goes on truncating a long coach name, which is the behaviour
                  it actually exists for. ⚠️ Re-measure before trusting these
                  if the labels or the type size ever change.

                  ⚠️ THREE INLINE LINKS, NOT A COMPONENT. Every other row in
                  this menu repeats its class string inline, and there is
                  exactly one host. Same rule the billing portal follows a few
                  lines up: if a second entry point ever appears, extract it
                  then, the same way and for the same reason. */}
              <div
                role="presentation"
                className="h-px my-1"
                style={{ background: "#2a2d36" }}
              />
              {/* Closes the menu even though the tab does not navigate — the
                  coach comes back to this tab afterwards, and returning to a
                  menu still hanging open reads as a UI that got stuck. */}
              <Link
                role="menuitem"
                href="/faq"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[13px] text-reps-sub whitespace-nowrap hover:bg-reps-raised hover:text-reps-ink transition-colors"
              >
                FAQ
              </Link>
              <Link
                role="menuitem"
                href="/privacy"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[13px] text-reps-sub whitespace-nowrap hover:bg-reps-raised hover:text-reps-ink transition-colors"
              >
                Privacy Policy
              </Link>
              <Link
                role="menuitem"
                href="/terms"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuOpen(false)}
                className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[13px] text-reps-sub whitespace-nowrap hover:bg-reps-raised hover:text-reps-ink transition-colors"
              >
                Terms of Service
              </Link>
              {/* ⚠️ The SECOND divider, and it is load-bearing rather than
                  decoration. Sign out stays last and stays full weight — it is
                  still the one action a thumb should not find by accident —
                  but with the quiet reference group directly above it, a single
                  divider would have let it read as the fourth item in that
                  group. Two dividers is the cost of keeping it separate. */}
              <div
                role="presentation"
                className="h-px my-1"
                style={{ background: "#2a2d36" }}
              />
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  setConfirmOpen(true);
                }}
                className="flex items-center w-full h-9 px-3 rounded-[7px] text-left text-[14px] text-reps-ink whitespace-nowrap hover:bg-reps-raised transition-colors"
              >
                Sign out
              </button>
            </div>
          </>
        )}
      </div>

      {editOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70"
          onClick={() => !saving && setEditOpen(false)}
        >
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="editname-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] px-7 pt-7 pb-8"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSaveName}
          >
            <h2 id="editname-title" className="text-[16px] font-semibold text-reps-ink mb-2">
              Edit name
            </h2>
            {/* Mirrors the signup question, so the field means the same thing in
                both places rather than reading as an account/legal name here. */}
            <p className="text-[13px] text-reps-sub mb-5">
              What should students call you?
            </p>
            <input
              type="text"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="e.g. Coach RJ"
              className="w-full bg-reps-bg border border-reps-line rounded-[10px] px-[14px] py-3 text-[15px] text-reps-ink placeholder:text-[#5a5f72] outline-none focus:border-[#378add] transition-colors mb-2"
            />
            <p className="text-[12px] text-reps-sub mb-6 min-h-[16px]">
              {error ? <span className="text-red-400">{error}</span> : "Students and parents see this name."}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditOpen(false)}
                disabled={saving}
                className="flex-1 min-h-[44px] rounded-[10px] border border-reps-line text-reps-ink font-medium text-[15px] hover:bg-reps-raised transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !draft.trim()}
                className="flex-1 min-h-[44px] rounded-[10px] bg-reps-orange text-white font-semibold text-[15px] hover:bg-reps-orange-hi transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70"
          onClick={() => setConfirmOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="signout-title"
            className="w-full max-w-[320px] bg-reps-card border border-reps-line rounded-[16px] px-7 pt-7 pb-8"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="signout-title" className="text-[16px] font-semibold text-reps-ink mb-2">
              Sign out?
            </h2>
            <p className="text-[13px] text-reps-sub mb-7">
              Sign back in anytime with your email.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 min-h-[44px] rounded-[10px] border border-reps-line text-reps-ink font-medium text-[15px] hover:bg-reps-raised transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSignOut}
                className="flex-1 min-h-[44px] rounded-[10px] bg-reps-orange text-white font-semibold text-[15px] hover:bg-reps-orange-hi transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
