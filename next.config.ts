import type { NextConfig } from "next";

/**
 * Hosts allowed to reach the DEV server's internal `/_next/*` endpoints.
 *
 * ⚠️ Dev only. This has no effect on `next build` or production — it configures
 * a guard that only runs under `next dev`.
 *
 * WHY THIS EXISTS: Next blocks cross-origin access to dev resources by default,
 * and the allowlist it ships with is `['*.localhost', 'localhost']` plus the
 * hostname the server was bound to. Opening the dev server from a phone on the
 * LAN sends `Origin: http://192.168.86.73:3000`, which matches none of those, so
 * the request is refused.
 *
 * ⚠️ The failure is UGLY AND MISLEADING, which is why this comment is long. The
 * block writes a bare `Unauthorized` to the socket with no HTTP status line, so
 * the browser reports the HMR websocket as
 *
 *     WebSocket connection to 'ws://<ip>:3000/_next/webpack-hmr' failed:
 *     cannot parse response
 *
 * — which reads like a protocol or network fault rather than a deliberate
 * refusal. Verified against the running dev server: the identical upgrade
 * request returns 101 with `Origin: http://localhost:3000` and an empty
 * unparseable response with `Origin: http://192.168.86.73:3000`.
 *
 * ⚠️ A SUBNET WILDCARD, not a pinned address. `192.168.86.42` and
 * `192.168.86.73` are the same laptop on different DHCP leases, and pinning one
 * address means this breaks again on the next router reboot. Matching is
 * segment-wise, so `192.168.86.*` covers the whole subnet. Next refuses a bare
 * `*`, so this cannot be widened into "allow anything" by accident.
 *
 * Testing from a different network — a phone hotspot is usually 172.20.10.x —
 * needs no edit to this file: set DEV_ORIGINS instead, comma-separated, e.g.
 *
 *     DEV_ORIGINS=172.20.10.* npm run dev
 */
const devOrigins = [
  "192.168.86.*",
  ...(process.env.DEV_ORIGINS?.split(",").map((s) => s.trim()).filter(Boolean) ?? []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins: devOrigins,
};

export default nextConfig;
