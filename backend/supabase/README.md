# RouteLite — Supabase Schema

## What this file is

`schema.sql` defines the complete Postgres database schema for RouteLite on Supabase. It creates four tables (`profiles`, `saved_routes`, `delivery_runs`, `delivery_stops`), enables Row Level Security (RLS) on all of them, adds ownership-scoped RLS policies for every CRUD operation, creates performance indexes, and installs a trigger that automatically creates a `profiles` row whenever a new user signs up.

All statements use `create … if not exists` / `create or replace` / `drop … if exists` patterns, so the file is safe to re-run without manual cleanup.

## How to apply it

### Option A — Supabase Dashboard (quickest)

1. Open your Supabase project dashboard.
2. Go to **SQL Editor** in the left sidebar.
3. Click **New query**, paste the entire contents of `schema.sql`, and click **Run**.

### Option B — Supabase CLI

```bash
# Link your project first (one-time):
supabase link --project-ref <your-project-ref>

# Push the schema:
supabase db push
```

Or run the file directly against your database URL:

```bash
psql "$DATABASE_URL" -f backend/supabase/schema.sql
```

## RLS and API key usage

Row Level Security is enabled on every table. This means:

- The mobile app **must** use the `anon` (public) key from your Supabase project settings. This key correctly enforces RLS — users can only access their own data.
- **Never** ship or expose the `service_role` key in the mobile app. The `service_role` key bypasses RLS entirely and would allow any user to read or modify all data.

## Auth providers

The schema relies on `auth.uid()` resolving to a valid user. You must enable at least one auth provider in your Supabase project:

1. Go to **Authentication → Providers** in the Supabase dashboard.
2. Enable **Email/Password** (recommended for development).
3. Optionally enable **Google** (OAuth — requires a Google Cloud OAuth 2.0 client ID and secret).

New users are automatically given a `profiles` row via the `on_auth_user_created` trigger defined in `schema.sql`.
