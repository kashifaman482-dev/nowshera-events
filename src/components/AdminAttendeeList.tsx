import React, { useState, useMemo } from 'react';
import { RegistrationItem, EventItem } from '../types';
import {
  Users,
  Search,
  Download,
  Copy,
  Check,
  Calendar,
  Mail,
  Ticket,
  Filter,
  RefreshCw,
  Loader2,
} from 'lucide-react';

interface AdminAttendeeListProps {
  registrations: RegistrationItem[];
  events: EventItem[];
  isLoading: boolean;
  onRefresh: () => void;
  onNotify: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const AdminAttendeeList: React.FC<AdminAttendeeListProps> = ({
  registrations,
  events,
  isLoading,
  onRefresh,
  onNotify,
}) => {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Filter registrations by selected event and search term
  const filteredAttendees = useMemo(() => {
    return registrations.filter((reg) => {
      // Event filter
      if (selectedEventId !== 'all' && String(reg.event_id) !== String(selectedEventId)) {
        return false;
      }

      // Search match
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const ev = reg.event || reg.events;
      const prof = reg.profile || reg.profiles;
      const attendeeName = (prof?.full_name || '').toLowerCase();
      const attendeeEmail = (prof?.email || '').toLowerCase();
      const eventTitle = (ev?.title || '').toLowerCase();
      const regId = (reg.id || '').toLowerCase();
      const attendeeId = (reg.attendee_id || reg.user_id || '').toLowerCase();

      return (
        attendeeName.includes(q) ||
        attendeeEmail.includes(q) ||
        eventTitle.includes(q) ||
        regId.includes(q) ||
        attendeeId.includes(q)
      );
    });
  }, [registrations, selectedEventId, searchQuery]);

  // Selected event title for display
  const selectedEventTitle =
    selectedEventId === 'all'
      ? 'All Events'
      : events.find((e) => String(e.id) === String(selectedEventId))?.title || 'Selected Event';

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredAttendees.length === 0) {
      onNotify('error', 'No attendee records to export.');
      return;
    }

    const headers = [
      'Registration ID',
      'Attendee Name',
      'Attendee Email',
      'Event Title',
      'Event Date',
      'Event Location',
      'Registration Date',
      'Status',
    ];

    const rows = filteredAttendees.map((reg) => {
      const ev = reg.event || reg.events;
      const prof = reg.profile || reg.profiles;
      const attendeeIdentifier = reg.attendee_id || reg.user_id || '';
      return [
        reg.id,
        prof?.full_name || 'Attendee',
        prof?.email || attendeeIdentifier,
        ev?.title || 'Unknown Event',
        ev?.event_date || '',
        ev?.location || '',
        reg.created_at ? new Date(reg.created_at).toISOString() : '',
        reg.status || 'registered',
      ].map((field) => `"${String(field).replace(/"/g, '""')}"`);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `nowshera_attendees_${selectedEventId === 'all' ? 'all' : 'event'}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onNotify('success', `Exported ${filteredAttendees.length} attendee records to CSV.`);
  };

  // Copy to Clipboard (TSV / formatted)
  const handleCopyClipboard = async () => {
    if (filteredAttendees.length === 0) {
      onNotify('error', 'No attendee records to copy.');
      return;
    }

    const header = ['ID', 'Name', 'Email', 'Event', 'Date', 'Status'].join('\t');
    const lines = filteredAttendees.map((reg) => {
      const ev = reg.event || reg.events;
      const prof = reg.profile || reg.profiles;
      const attendeeIdentifier = reg.attendee_id || reg.user_id || '';
      return [
        reg.id.slice(0, 8),
        prof?.full_name || 'Attendee',
        prof?.email || attendeeIdentifier,
        ev?.title || 'Event',
        ev?.event_date || '',
        reg.status || 'registered',
      ].join('\t');
    });

    const text = [header, ...lines].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onNotify('success', `Copied ${filteredAttendees.length} attendee entries to clipboard!`);
    } catch {
      onNotify('error', 'Failed to copy to clipboard.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendee Rosters</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {filteredAttendees.length} Registered
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Read directly from Supabase registrations joined with events
          </p>
        </div>

        {/* Top actions: Copy & Export CSV */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            id="attendees-refresh-btn"
            disabled={isLoading}
            onClick={onRefresh}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh attendee records"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            id="attendees-copy-btn"
            onClick={handleCopyClipboard}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy TSV'}
          </button>

          <button
            id="attendees-export-csv-btn"
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" />
            Export to CSV
          </button>
        </div>
      </div>

      {/* Filter and Select Event Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
        {/* Event Selector Dropdown */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Filter by Event
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              id="attendee-event-select"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="all">All Events ({events.length} available)</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.title} ({ev.registered_count || 0} registered)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Bar */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Search Attendees
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              id="attendees-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by attendee name, email, or registration ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>
      </div>

      {/* Summary Tag */}
      <div className="text-xs text-slate-600 flex items-center justify-between px-1">
        <span>
          Showing <span className="font-bold text-slate-900">{filteredAttendees.length}</span> attendees registered for{' '}
          <span className="font-semibold text-indigo-700">{selectedEventTitle}</span>
        </span>
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-slate-100">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mb-3" />
          <p className="text-sm font-semibold text-slate-700">Loading attendee records...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredAttendees.length === 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">No Attendees Found</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-4">
            {searchQuery
              ? `No attendees match your search "${searchQuery}".`
              : selectedEventId !== 'all'
              ? 'No attendees have registered for this event yet.'
              : 'There are currently no registrations recorded in the database.'}
          </p>
        </div>
      )}

      {/* Attendees Table */}
      {!isLoading && filteredAttendees.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Attendee</th>
                  <th className="py-3.5 px-4">Event</th>
                  <th className="py-3.5 px-4">Event Date</th>
                  <th className="py-3.5 px-4">Registration ID</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAttendees.map((reg) => {
                  const ev = reg.event || reg.events;
                  const prof = reg.profile || reg.profiles;
                  const attendeeName = prof?.full_name || 'Registered Attendee';
                  const attendeeIdentifier = reg.attendee_id || reg.user_id || '';
                  const attendeeEmail = prof?.email || `Attendee: ${attendeeIdentifier.slice(0, 8)}...`;

                  return (
                    <tr
                      key={reg.id}
                      id={`attendee-row-${reg.id}`}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Attendee Name & Email */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                            {attendeeName.charAt(0).toUpperCase()}
                          </div>
                          <span>{attendeeName}</span>
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 pl-9">
                          <Mail className="w-3 h-3 text-slate-400" />
                          <span>{attendeeEmail}</span>
                        </div>
                      </td>

                      {/* Event Title */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 leading-snug truncate">
                          {ev?.title || 'Nowshera Event'}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {ev?.location || 'Nowshera'}
                        </div>
                      </td>

                      {/* Event Date */}
                      <td className="py-4 px-4 whitespace-nowrap text-xs text-slate-600">
                        {ev?.event_date
                          ? new Date(ev.event_date).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })
                          : 'TBA'}
                      </td>

                      {/* Registration ID */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {reg.id.slice(0, 10)}...
                        </span>
                      </td>

                      {/* Status badge */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            reg.status === 'cancelled'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {reg.status || 'confirmed'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
