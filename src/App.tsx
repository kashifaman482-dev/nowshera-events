import React, { useState, useEffect, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar, ActiveTab } from './components/Navbar';
import { UpcomingEvents } from './components/UpcomingEvents';
import { EventDetailsModal } from './components/EventDetailsModal';
import { MyRegistrations } from './components/MyRegistrations';
import { AdminGuard } from './components/AdminGuard';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminEventManagement } from './components/AdminEventManagement';
import { AdminAttendeeList } from './components/AdminAttendeeList';
import { AuthModal } from './components/AuthModal';
import { NotificationBanner, ToastMessage } from './components/NotificationBanner';
import {
  getPublishedEvents,
  getAllEvents,
  getUserRegistrations,
  getAllRegistrationsWithDetails,
} from './lib/dataService';
import {
  registerForEvent,
  cancelRegistration,
  upsertEvent,
  changeEventStatus,
} from './lib/api';
import { supabase } from './lib/supabase';
import { EventItem, RegistrationItem, EventUpsertPayload, EventStatus } from './types';

function MainAppContent() {
  const { user, session, isAdmin } = useAuth();

  // Navigation state
  const [activeTab, setActiveTab] = useState<ActiveTab>('events');

  // Modals state
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(null);

  // Data states
  const [events, setEvents] = useState<EventItem[]>([]);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [userRegistrations, setUserRegistrations] = useState<RegistrationItem[]>([]);
  const [allRegistrations, setAllRegistrations] = useState<RegistrationItem[]>([]);

  // Loading states
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [isLoadingRegistrations, setIsLoadingRegistrations] = useState(false);
  const [isLoadingAllRegistrations, setIsLoadingAllRegistrations] = useState(false);
  const [registeringEventId, setRegisteringEventId] = useState<string | null>(null);
  const [cancellingRegId, setCancellingRegId] = useState<string | null>(null);
  const [updatingEventId, setUpdatingEventId] = useState<string | null>(null);
  const [isSavingEvent, setIsSavingEvent] = useState(false);

  // Toast notifications
  const [notifications, setNotifications] = useState<ToastMessage[]>([]);

  const notify = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString() + Math.random().toString().slice(2, 6);
    setNotifications((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 6000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Fetch events
  const loadEvents = useCallback(async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const res = isAdmin ? await getAllEvents() : await getPublishedEvents();
      setEvents(res.data);
      if (res.error) {
        setEventsError(res.error);
        notify('error', res.error);
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to load events';
      setEventsError(msg);
      notify('error', msg);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [isAdmin, notify]);

  // Fetch attendee registrations
  const loadUserRegistrations = useCallback(async () => {
    if (!user) {
      setUserRegistrations([]);
      return;
    }
    setIsLoadingRegistrations(true);
    try {
      const res = await getUserRegistrations(user.id);
      setUserRegistrations(res.data);
      if (res.error) {
        notify('error', `Registrations notice: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Error loading user registrations:', err);
    } finally {
      setIsLoadingRegistrations(false);
    }
  }, [user, notify]);

  // Fetch all registrations for admin attendee roster
  const loadAllRegistrations = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingAllRegistrations(true);
    try {
      const res = await getAllRegistrationsWithDetails();
      setAllRegistrations(res.data);
      if (res.error) {
        notify('error', `Attendee roster notice: ${res.error}`);
      }
    } catch (err: any) {
      console.error('Error loading all registrations:', err);
    } finally {
      setIsLoadingAllRegistrations(false);
    }
  }, [isAdmin, notify]);

  // Initial loads
  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    loadUserRegistrations();
  }, [loadUserRegistrations]);

  useEffect(() => {
    if (isAdmin && activeTab === 'admin-attendees') {
      loadAllRegistrations();
    }
  }, [isAdmin, activeTab, loadAllRegistrations]);

  // Handle Event Registration via POST /webhook/register-event
  const handleRegister = async (eventId: string) => {
    if (!user) {
      setAuthModalOpen(true);
      notify('info', 'Please sign in or register an attendee account first.');
      return;
    }

    setRegisteringEventId(eventId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const activeSession = sessionData?.session || session;
      const rawToken = activeSession?.access_token || '';
      const cleanToken = rawToken.trim().replace(/^Bearer\s+/i, '').trim();

      if (!cleanToken) {
        setAuthModalOpen(true);
        throw new Error('Authentication session expired. Please sign in again.');
      }

      await registerForEvent(eventId, cleanToken);
      notify('success', 'Successfully registered for event! Your ticket is confirmed.');
      // Refresh registrations and events
      await Promise.all([loadUserRegistrations(), loadEvents()]);
      if (isAdmin) {
        loadAllRegistrations();
      }
    } catch (err: any) {
      notify('error', err?.message || 'Registration failed. Please try again.');
    } finally {
      setRegisteringEventId(null);
    }
  };

  // Handle Registration Cancellation via POST /webhook/cancel
  // Sends exactly: Authorization: Bearer <the current session's access_token>
  const handleCancelRegistration = async (registrationId: string) => {
    // Get fresh session token directly from Supabase to guarantee unexpired JWT
    const { data: sessionData } = await supabase.auth.getSession();
    const activeSession = sessionData?.session || session;

    if (!activeSession || !activeSession.access_token) {
      notify('error', 'You must be signed in to cancel a registration.');
      return;
    }

    setCancellingRegId(registrationId);
    try {
      // Extract exactly the current session's access_token — a single clean JWT
      const rawToken = activeSession.access_token || '';
      const cleanToken = rawToken.trim().replace(/^Bearer\s+/i, '').replace(/^["']|["']$/g, '').trim();

      if (!cleanToken) {
        throw new Error('Invalid or missing session access token. Please sign in again.');
      }

      await cancelRegistration(registrationId, cleanToken);
      notify('success', 'Registration cancelled successfully.');
      await Promise.all([loadUserRegistrations(), loadEvents()]);
      if (selectedEvent) {
        setSelectedEvent(null);
      }
      if (isAdmin) {
        loadAllRegistrations();
      }
    } catch (err: any) {
      notify('error', err?.message || 'Failed to cancel registration.');
    } finally {
      setCancellingRegId(null);
    }
  };

  // Handle Create or Edit Event via POST /webhook/event-upsert
  const handleUpsertEvent = async (payload: EventUpsertPayload) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const activeSession = sessionData?.session || session;

    if (!activeSession || !activeSession.access_token) {
      notify('error', 'Admin authorization token required.');
      return;
    }

    setIsSavingEvent(true);
    try {
      const rawToken = activeSession.access_token || '';
      const cleanToken = rawToken.trim().replace(/^Bearer\s+/i, '').trim();
      await upsertEvent(payload, cleanToken);
      notify(
        'success',
        payload.id ? 'Event updated successfully!' : 'New event created successfully!'
      );
      await loadEvents();
    } catch (err: any) {
      notify('error', err?.message || 'Failed to save event to backend.');
      throw err;
    } finally {
      setIsSavingEvent(false);
    }
  };

  // Handle Status Change via POST /webhook/event-status
  const handleChangeEventStatus = async (eventId: string, status: EventStatus) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const activeSession = sessionData?.session || session;

    if (!activeSession || !activeSession.access_token) {
      notify('error', 'Admin authorization token required.');
      return;
    }

    setUpdatingEventId(eventId);
    try {
      const rawToken = activeSession.access_token || '';
      const cleanToken = rawToken.trim().replace(/^Bearer\s+/i, '').trim();
      await changeEventStatus(eventId, status, cleanToken);
      notify('success', `Event status changed to "${status}".`);
      await loadEvents();
    } catch (err: any) {
      notify('error', err?.message || 'Failed to update event status.');
    } finally {
      setUpdatingEventId(null);
    }
  };

  // Find user's active registration for selected event (if any)
  const selectedEventRegistration = selectedEvent
    ? userRegistrations.find(
        (r) => String(r.event_id) === String(selectedEvent.id) && r.status !== 'cancelled'
      )
    : null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'events' && (
          <UpcomingEvents
            events={events}
            userRegistrations={userRegistrations}
            isLoading={isLoadingEvents}
            errorMessage={eventsError}
            onRegister={handleRegister}
            onSelectEvent={(event) => setSelectedEvent(event)}
            onOpenAuth={() => setAuthModalOpen(true)}
            registeringEventId={registeringEventId}
            onRefresh={loadEvents}
          />
        )}

        {activeTab === 'my-registrations' && (
          <MyRegistrations
            registrations={userRegistrations}
            isLoading={isLoadingRegistrations}
            onCancelRegistration={handleCancelRegistration}
            cancellingRegId={cancellingRegId}
            onBrowseEvents={() => setActiveTab('events')}
            onOpenAuth={() => setAuthModalOpen(true)}
            onSelectEvent={(event) => setSelectedEvent(event)}
          />
        )}

        {/* Route Guarded Admin Pages */}
        {activeTab === 'admin-dashboard' && (
          <AdminGuard onOpenAuth={() => setAuthModalOpen(true)}>
            <AdminDashboard
              supabaseEvents={events}
              onCreateEvent={() => setActiveTab('admin-events')}
              onNavigateEvents={() => setActiveTab('admin-events')}
              onNavigateAttendees={() => setActiveTab('admin-attendees')}
            />
          </AdminGuard>
        )}

        {activeTab === 'admin-events' && (
          <AdminGuard onOpenAuth={() => setAuthModalOpen(true)}>
            <AdminEventManagement
              events={events}
              isLoading={isLoadingEvents}
              onRefresh={loadEvents}
              onUpsertEvent={handleUpsertEvent}
              onChangeStatus={handleChangeEventStatus}
              updatingEventId={updatingEventId}
              isSavingEvent={isSavingEvent}
            />
          </AdminGuard>
        )}

        {activeTab === 'admin-attendees' && (
          <AdminGuard onOpenAuth={() => setAuthModalOpen(true)}>
            <AdminAttendeeList
              registrations={allRegistrations}
              events={events}
              isLoading={isLoadingAllRegistrations}
              onRefresh={loadAllRegistrations}
              onNotify={notify}
            />
          </AdminGuard>
        )}
      </main>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        userRegistration={selectedEventRegistration}
        onRegister={handleRegister}
        onCancel={handleCancelRegistration}
        isLoadingAction={Boolean(registeringEventId || cancellingRegId)}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      {/* Sign In / Sign Up Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          loadUserRegistrations();
          loadEvents();
        }}
      />

      {/* Toast Notifications */}
      <NotificationBanner notifications={notifications} onDismiss={dismissNotification} />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">Nowshera Events</span>
            <span>•</span>
            <span>Community Event Registration & Administration Platform</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Nowshera, Khyber Pakhtunkhwa</span>
            <span>•</span>
            <span>Powered by Supabase & Automation Webhooks</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
