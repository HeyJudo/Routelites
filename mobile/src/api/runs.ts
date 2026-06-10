import { supabase } from "../lib/supabase";
import type { ActiveDeliveryRun, ActiveDeliveryStop, DeliveryStopStatus, StartRunInput } from "../types/delivery";

// ---------------------------------------------------------------------------
// Row shape helpers (snake_case DB → camelCase types)
// ---------------------------------------------------------------------------

interface DeliveryRunRow {
  id: string;
  user_id: string;
  saved_route_id: string | null;
  name: string | null;
  status: string;
  optimized_order: string[] | null;
  total_distance_m: number | null;
  started_at: string;
  completed_at: string | null;
}

interface DeliveryStopRow {
  id: string;
  run_id: string;
  stop_index: number;
  label: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  status: string;
  note: string | null;
}

function rowToStop(row: DeliveryStopRow): ActiveDeliveryStop {
  return {
    id: row.id,
    stopIndex: row.stop_index,
    label: row.label ?? "",
    address: row.address ?? "",
    lat: row.lat ?? 0,
    lng: row.lng ?? 0,
    status: row.status as DeliveryStopStatus,
    note: row.note ?? undefined,
  };
}

function rowToRun(run: DeliveryRunRow, stops: DeliveryStopRow[]): ActiveDeliveryRun {
  return {
    id: run.id,
    savedRouteId: run.saved_route_id,
    name: run.name,
    status: run.status as ActiveDeliveryRun["status"],
    optimizedOrder: run.optimized_order ?? [],
    totalDistanceM: run.total_distance_m ?? 0,
    stops: stops.map(rowToStop),
    startedAt: run.started_at,
    completedAt: run.completed_at,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function startRunRemote(input: StartRunInput, userId: string): Promise<ActiveDeliveryRun> {
  const { data: runRow, error: runError } = await supabase
    .from("delivery_runs")
    .insert({
      user_id: userId,
      saved_route_id: input.savedRouteId ?? null,
      name: input.name ?? null,
      status: "active",
      optimized_order: input.optimizedOrder,
      total_distance_m: input.totalDistanceM,
    })
    .select()
    .single<DeliveryRunRow>();

  if (runError || !runRow) {
    throw runError ?? new Error("Failed to create delivery run");
  }

  const stopInserts = input.stops.map((s, i) => ({
    run_id: runRow.id,
    stop_index: i,
    label: s.label,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    status: "pending" as const,
  }));

  const { data: stopRows, error: stopsError } = await supabase
    .from("delivery_stops")
    .insert(stopInserts)
    .select();

  if (stopsError) {
    throw stopsError;
  }

  return rowToRun(runRow, (stopRows as DeliveryStopRow[]) ?? []);
}

export async function getActiveRunRemote(userId: string): Promise<ActiveDeliveryRun | null> {
  const { data: runRow, error: runError } = await supabase
    .from("delivery_runs")
    .select()
    .eq("user_id", userId)
    .eq("status", "active")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle<DeliveryRunRow>();

  if (runError) throw runError;
  if (!runRow) return null;

  const { data: stopRows, error: stopsError } = await supabase
    .from("delivery_stops")
    .select()
    .eq("run_id", runRow.id)
    .order("stop_index", { ascending: true });

  if (stopsError) throw stopsError;

  return rowToRun(runRow, (stopRows as DeliveryStopRow[]) ?? []);
}

export async function updateStopStatusRemote(
  stopId: string,
  status: DeliveryStopStatus,
  note?: string,
): Promise<void> {
  const { error } = await supabase
    .from("delivery_stops")
    .update({
      status,
      note: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", stopId);

  if (error) throw error;
}

export async function completeRunRemote(runId: string): Promise<void> {
  const { error } = await supabase
    .from("delivery_runs")
    .update({ status: "completed", completed_at: new Date().toISOString() })
    .eq("id", runId);

  if (error) throw error;
}

export async function cancelRunRemote(runId: string): Promise<void> {
  const { error } = await supabase
    .from("delivery_runs")
    .update({ status: "cancelled", completed_at: new Date().toISOString() })
    .eq("id", runId);

  if (error) throw error;
}
