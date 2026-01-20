from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from models import User, CheckIn, Streak, DailyQuote
from datetime import date, datetime, timedelta
from typing import Optional, List
import httpx
from config import settings
from auth import get_password_hash


class UserService:
    @staticmethod
    def create_user(email: str, username: str, password: str, db: Session) -> User:
        """Create new user with hashed password"""
        # Check if email exists
        if db.query(User).filter(User.email == email).first():
            raise ValueError("Email already registered")
        
        # Check if username exists
        if db.query(User).filter(User.username == username).first():
            raise ValueError("Username already taken")
        
        # Create user
        user = User(
            email=email,
            username=username,
            hashed_password=get_password_hash(password)
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create initial streak record
        streak = Streak(user_id=user.id)
        db.add(streak)
        db.commit()
        
        return user
    
    @staticmethod
    def update_profile_picture(user: User, filename: str, db: Session):
        """Update user's profile picture"""
        user.profile_picture = filename
        db.commit()
        db.refresh(user)
    
    @staticmethod
    def update_goals(user: User, pages_goal: int, videos_goal: int, db: Session):
        """Update user's daily goals"""
        user.pages_goal = pages_goal
        user.videos_goal = videos_goal
        db.commit()
        db.refresh(user)


class CheckInService:
    @staticmethod
    def get_today_check_in(user_id: int, db: Session) -> Optional[CheckIn]:
        """Get today's check-in for user"""
        today = date.today()
        return db.query(CheckIn).filter(
            CheckIn.user_id == user_id,
            CheckIn.check_in_date == today
        ).first()
    
    @staticmethod
    def create_check_in(
        user: User,
        pages_read: int,
        videos_watched: int,
        notes: Optional[str],
        db: Session
    ) -> CheckIn:
        """Create a new check-in (immutable, once per day)"""
        today = date.today()
        
        # Check if already checked in today
        existing = CheckInService.get_today_check_in(user.id, db)
        if existing:
            raise ValueError("Already checked in today")
        
        # Create check-in
        check_in = CheckIn(
            user_id=user.id,
            check_in_date=today,
            pages_read=pages_read,
            videos_watched=videos_watched,
            notes=notes
        )
        db.add(check_in)
        
        # Update streak
        StreakService.update_streak(user.id, today, db)
        
        db.commit()
        db.refresh(check_in)
        return check_in
    
    @staticmethod
    def get_user_check_ins(user_id: int, limit: int, db: Session) -> List[CheckIn]:
        """Get user's recent check-ins"""
        return db.query(CheckIn).filter(
            CheckIn.user_id == user_id
        ).order_by(CheckIn.check_in_date.desc()).limit(limit).all()


class StreakService:
    @staticmethod
    def get_streak(user_id: int, db: Session) -> Streak:
        """Get user's streak"""
        streak = db.query(Streak).filter(Streak.user_id == user_id).first()
        if not streak:
            streak = Streak(user_id=user_id)
            db.add(streak)
            db.commit()
            db.refresh(streak)
        return streak
    
    @staticmethod
    def update_streak(user_id: int, check_in_date: date, db: Session):
        """Update streak based on new check-in"""
        streak = StreakService.get_streak(user_id, db)
        
        if streak.last_check_in_date is None:
            # First check-in
            streak.current_streak = 1
            streak.longest_streak = 1
        else:
            days_diff = (check_in_date - streak.last_check_in_date).days
            
            if days_diff == 1:
                # Consecutive day
                streak.current_streak += 1
                if streak.current_streak > streak.longest_streak:
                    streak.longest_streak = streak.current_streak
            elif days_diff == 0:
                # Same day (shouldn't happen due to check)
                pass
            else:
                # Missed days - reset streak
                streak.current_streak = 1
        
        streak.last_check_in_date = check_in_date
        streak.updated_at = datetime.utcnow()
        db.commit()


class QuoteService:
    @staticmethod
    async def get_daily_quote(db: Session) -> DailyQuote:
        """Get or fetch today's quote"""
        today = date.today()
        
        # Check if we have today's quote
        quote = db.query(DailyQuote).filter(DailyQuote.date == today).first()
        if quote:
            return quote
        
        # Fetch new quote from API
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(settings.quote_api_url)
                response.raise_for_status()
                data = response.json()
                
                # quotable.io returns array
                if isinstance(data, list) and len(data) > 0:
                    quote_data = data[0]
                else:
                    quote_data = data
                
                quote_text = quote_data.get("content") or quote_data.get("quote")
                author = quote_data.get("author")
        except Exception:
            # Fallback quote
            quote_text = "The impediment to action advances action. What stands in the way becomes the way."
            author = "Marcus Aurelius"
        
        # Store in database
        quote = DailyQuote(
            date=today,
            quote_text=quote_text,
            author=author
        )
        db.add(quote)
        db.commit()
        db.refresh(quote)
        
        return quote


class AnalyticsService:
    @staticmethod
    def get_weekly_summary(user: User, db: Session) -> dict:
        """Get weekly summary for current week"""
        today = date.today()
        week_start = today - timedelta(days=today.weekday())  # Monday
        week_end = week_start + timedelta(days=6)  # Sunday
        
        check_ins = db.query(CheckIn).filter(
            CheckIn.user_id == user.id,
            CheckIn.check_in_date >= week_start,
            CheckIn.check_in_date <= week_end
        ).all()
        
        days_checked_in = len(check_ins)
        total_pages = sum(c.pages_read for c in check_ins)
        total_videos = sum(c.videos_watched for c in check_ins)
        
        # Calculate goal success rate
        goal_successes = sum(
            1 for c in check_ins
            if c.pages_read >= user.pages_goal and c.videos_watched >= user.videos_goal
        )
        goal_success_rate = (goal_successes / days_checked_in * 100) if days_checked_in > 0 else 0.0
        
        return {
            "week_start": week_start,
            "week_end": week_end,
            "days_checked_in": days_checked_in,
            "total_pages": total_pages,
            "total_videos": total_videos,
            "goal_success_rate": round(goal_success_rate, 1),
            "pages_goal": user.pages_goal,
            "videos_goal": user.videos_goal
        }
    
    @staticmethod
    def get_monthly_summary(user: User, month: int, year: int, db: Session) -> dict:
        """Get monthly summary for specified month"""
        check_ins = db.query(CheckIn).filter(
            CheckIn.user_id == user.id,
            extract('month', CheckIn.check_in_date) == month,
            extract('year', CheckIn.check_in_date) == year
        ).all()
        
        total_days = len(check_ins)
        total_pages = sum(c.pages_read for c in check_ins)
        total_videos = sum(c.videos_watched for c in check_ins)
        
        avg_pages = (total_pages / total_days) if total_days > 0 else 0.0
        avg_videos = (total_videos / total_days) if total_days > 0 else 0.0
        
        # Calculate best streak for the month
        sorted_check_ins = sorted(check_ins, key=lambda x: x.check_in_date)
        best_streak = 0
        current_streak = 0
        last_date = None
        
        for check_in in sorted_check_ins:
            if last_date is None:
                current_streak = 1
            else:
                days_diff = (check_in.check_in_date - last_date).days
                if days_diff == 1:
                    current_streak += 1
                else:
                    current_streak = 1
            
            best_streak = max(best_streak, current_streak)
            last_date = check_in.check_in_date
        
        return {
            "month": month,
            "year": year,
            "total_learning_days": total_days,
            "average_pages_per_day": round(avg_pages, 1),
            "average_videos_per_day": round(avg_videos, 1),
            "best_streak": best_streak,
            "pages_goal": user.pages_goal,
            "videos_goal": user.videos_goal
        }
