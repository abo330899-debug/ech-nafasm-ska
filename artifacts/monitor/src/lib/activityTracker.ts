import { supabase, type EventType, type TrackEventPayload, type Coordinates } from './supabase';

const HEARTBEAT_INTERVAL = 10_000;
const HEARTBEAT_BATCH_SIZE = 6;
const SCROLL_THROTTLE = 250;
const KEYSTROKE_DEBOUNCE = 2_000;
const BATCH_FLUSH_INTERVAL = 5_000;

class ActivityTracker {
  private sessionId: string = '';
  private visitorId: string = '';
  private sessionStart: number = 0;
  private isDestroyed: boolean = false;

  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatCount: number = 0;
  private heartbeatBuffer: TrackEventPayload[] = [];

  private eventBuffer: TrackEventPayload[] = [];
  private batchInterval: ReturnType<typeof setInterval> | null = null;

  private currentPageUrl: string = '';
  private currentPageTitle: string = '';
  private pageEntryTime: number = 0;
  private pageVisitId: number | null = null;
  private maxScrollDepth: number = 0;
  private scrollDepthMarkers: Set<number> = new Set([25, 50, 75, 100]);
  private scrollDepthReached: Set<number> = new Set();
  private pageClickCount: number = 0;
  private pageKeystrokeCount: number = 0;
  private lastScrollRecord: number = 0;

  private formFields: Map<string, {
    selector: string;
    name: string;
    type: string;
    value: string;
    keystrokes: number;
    backspaces: number;
    deletes: number;
    enters: number;
    tabs: number;
    focusedAt: number;
    lastChange: number;
    timeout: ReturnType<typeof setTimeout> | null;
  }> = new Map();

  private mediaElements: Map<string, {
    type: 'video' | 'audio';
    id: string;
    title: string;
    artist?: string;
    duration: number;
    watched: number;
    startedAt: number;
    lastUpdate: number;
    interactionCount: number;
    trackingId: number | null;
  }> = new Map();

  private presenceChannel: ReturnType<typeof supabase.channel> | null = null;

  private now(): string {
    return new Date().toISOString();
  }

  private unixtime(): number {
    return Date.now();
  }

  private generateId(): string {
    return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private getVisitorId(): string {
    if (this.visitorId) return this.visitorId;
    let vid = localStorage.getItem('nafsam_vid');
    if (!vid) {
      vid = this.generateId();
      localStorage.setItem('nafsam_vid', vid);
    }
    this.visitorId = vid;
    return vid;
  }

  private getDeviceInfo() {
    const ua = navigator.userAgent;
    const width = window.innerWidth;
    let deviceType = 'desktop';
    if (width < 640) deviceType = 'mobile';
    else if (width < 1024) deviceType = 'tablet';

    let browser = 'unknown';
    if (ua.includes('Chrome')) browser = 'chrome';
    else if (ua.includes('Firefox')) browser = 'firefox';
    else if (ua.includes('Safari')) browser = 'safari';
    else if (ua.includes('Edge')) browser = 'edge';

    let os = 'unknown';
    if (ua.includes('Windows')) os = 'windows';
    else if (ua.includes('Mac OS')) os = 'macos';
    else if (ua.includes('Linux')) os = 'linux';
    else if (ua.includes('Android')) os = 'android';
    else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'ios';

    return { deviceType, browser, os, ua, width, height: window.innerHeight };
  }

  private getSelector(el: EventTarget | null): string {
    if (!el || !(el instanceof HTMLElement)) return '';
    try {
      if (el.id) return `#${el.id}`;
      if (el.className && typeof el.className === 'string') {
        const classes = el.className.trim().split(/\s+/).slice(0, 3).join('.');
        if (classes) return `${el.tagName.toLowerCase()}.${classes}`;
      }
      return el.tagName.toLowerCase();
    } catch {
      return el.tagName?.toLowerCase() || 'unknown';
    }
  }

  private getElementText(el: EventTarget | null): string {
    if (!el || !(el instanceof HTMLElement)) return '';
    try {
      return (el.textContent || '').trim().substring(0, 100);
    } catch {
      return '';
    }
  }

  private getCoordinates(e: MouseEvent | Touch): Coordinates {
    return {
      x: e.clientX,
      y: e.clientY,
      pageX: e.pageX || (e as MouseEvent).clientX + window.scrollX,
      pageY: e.pageY || (e as MouseEvent).clientY + window.scrollY,
    };
  }

  private getScrollDepth(): number {
    const scrollTop = window.scrollY;
    const docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight) - window.innerHeight;
    if (docHeight <= 0) return 100;
    return Math.min(100, Math.round((scrollTop / docHeight) * 100));
  }

