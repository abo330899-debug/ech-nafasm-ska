import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eevanqnzcrizmmtrjmnk.supabase.co';
const supabaseAnonKey = 'sb_publishable_gwjES60DPfL4_50IZ9jgeQ_dEiVsWdA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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