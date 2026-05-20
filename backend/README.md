# RouteLite Backend

FastAPI backend for RouteLite route optimization.

## Setup

```powershell
python -m pip install -r requirements.txt
```

## Run API

```powershell
uvicorn app.main:app --reload
```

Health check:

```txt
http://127.0.0.1:8000/health
```

## Test

```powershell
python -m pytest .\tests -v -p no:cacheprovider --rootdir .
```