  async track(
    eventType: EventType,
    eventName: string,
    extra: Partial<TrackEventPayload> = {},
  ): Promise<void> {
    if (this.isDestroyed) return;

    const payload: TrackEventPayload = {
      session_id: this.sessionId,
      visitor_id: this.getVisitorId(),
      event_type: eventType,
      event_name: eventName,
      page_url: extra.page_url || this.currentPageUrl || window.location.href,
      page_title: extra.page_title || this.currentPageTitle || document.title,
      referrer: extra.referrer || document.referrer || '',
      metadata: extra.metadata || {},
      element_selector: extra.element_selector,
      element_text: extra.element_text,
      coordinates: extra.coordinates,
      scroll_position: extra.scroll_position ?? this.getScrollDepth(),
      value: extra.value,
      duration_ms: extra.duration_ms,
      timestamp: extra.timestamp || this.now(),
    };

    if (eventType === 'heartbeat') {
      this.heartbeatBuffer.push(payload);
      this.heartbeatCount++;
      if (this.heartbeatCount % HEARTBEAT_BATCH_SIZE === 0) {
        await this.flushHeartbeats();
      }
      return;
    }

    this.eventBuffer.push(payload);
  }

  private async flushHeartbeats(): Promise<void> {
    if (this.heartbeatBuffer.length === 0) return;
    const batch = this.heartbeatBuffer.splice(0);
    try {
      const { error } = await supabase.from('activity_events').insert(
        batch.map(e => ({
          session_id: e.session_id,
          visitor_id: e.visitor_id,
          event_type: e.event_type,
          event_name: e.event_name,
          page_url: e.page_url,
          page_title: e.page_title,
          referrer: e.referrer || '',
          metadata: e.metadata || {},
          scroll_position: e.scroll_position ?? null,
          timestamp: e.timestamp || this.now(),
        }))
      );
      if (error) console.warn('[Tracker] heartbeat batch error:', error.message);
    } catch (err) {
      console.warn('[Tracker] heartbeat exception:', err);
    }
  }

  private async flushBuffer(): Promise<void> {
    if (this.eventBuffer.length === 0 && this.heartbeatBuffer.length === 0) return;

    await this.flushHeartbeats();

    if (this.eventBuffer.length === 0) return;
    const batch = this.eventBuffer.splice(0);

    try {
      const { error } = await supabase.from('activity_events').insert(
        batch.map(e => ({
          session_id: e.session_id,
          visitor_id: e.visitor_id,
          event_type: e.event_type,
          event_name: e.event_name,
          page_url: e.page_url,
          page_title: e.page_title,
          referrer: e.referrer || '',
          metadata: e.metadata || {},
          element_selector: e.element_selector || null,
          element_text: e.element_text || null,
          coordinates: e.coordinates ? JSON.stringify(e.coordinates) : null,
          scroll_position: e.scroll_position ?? null,
          value: e.value || null,
          duration_ms: e.duration_ms || null,
          timestamp: e.timestamp || this.now(),
        }))
      );
      if (error) console.warn('[Tracker] batch error:', error.message);
    } catch (err) {
      console.warn('[Tracker] batch exception:', err);
    }
  }

  private async updateSession(updates: Record<string, unknown>): Promise<void> {
    try {
      await supabase.from('sessions').upsert({
        session_id: this.sessionId,
        visitor_id: this.getVisitorId(),
        last_activity: this.now(),
        ...updates,
      }, { onConflict: 'session_id' });
    } catch {
      // silent
    }
  }

