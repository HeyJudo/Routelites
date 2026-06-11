-- =============================================================================
-- RouteLite Supabase Schema
-- Phase 1.1: Database tables, RLS policies, trigger, and indexes
-- Run this in Supabase Dashboard → SQL Editor → Run (idempotent)
-- =============================================================================


-- =============================================================================
-- SECTION 1: TABLES
-- =============================================================================

-- profiles: one row per authenticated user, stores display preferences
create table if not exists public.profiles (
    id              uuid primary key references auth.users(id) on delete cascade,
    display_name    text,
    default_store   jsonb,
    created_at      timestamptz not null default now()
);

comment on table public.profiles is
    'One row per authenticated user. Stores display name and default store preferences.';

-- saved_routes: reusable route templates a user can name and re-run
create table if not exists public.saved_routes (
    id          uuid primary key default gen_random_uuid(),
    user_id     uuid not null references auth.users(id) on delete cascade,
    name        text not null,
    store       jsonb not null,
    stops       jsonb not null,
    updated_at  timestamptz not null default now(),
    created_at  timestamptz not null default now()
);

comment on table public.saved_routes is
    'Named, reusable route templates created by a user, including store and stop definitions.';

-- delivery_runs: a single execution of a route, tracking progress and outcome
create table if not exists public.delivery_runs (
    id                  uuid primary key default gen_random_uuid(),
    user_id             uuid not null references auth.users(id) on delete cascade,
    saved_route_id      uuid references public.saved_routes(id) on delete set null,
    name                text,
    status              text not null default 'active'
                            check (status in ('active', 'completed', 'cancelled')),
    optimized_order     jsonb,
    total_distance_m    integer,
    started_at          timestamptz not null default now(),
    completed_at        timestamptz,
    created_at          timestamptz not null default now()
);

comment on table public.delivery_runs is
    'A single delivery run execution. Tracks status, optimized stop order, and distance.';

-- delivery_stops: individual stops within a delivery run
create table if not exists public.delivery_stops (
    id          uuid primary key default gen_random_uuid(),
    run_id      uuid not null references public.delivery_runs(id) on delete cascade,
    stop_index  integer not null,
    label       text,
    address     text,
    lat         double precision,
    lng         double precision,
    status      text not null default 'pending'
                    check (status in ('pending', 'delivered', 'failed')),
    note        text,
    updated_at  timestamptz not null default now(),
    created_at  timestamptz not null default now()
);

comment on table public.delivery_stops is
    'Individual stops within a delivery run. Ownership is inferred via the parent delivery_runs row.';


-- =============================================================================
-- SECTION 2: INDEXES
-- =============================================================================

create index if not exists idx_saved_routes_user_id
    on public.saved_routes(user_id);

create index if not exists idx_delivery_runs_user_id
    on public.delivery_runs(user_id);

create index if not exists idx_delivery_runs_status
    on public.delivery_runs(status);

create index if not exists idx_delivery_stops_run_id
    on public.delivery_stops(run_id);

create index if not exists idx_delivery_stops_run_id_stop_index
    on public.delivery_stops(run_id, stop_index);


-- =============================================================================
-- SECTION 3: ROW LEVEL SECURITY — ENABLE
-- =============================================================================

alter table public.profiles        enable row level security;
alter table public.saved_routes    enable row level security;
alter table public.delivery_runs   enable row level security;
alter table public.delivery_stops  enable row level security;


-- =============================================================================
-- SECTION 4: RLS POLICIES — profiles
-- =============================================================================

drop policy if exists "profiles: select own" on public.profiles;
create policy "profiles: select own"
    on public.profiles for select
    using (auth.uid() = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own"
    on public.profiles for insert
    with check (auth.uid() = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own"
    on public.profiles for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

drop policy if exists "profiles: delete own" on public.profiles;
create policy "profiles: delete own"
    on public.profiles for delete
    using (auth.uid() = id);


-- =============================================================================
-- SECTION 5: RLS POLICIES — saved_routes
-- =============================================================================

drop policy if exists "saved_routes: select own" on public.saved_routes;
create policy "saved_routes: select own"
    on public.saved_routes for select
    using (auth.uid() = user_id);

drop policy if exists "saved_routes: insert own" on public.saved_routes;
create policy "saved_routes: insert own"
    on public.saved_routes for insert
    with check (auth.uid() = user_id);

drop policy if exists "saved_routes: update own" on public.saved_routes;
create policy "saved_routes: update own"
    on public.saved_routes for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "saved_routes: delete own" on public.saved_routes;
create policy "saved_routes: delete own"
    on public.saved_routes for delete
    using (auth.uid() = user_id);


-- =============================================================================
-- SECTION 6: RLS POLICIES — delivery_runs
-- =============================================================================

drop policy if exists "delivery_runs: select own" on public.delivery_runs;
create policy "delivery_runs: select own"
    on public.delivery_runs for select
    using (auth.uid() = user_id);

drop policy if exists "delivery_runs: insert own" on public.delivery_runs;
create policy "delivery_runs: insert own"
    on public.delivery_runs for insert
    with check (auth.uid() = user_id);

drop policy if exists "delivery_runs: update own" on public.delivery_runs;
create policy "delivery_runs: update own"
    on public.delivery_runs for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "delivery_runs: delete own" on public.delivery_runs;
create policy "delivery_runs: delete own"
    on public.delivery_runs for delete
    using (auth.uid() = user_id);


-- =============================================================================
-- SECTION 7: RLS POLICIES — delivery_stops (ownership via delivery_runs join)
-- =============================================================================

drop policy if exists "delivery_stops: select own" on public.delivery_stops;
create policy "delivery_stops: select own"
    on public.delivery_stops for select
    using (
        exists (
            select 1 from public.delivery_runs r
            where r.id = delivery_stops.run_id
              and r.user_id = auth.uid()
        )
    );

drop policy if exists "delivery_stops: insert own" on public.delivery_stops;
create policy "delivery_stops: insert own"
    on public.delivery_stops for insert
    with check (
        exists (
            select 1 from public.delivery_runs r
            where r.id = delivery_stops.run_id
              and r.user_id = auth.uid()
        )
    );

drop policy if exists "delivery_stops: update own" on public.delivery_stops;
create policy "delivery_stops: update own"
    on public.delivery_stops for update
    using (
        exists (
            select 1 from public.delivery_runs r
            where r.id = delivery_stops.run_id
              and r.user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.delivery_runs r
            where r.id = delivery_stops.run_id
              and r.user_id = auth.uid()
        )
    );

drop policy if exists "delivery_stops: delete own" on public.delivery_stops;
create policy "delivery_stops: delete own"
    on public.delivery_stops for delete
    using (
        exists (
            select 1 from public.delivery_runs r
            where r.id = delivery_stops.run_id
              and r.user_id = auth.uid()
        )
    );


-- =============================================================================
-- SECTION 8: TRIGGER — auto-create profile on new user signup
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id)
    values (new.id)
    on conflict (id) do nothing;
    return new;
end;
$$;

-- Drop and recreate trigger to ensure idempotency
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();
