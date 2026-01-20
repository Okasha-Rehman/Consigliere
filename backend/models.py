from sqlalchemy import Column, Integer, String, DateTime, Date, Boolean, ForeignKey, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    profile_picture = Column(String, nullable=True)  # Filename of uploaded image
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    pages_goal = Column(Integer, default=10, nullable=False)
    videos_goal = Column(Integer, default=1, nullable=False)
    
    # Relationships
    check_ins = relationship("CheckIn", back_populates="user", cascade="all, delete-orphan")
    streaks = relationship("Streak", back_populates="user", cascade="all, delete-orphan")


class CheckIn(Base):
    __tablename__ = "check_ins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    check_in_date = Column(Date, nullable=False, index=True)
    pages_read = Column(Integer, nullable=False)
    videos_watched = Column(Integer, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="check_ins")


class Streak(Base):
    __tablename__ = "streaks"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    current_streak = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    last_check_in_date = Column(Date, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User", back_populates="streaks")


class DailyQuote(Base):
    __tablename__ = "daily_quotes"
    
    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, unique=True, nullable=False, index=True)
    quote_text = Column(Text, nullable=False)
    author = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