  private async startPageVisit(): Promise<void> {
    this.pageEntryTime = this.unixtime();
    this.maxScrollDepth = 0;
    this.scrollDepthReached = new Set();
    this.pageClickCount = 0;
    this.pageKeystrokeCount = 0;

    try {
      const { data, error } = await supabase.from('page_visits').insert({
        session_id: this.sessionId,
        visitor_id: this.getVisitorId(),
        page_url: this.currentPageUrl,
        page_title: this.currentPageTitle,
        referrer: document.referrer || '',
        entry_timestamp: this.now(),
        is_active: true,
      }).select('id').single();

      if (!error && data) {
        this.pageVisitId = data.id;
      }
    } catch {
      // silent
    }
  }

  private async endPageVisit(): Promise<void> {
    if (!this.pageVisitId) return;
    const duration = Math.round((this.unixtime() - this.pageEntryTime) / 1000);

    try {
      await supabase.from('page_visits').update({
        exit_timestamp: this.now(),
        duration_seconds: duration,
        scroll_depth_max: this.maxScrollDepth,
        scroll_depth_25: this.scrollDepthReached.has(25),
        scroll_depth_50: this.scrollDepthReached.has(50),
        scroll_depth_75: this.scrollDepthReached.has(75),
        scroll_depth_100: this.scrollDepthReached.has(100),
        click_count: this.pageClickCount,
        keystroke_count: this.pageKeystrokeCount,
        is_active: false,
      }).eq('id', this.pageVisitId);
    } catch {
      // silent
    }

    this.pageVisitId = null;
  }

  private handleClick = (e: MouseEvent): void => {
    if (this.isDestroyed) return;
    this.pageClickCount++;

    const selector = this.getSelector(e.target);
    const text = this.getElementText(e.target);
    const coords = this.getCoordinates(e);
    const scrollAt = this.getScrollDepth();

    const el = e.target as HTMLElement;
    const tag = el.tagName?.toLowerCase() || '';
    const href = (el as HTMLAnchorElement).href || '';
    const id = el.id || '';
    const cls = el.className?.toString() || '';

    let eventName = 'click';
    if (tag === 'a' || tag === 'button' || (el as HTMLAnchorElement).href) {
      eventName = 'link_click';
    }

    supabase.from('click_map').insert({
      session_id: this.sessionId,
      visitor_id: this.getVisitorId(),
      page_url: this.currentPageUrl,
      element_selector: selector,
      element_tag: tag,
      element_id: id,
      element_class: cls,
      element_text: text,
      element_href: href,
      x_coordinate: coords.x,
      y_coordinate: coords.y,
      page_x_coordinate: coords.pageX,
      page_y_coordinate: coords.pageY,
      scroll_depth_at_click: scrollAt,
      timestamp: this.now(),
    }).then().catch(() => {});

    this.track('click', eventName, {
      element_selector: selector,
      element_text: text,
      coordinates: coords,
      scroll_position: scrollAt,
      metadata: { tag, id, class: cls, href, button: e.button },
    });
  };

  private handleDoubleClick = (e: MouseEvent): void => {
    if (this.isDestroyed) return;
    this.track('dblclick', 'double_click', {
      element_selector: this.getSelector(e.target),
      element_text: this.getElementText(e.target),
      coordinates: this.getCoordinates(e),
    });
  };

  private handleContextMenu = (e: MouseEvent): void => {
    if (this.isDestroyed) return;
    this.track('right_click', 'right_click', {
      element_selector: this.getSelector(e.target),
      element_text: this.getElementText(e.target),
      coordinates: this.getCoordinates(e),
      metadata: { x: e.clientX, y: e.clientY },
    });
  };

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (this.isDestroyed) return;

    const target = e.target as HTMLElement;
    const tag = target.tagName?.toLowerCase() || '';
    if (tag !== 'input' && tag !== 'textarea' && !target.isContentEditable) return;

    this.pageKeystrokeCount++;

    const selector = this.getSelector(target);
    const input = target as HTMLInputElement;
    const fieldName = input.name || input.id || selector;
    const fieldType = input.type || (target.isContentEditable ? 'contenteditable' : tag);

