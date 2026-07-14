// Shared helpers for the two features that must live inside the existing
// `messages` table without any schema change:
//   * Voice messages  — audio is uploaded to the chat-images bucket and its path
//     stored in `image_path`; the duration is encoded in the filename so we never
//     need a new column nor the unreliable webm `duration` metadata.
//   * Reactions        — stored as durable "control messages" whose body starts
//     with a Private-Use-Area sentinel a human can never type. They are filtered
//     out of the visible conversation and reduced into reaction state, so they
//     persist and sync over realtime with zero schema change.

import type { ChatIdentity } from "./chatAuth";

export const REACTION_EMOJIS = ["❤️", "🥺", "🌹", "🦋"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

// targetId -> reactor identity -> emoji
export type Reactions = Record<string, Partial<Record<ChatIdentity, string>>>;

const SEP = "\uE000"; // Unicode Private Use Area — not typeable, not a NUL byte.
export const REACT_PREFIX = `${SEP}R${SEP}`;

export function buildReactionBody(targetId: string, emoji: string): string {
  return `${REACT_PREFIX}${targetId}${SEP}${emoji}`;
}

export function parseReaction(
  body: string | null | undefined,
): { targetId: string; emoji: string } | null {
  if (!body || !body.startsWith(REACT_PREFIX)) return null;
  const rest = body.slice(REACT_PREFIX.length);
  const idx = rest.indexOf(SEP);
  if (idx < 0) return null;
  return { targetId: rest.slice(0, idx), emoji: rest.slice(idx + 1) };
}

export function isControlBody(body: string | null | undefined): boolean {
  return !!body && body.startsWith(REACT_PREFIX);
}

const VOICE_RE = /\/voice-\d+-(\d+)\.[a-z0-9]+$/i;

export function parseVoice(
  path: string | null | undefined,
): { durationMs: number } | null {
  if (!path) return null;
  const m = path.match(VOICE_RE);
  if (!m) return null;
  return { durationMs: Number(m[1]) || 0 };
}

export function voiceFileName(
  identity: string,
  durationMs: number,
  ext: string,
): string {
  return `${identity}/voice-${Date.now()}-${Math.round(durationMs)}.${ext}`;
}

export function extForAudioType(type: string): string {
  if (type.includes("mp4")) return "mp4";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("aac")) return "aac";
  return "webm";
}
