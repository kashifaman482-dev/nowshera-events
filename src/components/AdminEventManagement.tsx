import React, { useState } from 'react';
import { EventItem, EventStatus, EventUpsertPayload } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Plus,
  Edit2,
  CheckCircle,
  XCircle,
  Clock3,
  FileText,
  Search,
  Loader2,
  X,
  AlertCircle,
  RefreshCw,
  Send,
} from 'lucide-react';

interface AdminEventManagementProps {
  events: EventItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onUpsertEvent: (payload: EventUpsertPayload) => Promise<void>;
  onChangeStatus: (eventId: string, status: EventStatus) => Promise<void>;
  updatingEventId: string | null;
  isSavingEvent: boolean;
}

export const AdminEventManagement: React.FC<AdminEventManagementProps> = ({
  events,
  isLoading,
  onRefresh,
  onUpsertEvent,
  onChangeStatus,
  updatingEventId,
  isSavingEvent,
}) => {
  const { session } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [formData, setFormData] = useState<EventUpsertPayload>({
    title: '',
    description: '',
    event_date: '',
    event_time: '',
    location: '',
    capacity: 50,
    status: 'draft',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const openCreateModal = () => {
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      event_date: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
      event_time: '10:00 AM',
      location: 'Nowshera Cantt Community Hall',
      capacity: 100,
      status: 'draft',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (event: EventItem) => {
    setEditingEvent(event);
    setFormData({
      id: event.id,
      title: event.title,
      description: event.description,
      event_date: event.event_date || '',
      event_time: event.event_time || '',
      location: event.location || '',
      capacity: event.capacity || 50,
      status: event.status || 'draft',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError('Event title is required');
      return;
    }
    if (!formData.event_date) {
      setFormError('Event date is required');
      return;
    }
    if (formData.capacity <= 0) {
      setFormError('Capacity must be greater than 0');
      return;
    }

    try {
      await onUpsertEvent(formData);
      setIsModalOpen(false);
    } catch (err: any) {
      setFormError(err?.message || 'Failed to save event');
    }
  };

  const filteredEvents = events.filter((ev) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      ev.title.toLowerCase().includes(q) ||
      ev.location.toLowerCase().includes(q) ||
      ev.description.toLowerCase().includes(q);

    if (!matchesSearch) return false;
    if (statusFilter !== 'all' && ev.status !== statusFilter) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Event Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
              {events.length} Total Events
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Create, modify schedules, update capacity, and control publication status
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="events-table-refresh-btn"
            disabled={isLoading}
            onClick={onRefresh}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh events"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            id="create-event-btn"
            onClick={openCreateModal}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create New Event
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="events-mgmt-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search events table..."
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>

        {/* Status filters */}
        <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl shrink-0 overflow-x-auto">
          {['all', 'published', 'draft', 'completed', 'cancelled'].map((st) => (
            <button
              key={st}
              id={`filter-status-${st}`}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading events catalog...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredEvents.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Events Listed</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            {searchQuery
              ? `No events match "${searchQuery}".`
              : 'Get started by creating the first event schedule for Nowshera.'}
          </p>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl"
          >
            Create First Event
          </button>
        </div>
      )}

      {/* Events Table */}
      {!isLoading && filteredEvents.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Event Title & Venue</th>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Capacity</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Change Status</th>
                  <th className="py-3.5 px-4 text-right sm:pr-6">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEvents.map((ev) => {
                  const isRowUpdating = updatingEventId === ev.id;
                  const remaining =
                    ev.remaining_capacity !== undefined
                      ? ev.remaining_capacity
                      : Math.max(0, ev.capacity - (ev.registered_count || 0));

                  return (
                    <tr
                      key={ev.id}
                      id={`event-mgmt-row-${ev.id}`}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Title and location */}
                      <td className="py-4 px-4 sm:px-6 max-w-xs">
                        <div className="font-bold text-slate-900 leading-snug">{ev.title}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{ev.location || 'Nowshera'}</span>
                        </div>
                      </td>

                      {/* Date & Time */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs font-medium text-slate-800">
                          {ev.event_date
                            ? new Date(ev.event_date).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'TBA'}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {ev.event_time || 'TBA'}
                        </div>
                      </td>

                      {/* Capacity & Registered */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs font-semibold text-slate-800">
                          {ev.registered_count || 0} / {ev.capacity}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {remaining} spots free
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${
                            ev.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : ev.status === 'draft'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : ev.status === 'completed'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}
                        >
                          {ev.status}
                        </span>
                      </td>

                      {/* Status Change Buttons */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {isRowUpdating ? (
                          <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Updating...
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            {/* Publish button */}
                            {ev.status !== 'published' && (
                              <button
                                id={`status-publish-${ev.id}`}
                                onClick={() => onChangeStatus(ev.id, 'published')}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-lg border border-emerald-200 transition-colors"
                                title="Publish event to attendees"
                              >
                                Publish
                              </button>
                            )}
                            {/* Draft button */}
                            {ev.status !== 'draft' && (
                              <button
                                id={`status-draft-${ev.id}`}
                                onClick={() => onChangeStatus(ev.id, 'draft')}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition-colors"
                                title="Set back to draft"
                              >
                                Draft
                              </button>
                            )}
                            {/* Complete button */}
                            {ev.status !== 'completed' && (
                              <button
                                id={`status-complete-${ev.id}`}
                                onClick={() => onChangeStatus(ev.id, 'completed')}
                                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-semibold rounded-lg border border-blue-200 transition-colors"
                                title="Mark as completed"
                              >
                                Complete
                              </button>
                            )}
                            {/* Cancel button */}
                            {ev.status !== 'cancelled' && (
                              <button
                                id={`status-cancel-${ev.id}`}
                                onClick={() => onChangeStatus(ev.id, 'cancelled')}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] font-semibold rounded-lg border border-rose-200 transition-colors"
                                title="Mark as cancelled"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Edit action */}
                      <td className="py-4 px-4 sm:pr-6 text-right whitespace-nowrap">
                        <button
                          id={`edit-event-btn-${ev.id}`}
                          onClick={() => openEditModal(ev)}
                          className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors inline-flex items-center gap-1 font-semibold text-xs"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          id="event-form-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            id="event-form-dialog"
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {editingEvent ? 'Edit Event Details' : 'Create New Event'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Sends payload to backend webhook endpoint <code className="text-indigo-600 font-mono">/event-upsert</code>
                </p>
              </div>
              <button
                id="close-event-form-btn"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleFormSubmit} className="p-6 overflow-y-auto space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 font-medium">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Event Title *
                </label>
                <input
                  id="form-event-title"
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Nowshera AI Builders Meetup"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description *
                </label>
                <textarea
                  id="form-event-description"
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the agenda, audience, and key highlights..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Date (YYYY-MM-DD) *
                  </label>
                  <input
                    id="form-event-date"
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Event Time *
                  </label>
                  <input
                    id="form-event-time"
                    type="text"
                    required
                    value={formData.event_time}
                    onChange={(e) => setFormData({ ...formData, event_time: e.target.value })}
                    placeholder="e.g. 10:00 AM or 18:30"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Location and Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Venue Location *
                  </label>
                  <input
                    id="form-event-location"
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g. Main Auditorium, Nowshera Cantt"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Capacity (Seats) *
                  </label>
                  <input
                    id="form-event-capacity"
                    type="number"
                    min={1}
                    max={10000}
                    required
                    value={formData.capacity}
                    onChange={(e) =>
                      setFormData({ ...formData, capacity: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status
                </label>
                <select
                  id="form-event-status"
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as EventStatus })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="draft">Draft (Private, not listed to attendees)</option>
                  <option value="published">Published (Live & open for registration)</option>
                  <option value="completed">Completed (Past event)</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>

                <button
                  id="submit-event-btn"
                  type="submit"
                  disabled={isSavingEvent}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingEvent ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving via Webhook...
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      {editingEvent ? 'Update Event' : 'Create Event'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