    let field = this.formFields.get(fieldName);
    if (!field) {
      field = {
        selector, name: fieldName, type: fieldType, value: '',
        keystrokes: 0, backspaces: 0, deletes: 0, enters: 0, tabs: 0,
        focusedAt: this.unixtime(), lastChange: this.unixtime(), timeout: null,
      };
      this.formFields.set(fieldName, field);
      this.track('focus', 'field_focus', {
        element_selector: selector,
        element_text: fieldName,
        metadata: { field_type: fieldType },
      });
    }

    field.keystrokes++;
    if (e.key === 'Backspace') field.backspaces++;
    else if (e.key === 'Delete') field.deletes++;
    else if (e.key === 'Enter') field.enters++;
    else if (e.key === 'Tab') field.tabs++;

    const currentValue = input.value || input.textContent || '';
    field.value = currentValue;
    field.lastChange = this.unixtime();

    if (field.timeout) clearTimeout(field.timeout);
    field.timeout = setTimeout(() => {
      this.saveFieldState(fieldName);
    }, KEYSTROKE_DEBOUNCE);

    if (field.keystrokes % 5 === 0 || e.key === 'Enter') {
      this.track('keystroke', 'keystroke', {
        element_selector: selector,
        element_text: fieldName,
        value: e.key === 'Enter' ? '[ENTER]' : e.key,
        metadata: {
          field_name: fieldName, field_type: fieldType,
          key: e.key, code: e.code,
          ctrlKey: e.ctrlKey, altKey: e.altKey, shiftKey: e.shiftKey,
          total_keystrokes: field.keystrokes,
          current_length: currentValue.length,
        },
      });
    }
  };

  private handleFocus = (e: FocusEvent): void => {
    if (this.isDestroyed) return;
    const target = e.target as HTMLElement;
    const tag = target.tagName?.toLowerCase() || '';
    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') return;

    this.track('focus', 'element_focus', {
      element_selector: this.getSelector(target),
      element_text: (target as HTMLInputElement).name || target.id,
      metadata: { tag, type: (target as HTMLInputElement).type },
    });
  };

  private handleBlur = (e: FocusEvent): void => {
    if (this.isDestroyed) return;
    const target = e.target as HTMLElement;
    const tag = target.tagName?.toLowerCase() || '';
    if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') return;

    const fieldName = (target as HTMLInputElement).name || target.id || this.getSelector(target);
    this.saveFieldState(fieldName);

    this.track('blur', 'element_blur', {
      element_selector: this.getSelector(target),
      metadata: { tag, type: (target as HTMLInputElement).type },
    });
  };

  private saveFieldState(fieldName: string): void {
    const field = this.formFields.get(fieldName);
    if (!field) return;

    if (field.timeout) clearTimeout(field.timeout);
    field.timeout = null;

    const duration = this.unixtime() - field.focusedAt;

    supabase.from('keystroke_log').insert({
      session_id: this.sessionId,
      visitor_id: this.getVisitorId(),
      page_url: this.currentPageUrl,
      element_selector: field.selector,
      element_name: field.name,
      element_type: field.type,
      input_value: field.value,
      character_count: field.value.length,
      word_count: field.value.split(/\s+/).filter(w => w.length > 0).length,
      keystroke_count: field.keystrokes,
      backspace_count: field.backspaces,
      delete_count: field.deletes,
      enter_count: field.enters,
      tab_count: field.tabs,
      field_focused_ts: new Date(field.focusedAt).toISOString(),
      field_blurred_ts: this.now(),
      field_duration_ms: duration,
      is_final: true,
      timestamp: this.now(),
    }).then().catch(() => {});
  }

  private handleScroll = (): void => {
    if (this.isDestroyed) return;
    const now = this.unixtime();
    if (now - this.lastScrollRecord < SCROLL_THROTTLE) return;
    this.lastScrollRecord = now;

    const depth = this.getScrollDepth();
    if (depth > this.maxScrollDepth) this.maxScrollDepth = depth;

    for (const marker of this.scrollDepthMarkers) {
      if (depth >= marker && !this.scrollDepthReached.has(marker)) {
        this.scrollDepthReached.add(marker);
        this.track('scroll_depth', `scroll_depth_${marker}`, {
          metadata: { depth: marker, percentage: marker },
          scroll_position: depth,
        });
      }
    }

    if (now - this.lastScrollRecord > 500) {
      this.track('scroll', 'scroll', {
        scroll_position: depth,
        metadata: { max_depth: this.maxScrollDepth },
      });
    }
  };

  private handleCopy = (e: ClipboardEvent): void => {
    if (this.isDestroyed) return;
    const selection = window.getSelection()?.toString() || '';
    if (!selection) return;
    this.track('copy', 'copy', {
      value: selection.substring(0, 200),
      metadata: { length: selection.length, element: this.getSelector(e.target) },
    });
  };

  private handlePaste = (e: ClipboardEvent): void => {
    if (this.isDestroyed) return;
    const text = e.clipboardData?.getData('text') || '';
    this.track('paste', 'paste', {
      value: text.substring(0, 200),
      element_selector: this.getSelector(e.target),
      metadata: { length: text.length },
    });
  };

  private handleFormSubmit = (e: SubmitEvent): void => {
    if (this.isDestroyed) return;
    for (const [name] of this.formFields) this.saveFieldState(name);

    this.track('form_submit', 'form_submit', {
      element_selector: `form#${(e.target as HTMLFormElement).id}` || 'form',
      metadata: {
        form_id: (e.target as HTMLFormElement).id,
        form_name: (e.target as HTMLFormElement).name,
      },
    });
  };

  private handleVisibilityChange = (): void => {
    if (this.isDestroyed) return;
    const hidden = document.visibilityState === 'hidden';
    this.track(hidden ? 'tab_hidden' : 'tab_visible', hidden ? 'tab_hidden' : 'tab_visible', {
      metadata: { hidden, time_on_page: Math.round((this.unixtime() - this.pageEntryTime) / 1000) },
    });
    if (hidden) {
      this.flushBuffer();
      this.sendLeaveBeacon();
    }
  };

  private handleResize = (): void => {
    if (this.isDestroyed) return;
    this.track('resize', 'window_resize', {
      metadata: { width: window.innerWidth, height: window.innerHeight },
    });
  };

  trackMedia(
    mediaType: 'video' | 'audio' | 'photo' | 'song',
    mediaId: string,
    action: 'play' | 'pause' | 'seek' | 'end' | 'open' | 'close' | 'zoom' | 'fullscreen',
    extra: {
      title?: string;
      artist?: string;
      album?: string;
      duration?: number;
      currentTime?: number;
      element?: HTMLElement;
    } = {},
  ): void {
    if (this.isDestroyed) return;

    const now = this.unixtime();
    const eventTypeMap: Record<string, EventType> = {
      video_play: 'video_play', video_pause: 'video_pause', video_seek: 'video_seek', video_end: 'video_end', video_fullscreen: 'video_fullscreen',
      audio_play: 'audio_play', audio_pause: 'audio_pause', audio_seek: 'audio_seek', audio_end: 'audio_end',
      photo_open: 'photo_open', photo_close: 'photo_close', photo_zoom: 'photo_zoom',
      song_play: 'audio_play', song_pause: 'audio_pause', song_seek: 'audio_seek', song_end: 'audio_end',
    };

    const eventType = eventTypeMap[`${mediaType}_${action}`] || 'click';

    this.track(eventType, `${mediaType}_${action}`, {
      element_selector: extra.element ? this.getSelector(extra.element) : undefined,
      duration_ms: extra.currentTime ? Math.round(extra.currentTime * 1000) : undefined,
      metadata: {
        media_id: mediaId, media_type: mediaType,
        media_title: extra.title, media_artist: extra.artist,
        total_duration: extra.duration, current_time: extra.currentTime, action,
      },
    });

    if ((mediaType === 'video' || mediaType === 'audio' || mediaType === 'song') && (action === 'play' || action === 'end' || action === 'pause')) {
      const watchPercent = extra.duration && extra.currentTime
        ? Math.min(100, Math.round((extra.currentTime / extra.duration) * 100))
        : 0;

      supabase.from('media_tracking').insert({
        session_id: this.sessionId, visitor_id: this.getVisitorId(),
        media_type: mediaType === 'song' ? 'song' : mediaType as string,
        media_id: mediaId, media_url: window.location.href,
        media_title: extra.title, media_artist: extra.artist,
        media_duration_total: extra.duration || 0,
        media_duration_watched: extra.currentTime ? Math.round(extra.currentTime) : 0,
        watch_percentage: watchPercent,
        started_at: this.now(), ended_at: this.now(),
        completed: action === 'end' || watchPercent >= 95,
        interaction_count: 1,
      }).then().catch(() => {});
    }

    if (mediaType === 'photo' && action === 'open') {
      supabase.from('media_tracking').insert({
        session_id: this.sessionId, visitor_id: this.getVisitorId(),
        media_type: 'photo', media_id: mediaId,
        media_url: extra.url || window.location.href,
        media_title: extra.title, started_at: this.now(),
      }).then().catch(() => {});
    }
  }

  trackPhoto(photoId: string, action: 'open' | 'close' | 'zoom', extra: { url?: string; title?: string; element?: HTMLElement } = {}): void {
    this.trackMedia('photo', photoId, action, extra);
  }

  trackDownload(url: string, filename?: string): void {
    this.track('download', 'download', {
      metadata: { url, filename: filename || url.split('/').pop() || 'unknown' },
    });
  }

  private sendLeaveBeacon = (): void => {
    if (this.isDestroyed) return;
    this.isDestroyed = true;

    for (const [name] of this.formFields) this.saveFieldState(name);
    this.endPageVisit();
    this.flushBuffer();

    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.batchInterval) clearInterval(this.batchInterval);

    const durationSeconds = Math.round((this.unixtime() - this.sessionStart) / 1000);

    const finalPayload = {
      exit_timestamp: this.now(),
      exit_page: this.currentPageUrl,
      exit_reason: 'close',
      duration_seconds: durationSeconds,
      last_activity: this.now(),
      total_clicks: this.pageClickCount,
      total_keystrokes: this.pageKeystrokeCount,
      max_scroll_depth: this.maxScrollDepth,
      is_active: false,
      updated_at: this.now(),
    };

    const anonKey = 'sb_publishable_gwjES60DPfL4_50IZ9jgeQ_dEiVsWdA';
    const baseUrl = 'https://eevanqnzcrizmmtrjmnk.supabase.co';

    try {
      navigator.sendBeacon(
        `${baseUrl}/rest/v1/sessions?session_id=eq.${this.sessionId}`,
        new Blob([JSON.stringify(finalPayload)], {
          type: 'application/json',
        }),
      );
    } catch {}

    try {
      navigator.sendBeacon(
        `${baseUrl}/rest/v1/activity_events`,
        new Blob([JSON.stringify([{
          session_id: this.sessionId,
          visitor_id: this.getVisitorId(),
          event_type: 'session_end',
          event_name: 'session_end',
          page_url: this.currentPageUrl,
          page_title: this.currentPageTitle,
          scroll_position: this.maxScrollDepth,
          metadata: {
            duration_seconds: durationSeconds,
            total_clicks: this.pageClickCount,
            total_keystrokes: this.pageKeystrokeCount,
            max_scroll_depth: this.maxScrollDepth,
          },
          timestamp: this.now(),
        }])], { type: 'application/json' },
        ),
      );
    } catch {}

    if (this.presenceChannel) {
      supabase.removeChannel(this.presenceChannel);
    }
  };

  handlePageChange(newUrl: string, newTitle?: string): void {
    if (this.isDestroyed) return;

    this.endPageVisit();
    for (const [name] of this.formFields) this.saveFieldState(name);
    this.formFields.clear();

    this.currentPageUrl = newUrl;
    this.currentPageTitle = newTitle || document.title;
    this.pageEntryTime = this.unixtime();
    this.maxScrollDepth = 0;
    this.scrollDepthReached = new Set();
    this.pageClickCount = 0;
    this.pageKeystrokeCount = 0;

    this.track('navigation', 'page_navigation', {
      page_url: newUrl, page_title: newTitle || document.title,
      metadata: { to: newUrl },
    });

    this.track('page_view', 'page_view', {
      page_url: newUrl, page_title: newTitle || document.title,
      metadata: { viewport_width: window.innerWidth, viewport_height: window.innerHeight },
    });

    this.startPageVisit();
  }

  start(): void {
    if (this.sessionId) return;

    const now = this.unixtime();
    this.sessionStart = now;
    this.sessionId = this.generateId();
    this.currentPageUrl = window.location.href;
    this.currentPageTitle = document.title;

    const device = this.getDeviceInfo();

    supabase.from('sessions').upsert({
      session_id: this.sessionId,
      visitor_id: this.getVisitorId(),
      user_agent: device.ua.substring(0, 255),
      device_type: device.deviceType,
      browser: device.browser,
      os: device.os,
      language: navigator.language,
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      referrer: document.referrer || '',
      entry_page: this.currentPageUrl,
      entry_timestamp: this.now(),
      last_activity: this.now(),
      is_active: true,
    }, { onConflict: 'session_id' }).then().catch(() => {});

    this.track('page_view', 'page_view', {
      metadata: {
        viewport_width: window.innerWidth, viewport_height: window.innerHeight,
        screen_width: window.screen.width, screen_height: window.screen.height,
        device_type: device.deviceType, browser: device.browser,
        os: device.os, language: navigator.language,
      },
    });

    this.startPageVisit();

    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('dblclick', this.handleDoubleClick, true);
    document.addEventListener('contextmenu', this.handleContextMenu, true);
    document.addEventListener('keydown', this.handleKeyDown, true);
    document.addEventListener('focusin', this.handleFocus, true);
    document.addEventListener('focusout', this.handleBlur, true);
    window.addEventListener('scroll', this.handleScroll, { passive: true });
    document.addEventListener('copy', this.handleCopy, true);
    document.addEventListener('paste', this.handlePaste, true);
    document.addEventListener('submit', this.handleFormSubmit, true);
    document.addEventListener('visibilitychange', this.handleVisibilityChange, false);
    window.addEventListener('resize', this.handleResize, { passive: true });
    window.addEventListener('beforeunload', this.sendLeaveBeacon);

    this.heartbeatInterval = setInterval(() => {
      this.track('heartbeat', 'heartbeat', {
        scroll_position: this.getScrollDepth(),
        metadata: {
          time_on_page: Math.round((this.unixtime() - this.sessionStart) / 1000),
          max_scroll_depth: this.maxScrollDepth,
          clicks: this.pageClickCount,
          keystrokes: this.pageKeystrokeCount,
        },
      });
    }, HEARTBEAT_INTERVAL);

    this.batchInterval = setInterval(() => {
      this.flushBuffer();
    }, BATCH_FLUSH_INTERVAL);

    setInterval(() => {
      this.updateSession({
        last_activity: this.now(),
        total_clicks: this.pageClickCount,
        total_keystrokes: this.pageKeystrokeCount,
        max_scroll_depth: this.maxScrollDepth,
        duration_seconds: Math.round((this.unixtime() - this.sessionStart) / 1000),
      });
    }, 30_000);

    // Presence channel for real-time online count
    this.presenceChannel = supabase.channel('online-visitors', {
      config: { presence: { key: this.sessionId } },
    });
    this.presenceChannel
      .on('presence', { event: 'sync' }, () => {})
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await this.presenceChannel?.track({
            visitor_id: this.getVisitorId(),
            session_id: this.sessionId,
            page_url: window.location.href,
            online_at: this.now(),
          });
        }
      });
  }

  destroy(): void {
    if (this.isDestroyed) return;
    this.sendLeaveBeacon();

    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('dblclick', this.handleDoubleClick, true);
    document.removeEventListener('contextmenu', this.handleContextMenu, true);
    document.removeEventListener('keydown', this.handleKeyDown, true);
    document.removeEventListener('focusin', this.handleFocus, true);
    document.removeEventListener('focusout', this.handleBlur, true);
    window.removeEventListener('scroll', this.handleScroll);
    document.removeEventListener('copy', this.handleCopy, true);
    document.removeEventListener('paste', this.handlePaste, true);
    document.removeEventListener('submit', this.handleFormSubmit, true);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('beforeunload', this.sendLeaveBeacon);
  }

  getSessionId(): string { return this.sessionId; }
  getVisitorId(): string { return this.visitorId; }
  getSessionDuration(): number { return Math.round((this.unixtime() - this.sessionStart) / 1000); }
}

export const activityTracker = new ActivityTracker();