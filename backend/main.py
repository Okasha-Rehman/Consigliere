from fastapi import FastAPI, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, Response
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import date, datetime
import os
import uuid
from pathlib import Path
from PIL import Image
import logging
import json
from typing import Any, Dict
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST


# Prometheus metrics
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status_code']
)

REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

DAILY_CHECKINS = Counter(
    'consigliere_daily_checkins_total',
    'Total number of daily check-ins recorded',
)

ACTIVE_CONNECTIONS = Gauge(
    'active_connections',
    'Number of active connections'
)

DAILY_CHECKINS = Counter(
    'daily_checkins_total',
    'Total number of daily check-ins'
)

ERROR_COUNT = Counter(
    'errors_total',
    'Total number of errors',
    ['type', 'endpoint']
)


# Configure structured logging
class StructuredFormatter(logging.Formatter):
    def format(self, record: logging.LogRecord) -> str:
        log_entry: Dict[str, Any] = {
            "timestamp": self.formatTime(record),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }

        if hasattr(record, 'request_id'):
            log_entry["request_id"] = record.request_id

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)

        return json.dumps(log_entry)


def setup_logging():
    """Configure structured JSON logging"""
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, settings.log_level.upper(), logging.INFO))

    # Remove existing handlers
    for handler in logger.handlers[:]:
        logger.removeHandler(handler)

    # Create console handler with structured formatter
    handler = logging.StreamHandler()
    handler.setFormatter(StructuredFormatter())
    logger.addHandler(handler)

    # Set specific loggers
    logging.getLogger("uvicorn").setLevel(logging.WARNING)
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)  # We'll handle access logs ourselves


# Custom middleware for request logging and error handling
class RequestLoggingMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        # Generate request ID
        request_id = str(uuid.uuid4())[:8]

        # Log request
        logger = logging.getLogger("request")
        logger.info(
            f"Incoming {scope['method']} {scope['path']}",
            extra={"extra_fields": {"method": scope["method"], "path": scope["path"]}, "request_id": request_id}
        )

        # Store request_id in scope for later use
        scope["request_id"] = request_id

        # Track start time
        start_time = datetime.utcnow()

        # Custom send function to log response
        original_send = send

        async def logging_send(message):
            if message["type"] == "http.response.start":
                status_code = message["status"]
                duration = (datetime.utcnow() - start_time).total_seconds()

                # Record metrics
                REQUEST_COUNT.labels(
                    method=scope["method"],
                    endpoint=scope["path"],
                    status_code=str(status_code)
                ).inc()

                REQUEST_LATENCY.labels(
                    method=scope["method"],
                    endpoint=scope["path"]
                ).observe(duration)

                # Record errors
                if status_code >= 400:
                    ERROR_COUNT.labels(
                        type="http_error",
                        endpoint=scope["path"]
                    ).inc()

                logger.info(
                    f"Response {status_code} in {duration:.2f}s",
                    extra={"extra_fields": {"status_code": status_code, "duration": duration}, "request_id": request_id}
                )

            await original_send(message)

        await self.app(scope, receive, logging_send)

from database import get_db, init_db
from models import User
from schemas import (
    UserRegister, UserLogin, TokenResponse, UserProfile, UserGoalsUpdate,
    CheckInCreate, CheckInResponse, StreakResponse, QuoteResponse,
    WeeklySummary, MonthlySummary, DashboardResponse
)
from auth import create_access_token, get_current_user, authenticate_user
from services import UserService, CheckInService, StreakService, QuoteService, AnalyticsService
from config import settings

# Create FastAPI app
app = FastAPI(
    title="Consigliere API",
    description="Daily learning tracker with discipline and consistency",
    version="1.0.0"
)

# Setup logging
setup_logging()

# Add custom middleware
app.add_middleware(RequestLoggingMiddleware)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger = logging.getLogger("error")
    logger.error(
        f"Unhandled exception: {str(exc)}",
        exc_info=True,
        extra={"extra_fields": {"path": str(request.url), "method": request.method}, "request_id": getattr(request.state, 'request_id', 'unknown')}
    )

    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": getattr(request.state, 'request_id', 'unknown')},
    )

# Create upload directory
UPLOAD_DIR = Path(settings.upload_dir)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Mount uploads directory for serving images
app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup event
@app.on_event("startup")
async def startup_event():
    init_db()


