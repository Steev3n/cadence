from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth import CurrentUserId

app = FastAPI(title="cadence")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/me")
def get_me(user_id: CurrentUserId):
    return {"user_id": str(user_id)}