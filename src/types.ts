export type UserRole = 'attendee' | 'admin';

export type EventStatus = 'draft' | 'published' | 'completed' | 'cancelled';

export interface EventItem {
  id: string;
  title: string;
  description: string;
  event_date: string; // YYYY-MM-DD
  event_time: string; // HH:mm or e.g. "18:00"
  location: string;
  capacity: number;
  status: EventStatus;
  created_at?: string;
  updated_at?: string;
  // Computed or aggregated client-side/joined:
  registered_count?: number;
  remaining_capacity?: number;
}

export interface RegistrationItem {
  id: string;
  event_id: string;
  attendee_id: string;
  user_id?: string;
  created_at?: string;
  status?: string;
  // Joined relation:
  event?: EventItem;
  events?: EventItem;
  profile?: UserProfile;
  profiles?: UserProfile;
}

export interface UserProfile {
  id: string;
  email?: string;
  role: UserRole;
  full_name?: string;
  created_at?: string;
}

export interface EventUpsertPayload {
  id?: string;
  title: string;
  description: string;
  event_date: string;
  event_time: string;
  location: string;
  capacity: number;
  status: EventStatus;
}

export interface DashboardItem {
  id?: string;
  event_id?: string;
  title?: string;
  capacity?: number;
  registered_count?: number;
  registrations_count?: number;
  attendees_count?: number;
  remaining_capacity?: number;
  status?: string;
  [key: string]: any;
}

export interface DashboardTotals {
  totalEvents: number;
  totalRegistrations: number;
  totalRemainingCapacity: number;
  totalCapacity: number;
  publishedCount: number;
  draftCount: number;
  completedCount: number;
  cancelledCount: number;
}