# Health check endpoints
@app.get("/health")
async def health_check():
    """Liveness probe - checks if the app is running"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.get("/ready")
async def readiness_check(db: Session = Depends(get_db)):
    """Readiness probe - checks if the app is ready to serve traffic"""
    try:
        # Check database connection
        result = db.execute(text("SELECT 1"))
        result.fetchone()
        return {"status": "ready", "timestamp": datetime.utcnow().isoformat()}
    except Exception as e:
        error_logger = logging.getLogger("error")
        error_logger.error(f"Readiness check failed: {str(e)}")
        raise HTTPException(status_code=503, detail="Database not ready")


@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


# ============= AUTH ENDPOINTS =============

@app.post("/api/auth/register", response_model=UserProfile, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user"""
    try:
        user = UserService.create_user(
            email=user_data.email,
            username=user_data.username,
            password=user_data.password,
            db=db
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@app.post("/api/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin, db: Session = Depends(get_db)):
    """Login with email and password"""
    user = authenticate_user(credentials.email, credentials.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create access token with user email
    access_token = create_access_token(data={"sub": user.email})
    return TokenResponse(access_token=access_token)


# ============= USER ENDPOINTS =============

@app.get("/api/user/profile", response_model=UserProfile)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Get current user profile"""
    return current_user


@app.post("/api/user/profile-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Upload profile picture"""
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read file
    contents = await file.read()
    
    # Validate file size
    if len(contents) > settings.max_upload_size:
        raise HTTPException(status_code=400, detail="File too large (max 5MB)")
    
    # Generate unique filename
    ext = file.filename.split('.')[-1] if '.' in file.filename else 'jpg'
    filename = f"{uuid.uuid4()}.{ext}"
    filepath = UPLOAD_DIR / filename
    
    # Process and save image
    try:
        image = Image.open(file.file)
        # Resize to max 500x500 while maintaining aspect ratio
        image.thumbnail((500, 500), Image.Resampling.LANCZOS)
        image.save(filepath, optimize=True, quality=85)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid image file")
    
    # Delete old profile picture if exists
    if current_user.profile_picture:
        old_path = UPLOAD_DIR / current_user.profile_picture
        if old_path.exists():
            old_path.unlink()
    
    # Update user
    UserService.update_profile_picture(current_user, filename, db)
    
    return {"filename": filename, "url": f"/uploads/{filename}"}


@app.put("/api/user/goals", response_model=UserProfile)
async def update_goals(
    goals: UserGoalsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's daily goals"""
    UserService.update_goals(current_user, goals.pages_goal, goals.videos_goal, db)
    return current_user


# ============= CHECK-IN ENDPOINTS =============

@app.post("/api/check-in", response_model=CheckInResponse, status_code=status.HTTP_201_CREATED)
async def create_check_in(
    check_in_data: CheckInCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create today's check-in (once per day, immutable)"""
    try:
        check_in = CheckInService.create_check_in(
            user=current_user,
            pages_read=check_in_data.pages_read,
            videos_watched=check_in_data.videos_watched,
            notes=check_in_data.notes,
            db=db
        )
        # Record daily check-in metric
        DAILY_CHECKINS.inc()
        return check_in
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@app.get("/api/check-in/today", response_model=CheckInResponse)
async def get_today_check_in(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get today's check-in"""
    check_in = CheckInService.get_today_check_in(current_user.id, db)
    if not check_in:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No check-in for today"
        )
    return check_in


@app.get("/api/check-in/history", response_model=list[CheckInResponse])
async def get_check_in_history(
    limit: int = 30,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get check-in history"""
    check_ins = CheckInService.get_user_check_ins(current_user.id, limit, db)
    return check_ins


# ============= STREAK ENDPOINTS =============

@app.get("/api/streak", response_model=StreakResponse)
async def get_streak(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current streak"""
    streak = StreakService.get_streak(current_user.id, db)
    
    # Check if streak should be reset
    if streak.last_check_in_date:
        days_since_last = (date.today() - streak.last_check_in_date).days
        if days_since_last > 1:
            # Streak broken
            streak.current_streak = 0
            db.commit()
    
    return streak


# ============= QUOTE ENDPOINTS =============

@app.get("/api/quote/today", response_model=QuoteResponse)
async def get_daily_quote(db: Session = Depends(get_db)):
    """Get today's quote (same for all users)"""
    quote = await QuoteService.get_daily_quote(db)
    return quote


# ============= ANALYTICS ENDPOINTS =============

@app.get("/api/analytics/weekly", response_model=WeeklySummary)
async def get_weekly_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get weekly summary"""
    return AnalyticsService.get_weekly_summary(current_user, db)


@app.get("/api/analytics/monthly", response_model=MonthlySummary)
async def get_monthly_summary(
    month: int = None,
    year: int = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get monthly summary"""
    if month is None or year is None:
        today = date.today()
        month = today.month
        year = today.year
    
    return AnalyticsService.get_monthly_summary(current_user, month, year, db)


# ============= DASHBOARD ENDPOINT =============

@app.get("/api/dashboard", response_model=DashboardResponse)
async def get_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard data (quote, streak, today's check-in status)"""
    # Get today's check-in
    today_check_in = CheckInService.get_today_check_in(current_user.id, db)
    has_checked_in = today_check_in is not None
    
    # Get streak
    streak = StreakService.get_streak(current_user.id, db)
    
    # Check if streak should be reset
    if streak.last_check_in_date:
        days_since_last = (date.today() - streak.last_check_in_date).days
        if days_since_last > 1:
            streak.current_streak = 0
            db.commit()
    
    # Get daily quote
    quote_obj = await QuoteService.get_daily_quote(db)
    quote = QuoteResponse(
        quote_text=quote_obj.quote_text,
        author=quote_obj.author,
        date=quote_obj.date
    )
    
    return DashboardResponse(
        has_checked_in_today=has_checked_in,
        today_check_in=today_check_in,
        streak=streak,
        daily_quote=quote
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
