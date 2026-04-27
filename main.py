from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from database import engine, Base
from routers import auth as auth_router
from routers import user as user_router

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Testing API - POC",
    description="A testable CRUD API system with JWT authentication and a simple UI.",
    version="1.0.0",
)

# ---------- Routers ----------

app.include_router(auth_router.router)
app.include_router(user_router.router)

# ---------- Static Files ----------

app.mount("/static", StaticFiles(directory="static"), name="static")


# ---------- Root / Frontend ----------

@app.get("/", include_in_schema=False)
def serve_frontend():
    """Serve the frontend HTML page."""
    return FileResponse("static/index.html")
