# Nowshera Events — Event Registration & Management System

**Live App:** https://nowshera-events.ai.studio

## Test Credentials
- **Admin:** kashiiaman32@gmail.com / 11220099
- **Attendee:** kashifaman3211@gmail.com / 11220099

## Architecture
- **Supabase** — Postgres database, authentication, and Row Level Security (RLS) for read access control
- **n8n** — backend API layer; five webhook-triggered workflows enforce all business rules server-side (registration, cancellation, event management, status changes, dashboard aggregation)
- **Google AI Studio (React/Vite)** — frontend; calls Supabase directly for reads (events, own registrations) and n8n webhooks for all writes, so business rules are always enforced server-side, not just in the UI

## Setup
1. **Supabase:** create tables (`profiles`, `events`, `registrations`), the `event_stats` view, and RLS policies
2. **n8n:** import the 5 workflows (Register, Cancel, Event Create/Edit, Event Status Change, Dashboard), connect Supabase credential, activate each
3. **Frontend:** set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_WEBHOOK_BASE_URL` env vars, deploy

## Known Limitations
- - All core flows  registration, cancellation, event management, status changes, and the admin dashboard are fully functional end-to-end.
