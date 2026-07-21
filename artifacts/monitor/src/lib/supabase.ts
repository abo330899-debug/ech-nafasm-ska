import { createClient } from '@supabase/supabase-js';

// Same Supabase project the Nafsam archive writes its activity log to. The
// monitor reads the log through the dedicated reader account below.
const supabaseUrl = 'https://rwpgtnjpqwlddborvyrd.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3cGd0bmpwcXdsZGRib3J2eXJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2NTE5MjIsImV4cCI6MjA5NjIyNzkyMn0.XM2PsPYTwzepjpr6jhrT3kuxVOGNXbOgVHVIWQRWsDg';

export const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Dedicated read-only dashboard account; RLS in supabase/schema.sql only
// grants SELECT on activity_events to this email.
export const READER_EMAIL = 'monitor@nafsam.app';

// Fixed password for the read-only reader account. The dashboard signs in
// automatically on load (no login screen). This app is workspace-only (never
// part of the public Nafsam / Cloudflare deploys), so baking the value here
// does not ship it to visitors.
// IMPORTANT: this password is intentionally high-entropy and must NOT follow
// the public `nafsam-<x>` pattern used by the chat accounts — that pattern is
// shipped in the public telegram-call bundle, so a pattern-derived reader
// password could be guessed against the public Supabase auth endpoint.
export const MONITOR_PASSWORD = 'XOLIYKHW8cJzzxteR6m5PHCtJg2NSH6D';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // v2: the app was repointed from the analytics project to the chat project.
    // Bumping the key discards any stale session signed by the old project,
    // which would otherwise pass the email check but 401 on every query.
    storageKey: 'nafsam-monitor-auth-v2',
  },
});
