import { EventUpsertPayload, EventStatus, DashboardItem } from '../types';
import { supabase } from './supabase';

const BASE_WEBHOOK_URL =
  import.meta.env.VITE_WEBHOOK_BASE_URL ||
  'https://ai-skool-n8n-57b1748669d9.herokuapp.com/webhook';

interface RequestOptions {
  token?: string | null;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: any;
}

/**
 * Resolves exactly the current session's access_token as a single clean JWT.
 * Ensures:
 * 1. It is a user session access_token (not the anon key).
 * 2. It strips any accidental 'Bearer ' prefix, quotes, or whitespace.
 * 3. It validates that it is a 3-segment dot-separated JWT.
 */
export async function resolveCleanUserAccessToken(providedToken?: string | null): Promise<string> {
  let rawToken = providedToken;

  // If no token provided or empty, dynamically retrieve fresh session directly from Supabase
  if (!rawToken || typeof rawToken !== 'string' || rawToken.trim() === '') {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw new Error(`Failed to retrieve user session: ${error.message}`);
    }
    rawToken = data.session?.access_token || null;
  }

  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('No active user session found. Please sign in to perform this action.');
  }

  // Strip any accidental 'Bearer ' prefix, surrounding quotes, or whitespace
  let cleanToken = rawToken.trim();
  cleanToken = cleanToken.replace(/^Bearer\s+/i, '').trim();
  cleanToken = cleanToken.replace(/^["']|["']$/g, '').trim();

  // Validate that token is a standard JWT (header.payload.signature)
  const segments = cleanToken.split('.');
  if (segments.length !== 3) {
    throw new Error(
      `Invalid session token format (${segments.length} segment${segments.length === 1 ? '' : 's'}). Please sign in again.`
    );
  }

  return cleanToken;
}

async function requestWebhook<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { token, method = 'POST', body } = options;
  const url = `${BASE_WEBHOOK_URL.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

  const headers: Record<string, string> = {};
  if (token) {
    // Ensure token is strictly a single clean JWT with no duplicate 'Bearer '
    const cleanJwt = token.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();
    if (cleanJwt) {
      headers['Authorization'] = `Bearer ${cleanJwt}`;
    }
  }
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  // Browser console log for inspecting the Authorization header right before sending
  console.log(`[Webhook Request: /${endpoint.replace(/^\/+/, '')}]`, {
    url,
    method,
    authorizationHeader: headers['Authorization'] || '(none)',
    jwtSegmentCount: headers['Authorization']
      ? headers['Authorization'].replace(/^Bearer\s+/i, '').split('.').length
      : 0,
    body,
  });

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (networkError: any) {
    throw new Error(
      `Network error communicating with server: ${networkError?.message || 'Please check your connection.'}`
    );
  }

  // Parse response
  const contentType = response.headers.get('content-type') || '';
  let responseData: any = null;

  if (contentType.includes('application/json')) {
    try {
      responseData = await response.json();
    } catch {
      responseData = null;
    }
  } else {
    try {
      const text = await response.text();
      if (text) {
        try {
          responseData = JSON.parse(text);
        } catch {
          responseData = text;
        }
      }
    } catch {
      responseData = null;
    }
  }

  if (!response.ok) {
    const errorMsg =
      (typeof responseData === 'object' && responseData !== null
        ? responseData.message || responseData.error || responseData.msg
        : typeof responseData === 'string' && responseData.trim()
        ? responseData
        : `Request failed with status ${response.status} (${response.statusText})`);

    throw new Error(errorMsg);
  }

  return responseData as T;
}

/**
 * Register attendee for an event
 * POST /webhook/register-event — body: { event_id }
 */
export async function registerForEvent(eventId: string, token?: string | null) {
  const cleanToken = await resolveCleanUserAccessToken(token);
  return requestWebhook('register-event', {
    method: 'POST',
    token: cleanToken,
    body: { event_id: eventId },
  });
}

/**
 * Cancel registration
 * POST /webhook/cancel — body: { registration_id }
 * Sends exactly: Authorization: Bearer <the current session's access_token>
 */
export async function cancelRegistration(registrationId: string, token?: string | null) {
  const cleanToken = await resolveCleanUserAccessToken(token);
  return requestWebhook('cancel', {
    method: 'POST',
    token: cleanToken,
    body: { registration_id: registrationId },
  });
}

/**
 * Create or Edit event (admin)
 * POST /webhook/event-upsert — body: { id?, title, description, event_date, event_time, location, capacity, status }
 */
export async function upsertEvent(payload: EventUpsertPayload, token?: string | null) {
  const cleanToken = await resolveCleanUserAccessToken(token);
  const body: Record<string, any> = {
    title: payload.title.trim(),
    description: payload.description.trim(),
    event_date: payload.event_date,
    event_time: payload.event_time,
    location: payload.location.trim(),
    capacity: Number(payload.capacity),
    status: payload.status,
  };

  if (payload.id) {
    body.id = payload.id;
  }

  return requestWebhook('event-upsert', {
    method: 'POST',
    token: cleanToken,
    body,
  });
}

/**
 * Change event status (admin)
 * POST /webhook/event-status — body: { event_id, status }
 */
export async function changeEventStatus(eventId: string, status: EventStatus, token?: string | null) {
  const cleanToken = await resolveCleanUserAccessToken(token);
  return requestWebhook('event-status', {
    method: 'POST',
    token: cleanToken,
    body: {
      event_id: eventId,
      status,
    },
  });
}

/**
 * Fetch dashboard items (admin)
 * GET /webhook/dashboard
 */
export async function fetchDashboardData(token?: string | null): Promise<DashboardItem[]> {
  let cleanToken: string | null = null;
  try {
    cleanToken = await resolveCleanUserAccessToken(token);
  } catch {
    cleanToken = token?.trim().replace(/^Bearer\s+/i, '') || null;
  }

  const result = await requestWebhook<DashboardItem[] | { data: DashboardItem[] } | any>('dashboard', {
    method: 'GET',
    token: cleanToken,
  });

  if (Array.isArray(result)) {
    return result;
  }
  if (result && Array.isArray(result.data)) {
    return result.data;
  }
  if (result && Array.isArray(result.events)) {
    return result.events;
  }
  // If empty response or object
  return [];
}
