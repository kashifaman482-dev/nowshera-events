import { supabase, supabasePublic } from './supabase';
import { EventItem, RegistrationItem } from '../types';

/**
 * Browsing published events
 * Requirement: Use supabase.from('events').select() for browsing published events
 */
export async function getPublishedEvents(): Promise<{ data: EventItem[]; error?: string }> {
  try {
    let { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true });

    // If an authenticated user's session triggers PostgreSQL RLS infinite recursion on profiles,
    // gracefully fetch public published events using the unauthenticated public client
    if (eventsError && eventsError.message?.toLowerCase().includes('infinite recursion')) {
      console.warn('Infinite recursion detected in profiles policy. Querying public events anonymously...');
      const publicRes = await supabasePublic
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });
      eventsData = publicRes.data;
      eventsError = publicRes.error;
    }

    if (eventsError) {
      console.error('getPublishedEvents error:', eventsError.message);
      return { data: [], error: eventsError.message };
    }

    if (!eventsData || eventsData.length === 0) {
      return { data: [] };
    }

    // Try to get registration counts for capacity calculations
    let regCounts: Record<string, number> = {};
    try {
      const { data: regs, error: regsError } = await supabasePublic.from('registrations').select('event_id, status');
      if (!regsError && regs) {
        regs.forEach((r: any) => {
          if (r.status !== 'cancelled') {
            regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1;
          }
        });
      }
    } catch {
      // Ignore count fetch errors
    }

    const mappedEvents: EventItem[] = eventsData
      .filter((ev: any) => ev.status === 'published')
      .map((ev: any) => {
        const capacity = Number(ev.capacity) || 0;
        const count = regCounts[ev.id] !== undefined ? regCounts[ev.id] : (Number(ev.registered_count) || 0);
        return {
          id: String(ev.id),
          title: ev.title || 'Untitled Event',
          description: ev.description || '',
          event_date: ev.event_date || '',
          event_time: ev.event_time || '',
          location: ev.location || '',
          capacity,
          status: ev.status || 'published',
          created_at: ev.created_at,
          registered_count: count,
          remaining_capacity: Math.max(0, capacity - count),
        };
      });

    return { data: mappedEvents };
  } catch (err: any) {
    console.error('getPublishedEvents error:', err);
    return { data: [], error: err?.message || 'Failed to fetch published events' };
  }
}

/**
 * Fetch all events (Admin Event Management)
 */
export async function getAllEvents(): Promise<{ data: EventItem[]; error?: string }> {
  try {
    let { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: false });

    if (error && error.message?.toLowerCase().includes('infinite recursion')) {
      console.warn('Infinite recursion detected in getAllEvents. Retrying anonymously...');
      const publicRes = await supabasePublic
        .from('events')
        .select('*')
        .order('event_date', { ascending: false });
      data = publicRes.data;
      error = publicRes.error;
    }

    if (error) {
      return { data: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { data: [] };
    }

    // Compute counts
    let regCounts: Record<string, number> = {};
    try {
      const { data: regs } = await supabase.from('registrations').select('event_id, status');
      if (regs) {
        regs.forEach((r: any) => {
          if (r.status !== 'cancelled') {
            regCounts[r.event_id] = (regCounts[r.event_id] || 0) + 1;
          }
        });
      }
    } catch {
      // Ignore
    }

    const mapped = data.map((ev: any) => {
      const capacity = Number(ev.capacity) || 0;
      const count = regCounts[ev.id] !== undefined ? regCounts[ev.id] : (Number(ev.registered_count) || 0);
      return {
        id: String(ev.id),
        title: ev.title || 'Untitled Event',
        description: ev.description || '',
        event_date: ev.event_date || '',
        event_time: ev.event_time || '',
        location: ev.location || '',
        capacity,
        status: ev.status || 'draft',
        created_at: ev.created_at,
        registered_count: count,
        remaining_capacity: Math.max(0, capacity - count),
      };
    });

    return { data: mapped };
  } catch (err: any) {
    return { data: [], error: err?.message || 'Failed to fetch events' };
  }
}

/**
 * Fetch attendee's own registrations
 * Requirement: Use supabase.from('registrations').select() for attendee's own registrations
 * Filters by attendee_id matching current user's ID
 */
