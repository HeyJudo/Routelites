# RouteLite

RouteLite is a DAA-focused mobile route optimizer for delivery riders and small local businesses in Metro Manila/NCR. It demonstrates Dijkstra's Algorithm for road-network shortest paths and Branch and Bound TSP for stop ordering.

The project is for COSC 203: Design and Analysis of Algorithms at PUP-CCIS.

## MVP Goal

Build a defense-ready mobile app that lets a user set a store location, add delivery stops, optimize the route, and compare:

- **Naive route:** the user's input order.
- **Optimized route:** the backend-computed route using Dijkstra + Branch and Bound.

Google Maps and Google Places are used for display and search only. Route optimization is computed by the RouteLite backend.

## Current Repo Status

This repo currently contains planning and context documents. Implementation starts from the backend foundation in `IMPLEMENTATION_PLAN.md`.

Read these first:

1. `IMPLEMENTATION_PLAN.md` - build phases, tasks, roles, dependencies, and timeline.
2. `CONTEXT.md` - RouteLite domain glossary and exactness rules.
3. `PRD.md` - product requirements and architecture.
4. `AGENT.md` - implementation guidance for AI/code agents.

## MVP Scope

Included in MVP:

- Expo React Native mobile app.
- Google Maps display.
- Google Places search.
- Store location setup.
- Stop input by search or map tap.
- NCR boundary validation.
- Python FastAPI backend.
- Custom Dijkstra implementation.
- Custom Branch and Bound TSP implementation.
- Naive route comparison.
- Exact/clustered mode labels.
- Algorithm details panel for defense.
- Local backend fallback.

Post-MVP only:

- Firebase Auth.
- Route history.
- Saved stops.
- Sharing.
- Google Maps/Waze navigation handoff.
- Real-time traffic.

## Exactness Policy

RouteLite separates road graph nodes from delivery stops:

- Road graph nodes may be large because Dijkstra can run on preprocessed OSM road graphs.
- Delivery stops are limited for exact TSP because Branch and Bound grows factorially.

Planned behavior:

| Stop Count | Mode | Claim |
|---:|---|---|
| 1-10 | Exact mode | Full-set Branch and Bound; exact global optimum for the selected distance matrix |
| 11-20 | Clustered mode | Optimized approximate route; not globally exact |
| 21+ | Large-route clustered mode | Accepted as approximate/batched optimization once implemented |

## Tech Stack

Frontend:

- Expo React Native
- TypeScript
- `react-native-maps`
- Google Maps SDK
- Google Places API
- React Navigation
- AsyncStorage or MMKV
- `@gorhom/bottom-sheet`

Backend:

- Python 3.11+
- FastAPI
- Uvicorn
- Pydantic
- custom adjacency-list graph
- custom Dijkstra
- custom Branch and Bound TSP

Graph/data pipeline:

- OpenStreetMap
- OSMnx
- NetworkX
- GeoPandas
- Shapely
- NumPy / SciPy / scikit-learn
- checked-in NCR boundary GeoJSON

## Planned Project Structure

```txt
backend/
  app/
    main.py
    models.py
    graph.py
    algorithms/
    services/
  tests/
  requirements.txt

mobile/
  src/
    api/
    components/
    navigation/
    screens/
    state/
    types/
```

## First Backend Target

The first implementation target is:

```txt
backend/
  app/
    main.py
    models.py
    graph.py
    algorithms/
      dijkstra.py
      tsp_branch_bound.py
    services/
      optimizer.py
  tests/
  requirements.txt
```

Required first endpoints:

- `GET /health`
- `POST /api/optimize`

## Local Setup

Backend commands:

```powershell
Set-Location backend
pip install -r requirements.txt
uvicorn app.main:app --reload
python -m pytest .\tests -v -p no:cacheprovider --rootdir .
```

Frontend commands:

```powershell
Set-Location mobile
npm install
npx expo start
```

## Team Workflow

- Keep `main` stable.
- Work in feature branches.
- Use small commits tied to phases/sub-phases in `IMPLEMENTATION_PLAN.md`.
- Do not add Firebase, traffic, history, or navigation handoff until MVP is stable.
- Do not use Google Routes or other third-party route optimizers for the MVP optimization logic.
