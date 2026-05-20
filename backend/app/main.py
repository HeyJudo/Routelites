from fastapi import FastAPI

app = FastAPI(title="RouteLite API")


@app.get("/health")
def health_check() -> dict[str, bool | str]:
    return {
        "status": "ok",
        "graph_loaded": True,
        "graph_mode": "demo",
    }
