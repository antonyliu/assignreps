// Shared bootstrap for the one-off testing scripts. Not app code, never imported
// by anything in src/.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

export const env = Object.fromEntries(
  readFileSync(".env.local", "utf8")
    .split("\n").filter(l => l.trim() && !l.startsWith("#"))
    .map(l => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim()]; })
);

export const db = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

export const die = (msg) => { console.error(`\nABORTED: ${msg}`); process.exit(1); };

// ⚠️ Refuses to run against a live key. Every one of these scripts either
// mutates billing state or deletes data outright; none of it is safe against
// real customers, and the sk_test_/sk_live_ prefix is the only tell.
export function requireTestMode() {
  if (!env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    die("STRIPE_SECRET_KEY is not a test key. These scripts are test-mode only.");
  }
}

// Minimal Stripe REST helper — avoids adding the SDK to a throwaway script.
export async function stripe(path, { method = "GET", form } = {}) {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method,
    headers: {
      Authorization: `Basic ${Buffer.from(`${env.STRIPE_SECRET_KEY}:`).toString("base64")}`,
      ...(form ? { "Content-Type": "application/x-www-form-urlencoded" } : {}),
    },
    body: form ? new URLSearchParams(form).toString() : undefined,
  });
  const json = await res.json();
  if (!res.ok) die(`Stripe ${method} ${path} -> ${res.status}: ${json.error?.message ?? JSON.stringify(json)}`);
  return json;
}

/** Mirrors isEntitled() in src/lib/entitlement.ts. Kept literal — these are
 *  plain .mjs scripts outside the TS build — so if that allowlist ever changes,
 *  change it here too. */
export const ENTITLED = new Set(["active", "trialing"]);
export const isEntitled = (s) => !!s && ENTITLED.has(s);
export const FREE_STUDENT_LIMIT = 3;
export const PRO_STUDENT_LIMIT = 30;
export const activeStudentLimit = (s) => (isEntitled(s) ? PRO_STUDENT_LIMIT : FREE_STUDENT_LIMIT);
