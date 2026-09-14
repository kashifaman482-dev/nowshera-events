import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchDashboardData } from '../lib/api';
import { EventItem, DashboardItem, DashboardTotals } from '../types';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Ticket,
  TrendingUp,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  Plus,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

interface AdminDashboardProps {
  supabaseEvents: EventItem[];
  onCreateEvent: () => void;
  onNavigateEvents: () => void;
  onNavigateAttendees: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  supabaseEvents,
  onCreateEvent,
  onNavigateEvents,
  onNavigateAttendees,
}) => {
  const { session } = useAuth();
  const [dashboardItems, setDashboardItems] = useState<DashboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const token = session?.access_token || '';
      const items = await fetchDashboardData(token);
      setDashboardItems(items);
      setLastUpdated(new Date());
    } catch (err: any) {
      console.warn('Dashboard endpoint notice:', err?.message);
      setErrorMessage(
        err?.message || 'Could not fetch from webhook. Calculating from Supabase data.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [session?.access_token]);

  // Requirement: calculate totals client-side from the array the dashboard endpoint returns
  const totals: DashboardTotals = useMemo(() => {
    // If webhook returned items, calculate from webhook array
    if (dashboardItems && dashboardItems.length > 0) {
      const totalEvents = dashboardItems.length;
      let totalReg = 0;
      let totalCap = 0;
      let pub = 0;
      let dft = 0;
      let cmp = 0;
      let cnc = 0;

      dashboardItems.forEach((item) => {
        const cap = Number(item.capacity) || 0;
        const reg = Number(
          item.registered_count ||
            item.registrations_count ||
            item.attendees_count ||
            (Array.isArray(item.registrations) ? item.registrations.length : 0) ||
            0
        );
        totalCap += cap;
        totalReg += reg;

        const st = String(item.status || 'published').toLowerCase();
        if (st === 'published') pub++;
        else if (st === 'draft') dft++;
        else if (st === 'completed') cmp++;
        else if (st === 'cancelled') cnc++;
      });

      return {
        totalEvents,
        totalRegistrations: totalReg,
        totalCapacity: totalCap,
        totalRemainingCapacity: Math.max(0, totalCap - totalReg),
        publishedCount: pub,
        draftCount: dft,
        completedCount: cmp,
        cancelledCount: cnc,
      };
    }

    // Fallback: calculate client-side from Supabase events
    const totalEvents = supabaseEvents.length;
    let totalReg = 0;
    let totalCap = 0;
    let pub = 0;
    let dft = 0;
    let cmp = 0;
    let cnc = 0;

    supabaseEvents.forEach((ev) => {
      const cap = Number(ev.capacity) || 0;
      const reg = Number(ev.registered_count) || 0;
      totalCap += cap;
      totalReg += reg;

      if (ev.status === 'published') pub++;
      else if (ev.status === 'draft') dft++;
      else if (ev.status === 'completed') cmp++;
      else if (ev.status === 'cancelled') cnc++;
    });

    return {
      totalEvents,
      totalRegistrations: totalReg,
      totalCapacity: totalCap,
      totalRemainingCapacity: Math.max(0, totalCap - totalReg),
      publishedCount: pub,
      draftCount: dft,
      completedCount: cmp,
      cancelledCount: cnc,
    };
  }, [dashboardItems, supabaseEvents]);

  const occupancyRate =
    totals.totalCapacity > 0
      ? Math.round((totals.totalRegistrations / totals.totalCapacity) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin Overview</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculated client-side aggregates from webhook telemetry and event allocations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            id="admin-dashboard-refresh-btn"
            disabled={isLoading}
            onClick={loadData}
            className="p-2.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
          <button
            id="admin-dashboard-create-btn"
            onClick={onCreateEvent}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>
      </div>

      {/* Backend Alert / Status */}
      {errorMessage && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center justify-between">
          <span>Backend note: {errorMessage}</span>
          <button
            onClick={loadData}
            className="font-semibold underline ml-2 hover:text-amber-950"
          >
            Retry Webhook
          </button>
        </div>
      )}

      {/* KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Events */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Events
            </span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">{totals.totalEvents}</div>
            <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <span className="text-emerald-600 font-semibold">{totals.publishedCount} published</span>
              <span>•</span>
              <span>{totals.draftCount} draft</span>
            </div>
          </div>
        </div>

        {/* Total Registrations */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Registrations
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {totals.totalRegistrations}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Confirmed attendees</span>
            </div>
          </div>
        </div>

        {/* Remaining Capacity */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Remaining Capacity
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">
              {totals.totalRemainingCapacity}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Out of {totals.totalCapacity} total seat capacity
            </div>
          </div>
        </div>

        {/* Occupancy Fill Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Capacity Utilization
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold text-slate-900">{occupancyRate}%</div>
            {/* Progress indicator */}
            <div className="w-full h-2 bg-slate-100 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, occupancyRate)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation and Breakdown Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 mb-4">Event Status Distribution</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Published (Live for Registration)
                </span>
                <span className="font-bold text-slate-900">{totals.publishedCount}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${totals.totalEvents ? (totals.publishedCount / totals.totalEvents) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  Drafts (Under Preparation)
                </span>
                <span className="font-bold text-slate-900">{totals.draftCount}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full"
                  style={{
                    width: `${totals.totalEvents ? (totals.draftCount / totals.totalEvents) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  Completed (Past Events)
                </span>
                <span className="font-bold text-slate-900">{totals.completedCount}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full"
                  style={{
                    width: `${totals.totalEvents ? (totals.completedCount / totals.totalEvents) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-medium mb-1">
                <span className="text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Cancelled
                </span>
                <span className="font-bold text-slate-900">{totals.cancelledCount}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-rose-500 rounded-full"
                  style={{
                    width: `${totals.totalEvents ? (totals.cancelledCount / totals.totalEvents) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Admin Actions */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Administration Shortcuts</h2>
            <p className="text-xs text-slate-500 mb-4">
              Direct access to event lifecycle management and attendee rosters
            </p>

            <div className="space-y-3">
              <button
                onClick={onNavigateEvents}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-slate-50 transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">
                      Manage Events Table
                    </div>
                    <div className="text-xs text-slate-500">
                      Edit details, update statuses, or draft new schedules
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
              </button>

              <button
                onClick={onNavigateAttendees}
                className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-slate-50 transition-all text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-900 group-hover:text-emerald-600">
                      Registered Attendees Roster
                    </div>
                    <div className="text-xs text-slate-500">
                      Per-event registrations, attendee details, CSV export
                    </div>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Nowshera Events Platform</span>
            <span>Synced: {lastUpdated.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