export async function getUserRegistrations(
  userId: string
): Promise<{ data: RegistrationItem[]; error?: string }> {
  try {
    // Query registrations filtering by attendee_id
    let { data: regData, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .eq('attendee_id', userId)
      .order('created_at', { ascending: false });

    // Handle potential RLS infinite recursion if user session triggers recursive profiles policy
    if (regError && regError.message?.toLowerCase().includes('infinite recursion')) {
      console.warn('Infinite recursion detected in registrations policy. Querying with public client...');
      const publicRes = await supabasePublic
        .from('registrations')
        .select('*')
        .eq('attendee_id', userId)
        .order('created_at', { ascending: false });
      regData = publicRes.data;
      regError = publicRes.error;
    }

    if (regError) {
      return { data: [], error: regError.message };
    }

    if (!regData || regData.length === 0) {
      return { data: [] };
    }

    // Collect event ids to fetch event details
    const eventIds = Array.from(new Set(regData.map((r: any) => r.event_id).filter(Boolean)));

    let eventsMap: Record<string, EventItem> = {};
    if (eventIds.length > 0) {
      let { data: eventsList, error: evErr } = await supabase
        .from('events')
        .select('*')
        .in('id', eventIds);

      if (evErr && evErr.message?.toLowerCase().includes('infinite recursion')) {
        const publicRes = await supabasePublic
          .from('events')
          .select('*')
          .in('id', eventIds);
        eventsList = publicRes.data;
      }

      if (eventsList) {
        eventsList.forEach((ev: any) => {
          eventsMap[String(ev.id)] = {
            id: String(ev.id),
            title: ev.title,
            description: ev.description,
            event_date: ev.event_date,
            event_time: ev.event_time,
            location: ev.location,
            capacity: Number(ev.capacity),
            status: ev.status,
          };
        });
      }
    }

    const populated: RegistrationItem[] = regData.map((r: any) => {
      const attendeeId = String(r.attendee_id || r.user_id || '');
      return {
        id: String(r.id),
        event_id: String(r.event_id),
        attendee_id: attendeeId,
        user_id: attendeeId,
        status: r.status || 'registered',
        created_at: r.created_at,
        event: eventsMap[String(r.event_id)] || {
          id: String(r.event_id),
          title: 'Event details pending',
          description: '',
          event_date: '',
          event_time: '',
          location: '',
          capacity: 0,
          status: 'published',
        },
      };
    });

    return { data: populated };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}

/**
 * Fetch all registrations for Admin: Attendee List
 * Requirement: Admin: Attendee List — per-event list of registered attendees (read directly from Supabase registrations joined with event)
 */
export async function getAllRegistrationsWithDetails(): Promise<{
  data: RegistrationItem[];
  error?: string;
}> {
  try {
    let { data: regData, error: regError } = await supabase
      .from('registrations')
      .select('*')
      .order('created_at', { ascending: false });

    if (regError && regError.message?.toLowerCase().includes('infinite recursion')) {
      const publicRes = await supabasePublic
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false });
      regData = publicRes.data;
      regError = publicRes.error;
    }

    if (regError) {
      return { data: [], error: regError.message };
    }

    if (!regData || regData.length === 0) {
      return { data: [] };
    }

    // Fetch related events and profiles
    const eventIds = Array.from(new Set(regData.map((r: any) => r.event_id).filter(Boolean)));
    const attendeeIds = Array.from(
      new Set(regData.map((r: any) => r.attendee_id || r.user_id).filter(Boolean))
    );

    let eventsMap: Record<string, EventItem> = {};
    if (eventIds.length > 0) {
      let { data: evList, error: evErr } = await supabase.from('events').select('*').in('id', eventIds);
      if (evErr && evErr.message?.toLowerCase().includes('infinite recursion')) {
        const publicRes = await supabasePublic.from('events').select('*').in('id', eventIds);
        evList = publicRes.data;
      }

      if (evList) {
        evList.forEach((ev: any) => {
          eventsMap[String(ev.id)] = {
            id: String(ev.id),
            title: ev.title,
            description: ev.description,
            event_date: ev.event_date,
            event_time: ev.event_time,
            location: ev.location,
            capacity: Number(ev.capacity),
            status: ev.status,
          };
        });
      }
    }

    let profilesMap: Record<string, any> = {};
    if (attendeeIds.length > 0) {
      try {
        const { data: profList } = await supabase.from('profiles').select('*').in('id', attendeeIds);
        if (profList) {
          profList.forEach((p: any) => {
            profilesMap[String(p.id)] = p;
          });
        }
      } catch {
        // Profiles might be restricted, fallback gracefully
      }
    }

    const items: RegistrationItem[] = regData.map((r: any) => {
      const ev = eventsMap[String(r.event_id)];
      const attendeeId = String(r.attendee_id || r.user_id || '');
      const prof = profilesMap[attendeeId];
      return {
        id: String(r.id),
        event_id: String(r.event_id),
        attendee_id: attendeeId,
        user_id: attendeeId,
        status: r.status || 'registered',
        created_at: r.created_at,
        event: ev,
        profile: prof
          ? {
              id: prof.id,
              email: prof.email,
              role: prof.role || 'attendee',
              full_name: prof.full_name,
            }
          : undefined,
      };
    });

    return { data: items };
  } catch (err: any) {
    return { data: [], error: err?.message };
  }
}
