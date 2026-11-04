from fastapi import FastAPI

app = FastAPI(title="cadence")

@app.get("/health")
def health():
    return {"status": "ok"}
