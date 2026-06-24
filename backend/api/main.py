from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import deals

app = FastAPI(
    title="M&A Deal Rater API",
    description="Explainable ML scoring engine for M&A deal success probability.",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(deals.router, prefix="/deals", tags=["deals"])

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the M&A Deal Rater API",
        "status": "healthy"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api.main:app", host="0.0.0.0", port=8000, reload=True)
