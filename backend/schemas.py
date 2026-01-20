from pydantic import BaseModel, EmailStr, Field, field_validator
from datetime import date, datetime
from typing import Optional
import re


# Auth schemas
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=6, max_length=100)
    
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v):
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username must be alphanumeric with underscores only')
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


# User schemas
class UserProfile(BaseModel):
    id: int
    email: str
    username: str
    profile_picture: Optional[str]
    pages_goal: int
    videos_goal: int
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserGoalsUpdate(BaseModel):
    pages_goal: int = Field(ge=0, le=1000)
    videos_goal: int = Field(ge=0, le=100)


# Check-in schemas
class CheckInCreate(BaseModel):
    pages_read: int = Field(ge=0, description="Number of pages read")
    videos_watched: int = Field(ge=0, description="Number of videos watched")
    notes: Optional[str] = Field(None, max_length=5000)


class CheckInResponse(BaseModel):
    id: int
    check_in_date: date
    pages_read: int
    videos_watched: int
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True


# Streak schemas
class StreakResponse(BaseModel):
    current_streak: int
    longest_streak: int
    last_check_in_date: Optional[date]
    
    class Config:
        from_attributes = True


# Quote schemas
class QuoteResponse(BaseModel):
    quote_text: str
    author: Optional[str]
    date: date


# Analytics schemas
class WeeklySummary(BaseModel):
    week_start: date
    week_end: date
    days_checked_in: int
    total_pages: int
    total_videos: int
    goal_success_rate: float
    pages_goal: int
    videos_goal: int


class MonthlySummary(BaseModel):
    month: int
    year: int
    total_learning_days: int
    average_pages_per_day: float
    average_videos_per_day: float
    best_streak: int
    pages_goal: int
    videos_goal: int


# Dashboard schema
class DashboardResponse(BaseModel):
    has_checked_in_today: bool
    today_check_in: Optional[CheckInResponse]
    streak: StreakResponse
    daily_quote: QuoteResponse
