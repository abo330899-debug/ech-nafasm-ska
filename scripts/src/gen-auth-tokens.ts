import { createHash } from "crypto";

/**
 * Generate the VITE_AUTH_TOKENS value from the login password list.
 *
 * In Nafsam's static (Cloudflare) mode, login is verified client-side by
 * comparing sha256(answer.trim().toLowerCase()) against VITE_AUTH_TOKENS — a
 * comma-separated list of SHA-256 hashes. That list must stay in sync with the
 * real passwords (NAFSAM_PASSWORDS) by hand, and silently drifts otherwise.
 * This script removes the manual step: it reads the password list, normalizes
 * each entry exactly like the client (trim + lowercase), de-duplicates, and
 * prints the VITE_AUTH_TOKENS value to copy into the production env var /
 * .env.cloudflare-pages.
 *
 * Normalization MUST match artifacts/nafsam/src/lib/auth.ts:
 *   sha256(answer.trim().toLowerCase())
 *
 * Password source (in priority order):
 *   1. NAFSAM_PASSWORDS env var (comma-separated)
 *   2. CLI args (comma-separated or space-separated)
 *
 * Usage:
 *   NAFSAM_PASSWORDS="pass1,pass2" pnpm --filter @workspace/scripts run gen-auth-tokens
 *   pnpm --filter @workspace/scripts run gen-auth-tokens pass1 pass2
 */

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

function readPasswords(): string[] {
  const fromEnv = process.env.NAFSAM_PASSWORDS;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.split(",");
  }
  const fromArgs = process.argv.slice(2);
  if (fromArgs.length > 0) {
    return fromArgs.flatMap((arg) => arg.split(","));
  }
  return [];
}

function main(): void {
  const raw = readPasswords();
  const passwords = raw.map((p) => p.trim().toLowerCase()).filter(Boolean);

  if (passwords.length === 0) {
    console.error(
      "No passwords provided. Set NAFSAM_PASSWORDS (comma-separated) or pass them as CLI args.",
    );
    process.exit(1);
  }

  const tokens = Array.from(new Set(passwords.map(sha256)));

  console.error(
    `Generated ${tokens.length} token(s) from ${passwords.length} password(s).`,
  );
  console.error("VITE_AUTH_TOKENS value:");
  console.log(tokens.join(","));
}

main();
