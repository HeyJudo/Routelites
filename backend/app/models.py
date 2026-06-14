from typing import Literal

from pydantic import BaseModel, Field


class Coordinate(BaseModel):
    lat: float
    lng: float


class StoreLocation(Coordinate):
    label: str = "Store"
    address: str = ""


class StopLocation(Coordinate):
    id: str
    label: str
    address: str = ""


class PlaceInfo(BaseModel):
    label: str
    address: str = ""


class OptimizeRequest(BaseModel):
    store: StoreLocation
    stops: list[StopLocation] = Field(min_length=1)
    mode: Literal["distance", "time"] = "distance"


class RoutePathPoint(BaseModel):
    lat: float
    lng: float


class RouteLegResponse(BaseModel):
    source: str = Field(serialization_alias="from")
    target: str = Field(serialization_alias="to")
    distance_m: int
    path: list[RoutePathPoint]
    time_min: float | None = None
    congestion: Literal["low", "moderate", "heavy"] | None = None


class RouteResponse(BaseModel):
    order: list[str]
    total_distance_m: int
    legs: list[RouteLegResponse]


class SavingsResponse(BaseModel):
    distance_m: int
    percentage: float
    time_min: float | None = None


class MetadataResponse(BaseModel):
    mode: Literal["exact", "clustered"]
    stops_processed: int
    dijkstra_runs: int
    distance_matrix_size: str
    branches_explored: int
    branches_pruned: int
    batches_used: int
    exact_global_optimum: bool
    computation_time_ms: int
    objective: Literal["distance", "time"] = "distance"
    traffic_source: Literal["none", "live", "mock"] = "none"
    optimized_time_min: float | None = None
    naive_time_min: float | None = None
    traffic_as_of: str | None = None


class OptimizeResponse(BaseModel):
    optimized_route: RouteResponse
    naive_route: RouteResponse
    savings: SavingsResponse
    metadata: MetadataResponse
    places: dict[str, PlaceInfo] = {}
