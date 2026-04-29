import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import ResponseValidationError
import uvicorn
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from core.limiter import limiter

from api.upload import router as upload_router
from api.upload_api import router as upload_api_router
from api.analysis import router as analysis_router

logger = logging.getLogger("aether")

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Aether Intelligence Engine starting...")
    yield
    print("Aether shutting down.")

app = FastAPI(title="Aether V1 MVP", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

from starlette.exceptions import HTTPException as StarletteHTTPException

@app.exception_handler(ResponseValidationError)
async def validation_exception_handler(request: Request, exc: ResponseValidationError):
    logger.error(f"Response validation error: {exc.errors()}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": f"Schema validation failed: {exc.errors()}"},
        headers={"Access-Control-Allow-Origin": "*"}
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers={"Access-Control-Allow-Origin": "*"}
    )

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Analysis failed. Please try again."},
        headers={"Access-Control-Allow-Origin": "*"}
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(upload_api_router)
app.include_router(analysis_router)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)