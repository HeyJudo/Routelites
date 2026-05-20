# Contributing to RouteLite

This project is built in phases. Before taking a task, read `IMPLEMENTATION_PLAN.md` and choose a specific phase/sub-phase.

## Branch Naming

Use short descriptive branch names:

```txt
backend/phase-1-dijkstra
backend/phase-1-tsp
mobile/phase-2-map
mobile/phase-3-integration
docs/defense-script
```

## Commit Style

Use concise commits:

```txt
feat: add backend health endpoint
feat: implement dijkstra on demo graph
test: cover naive route distance
docs: update defense exactness wording
fix: handle unreachable graph node
```

## Pull Request Checklist

Before asking for review:

- [ ] The change maps to a phase/sub-phase in `IMPLEMENTATION_PLAN.md`.
- [ ] Tests were added or updated for backend logic.
- [ ] The app/backend still starts locally if touched.
- [ ] Exact mode and clustered mode wording remains honest.
- [ ] No Post-MVP feature was added to MVP without group agreement.
- [ ] No third-party optimizer replaced custom Dijkstra or custom Branch and Bound.

## MVP Boundaries

Do not add these until MVP is stable:

- Firebase Auth.
- Route history.
- Saved stops.
- Real-time traffic.
- Google Maps/Waze navigation handoff.
- Route sharing.

## Algorithm Rules

- Dijkstra must be a custom implementation.
- Branch and Bound TSP must be a custom implementation.
- The naive route is the user's input order.
- Exact global optimality can only be claimed for full-set Branch and Bound.
- Clustered/large-route mode must be labeled approximate.

