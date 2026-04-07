import { supabase } from './supabase';

// Simple analytics — logs events to a Supabase table
// Can be swapped for Mixpanel/Amplitude later without changing call sites

type EventName =
  | 'search_started'
  | 'search_completed'
  | 'listing_tapped'
  | 'listing_shared'
  | 'search_saved'
  | 'search_removed'
  | 'photo_selected'
  | 'photo_taken'
  | 'size_changed'
  | 'profile_updated'
  | 'history_tapped';

type EventProps = Record<string, string | number | boolean | null>;

export async function trackEvent(name: EventName, properties?: EventProps) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('analytics_events').insert({
      user_id: session?.user.id ?? null,
      event_name: name,
      properties: properties ?? {},
    });
  } catch {
    // Analytics should never crash the app
  }
}
