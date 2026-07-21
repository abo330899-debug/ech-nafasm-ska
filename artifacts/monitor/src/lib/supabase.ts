import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eevanqnzcrizmmtrjmnk.supabase.co';
const supabaseAnonKey = 'sb_publishable_gwjES60DPfL4_50IZ9jgeQ_dEiVsWdA';

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Dedicated read-only dashboard account; RLS in supabase/schema.sql only
// grants SELECT on activity_events to this email.
export const READER_EMAIL = 'monitor@nafsam.app';

// The owner logs in with one of the star words (same words as the archive /
// chat). The word maps to the fixed Supabase password below. This app is
// workspace-only (never part of the public Nafsam / Cloudflare deploys), so
// baking the mapping here does not ship it to visitors. Anything else typed
// is passed through as a raw password, so a dashboard-set password works too.
// IMPORTANT: this password is intentionally high-entropy and must NOT follow
// the public `nafsam-<x>` pattern used by the chat accounts — that pattern is
// shipped in the public telegram-call bundle, so a pattern-derived reader
// password could be guessed against the public Supabase auth endpoint.
const STAR_WORDS = new Set(['ska', 'star', 'kas']);
const MONITOR_PASSWORD = 'XOLIYKHW8cJzzxteR6m5PHCtJg2NSH6D';

export function resolveMonitorPassword(input: string): string {
  return STAR_WORDS.has(input.trim().toLowerCase()) ? MONITOR_PASSWORD : input;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'nafsam-monitor-auth',
  },
});

export type EventType =
  | 'page_view'
  | 'page_leave'
  | 'heartbeat'
  | 'click'
  | 'dblclick'
  | 'right_click'
  | 'keystroke'
  | 'scroll'
  | 'scroll_depth'
  | 'resize'
  | 'focus'
  | 'blur'
  | 'copy'
  | 'paste'
  | 'cut'
  | 'select'
  | 'form_submit'
  | 'form_start'
  | 'form_abandon'
  | 'search'
  | 'video_play'
  | 'video_pause'
  | 'video_seek'
  | 'video_end'
  | 'video_fullscreen'
  | 'audio_play'
  | 'audio_pause'
  | 'audio_seek'
  | 'audio_end'
  | 'photo_open'
  | 'photo_close'
  | 'photo_zoom'
  | 'download'
  | 'file_open'
  | 'link_click'
  | 'navigation'
  | 'tab_visible'
  | 'tab_hidden'
  | 'session_end';

export interface Coordinates {
  x: number;
  y: number;
  pageX: number;
  pageY: number;
}

export interface TrackEventPayload {
  session_id: string;
  visitor_id: string;
  event_type: EventType;
  event_name: string;
  page_url: string;
  page_title: string;
  referrer?: string;
  metadata?: Record<string, unknown>;
  element_selector?: string;
  element_text?: string;
  coordinates?: Coordinates;
  scroll_position?: number;
  value?: string;
  duration_ms?: number;
  timestamp?: string;
}