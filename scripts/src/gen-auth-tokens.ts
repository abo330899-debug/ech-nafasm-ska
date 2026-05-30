import { createHash } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

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
 * With --write, it also rewrites the VITE_AUTH_TOKENS= line in
 * artifacts/nafsam/.env.cloudflare-pages in place, so the baked-in login
 * hashes can never drift from the password list.
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
 *   NAFSAM_PASSWORDS="pass1,pass2" pnpm --filter @workspace/scripts run gen-auth-tokens --write
 */

function sha256(text: string): string {
  return createHash("sha256").update(text, "utf8").digest("hex");
}

const ENV_FILE = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../artifacts/nafsam/.env.cloudflare-pages",
);

function readPasswords(args: string[]): string[] {
  const fromEnv = process.env.NAFSAM_PASSWORDS;
  if (fromEnv && fromEnv.trim()) {
    return fromEnv.split(",");
  }
  if (args.length > 0) {
    return args.flatMap((arg) => arg.split(","));
  }
  return [];
}

function writeEnvFile(value: string): void {
  let contents: string;
  try {
    contents = readFileSync(ENV_FILE, "utf8");
  } catch {
    console.error(`Could not read ${ENV_FILE}`);
    process.exit(1);
  }

  const line = `VITE_AUTH_TOKENS=${value}`;
  const hasTrailingNewline = contents.endsWith("\n");
  const lines = contents.split("\n");
  let replaced = false;
  const next = lines.map((l) => {
    if (l.startsWith("VITE_AUTH_TOKENS=")) {
      replaced = true;
      return line;
    }
    return l;
  });

  if (!replaced) {
    if (hasTrailingNewline) next.pop();
    next.push(line);
  }

  writeFileSync(ENV_FILE, next.join("\n"));
  console.error(
    `${replaced ? "Updated" : "Appended"} VITE_AUTH_TOKENS in ${ENV_FILE}`,
  );
}

function main(): void {
  const args = process.argv.slice(2);
  const write = args.includes("--write");
  const passwordArgs = args.filter((arg) => arg !== "--write");

  const raw = readPasswords(passwordArgs);
  const passwords = raw.map((p) => p.trim().toLowerCase()).filter(Boolean);

  if (passwords.length === 0) {
    console.error(
      "No passwords provided. Set NAFSAM_PASSWORDS (comma-separated) or pass them as CLI args.",
    );
    process.exit(1);
  }

  const tokens = Array.from(new Set(passwords.map(sha256)));
  const value = tokens.join(",");

  console.error(
    `Generated ${tokens.length} token(s) from ${passwords.length} password(s).`,
  );

  if (write) {
    writeEnvFile(value);
  }

  console.error("VITE_AUTH_TOKENS value:");
  console.log(value);
}

main();
