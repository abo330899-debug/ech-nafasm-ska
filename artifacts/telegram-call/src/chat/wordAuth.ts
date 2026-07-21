// Standalone word verification for the Telegram app. Mirrors the static-mode
// login in the Nafsam frontend (lib/auth.ts): sha256(word) must match one of
// the baked-in accepted tokens. Needed because the installed PWA runs in its
// own storage container on iOS and may not see the identity Nafsam stored.
import { deriveIdentity, type ChatIdentity } from "./chatAuth";

// SHA-256 hashes of accepted login words (trimmed + lowercased).
// Canonical list lives in the NAFSAM_PASSWORDS secret — never list words here.
const AUTH_TOKENS_BUILTIN = [
  "89332e726a92700b68820e4371347aff05cfbe5fcef459a7e9916266fbbbb6ac",
  "15d3a52f3a69b6da3b76b5575a48c1d16ad5087dbf1cc4e33d1428f59a0bb7a1",
  "470c8021ba0912f4108bffbb4fe562367912d992f7a1388850b28d34a4a25170",
  "69f81f0d193d163268d961aae99c2e3adf6b5ebe81a97280cf0c235d2f5f3338",
  "c30609e972999f1687758abe73a07ba12a56a009784d9c8c910a6982d55c212c",
];

function authTokens(): Set<string> {
  const tokens = new Set(AUTH_TOKENS_BUILTIN);
  const extra = (import.meta.env.VITE_AUTH_TOKENS as string | undefined) || "";
  for (const raw of extra.split(",")) {
    const token = raw.trim().toLowerCase();
    if (token) tokens.add(token);
  }
  return tokens;
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Returns the derived identity when the word is accepted, null otherwise. */
export async function verifyWord(answer: string): Promise<ChatIdentity | null> {
  const normalized = answer.trim().toLowerCase();
  if (!normalized) return null;
  try {
    const hash = await sha256Hex(normalized);
    if (!authTokens().has(hash)) return null;
    return await deriveIdentity(normalized);
  } catch {
    return null;
  }
}
