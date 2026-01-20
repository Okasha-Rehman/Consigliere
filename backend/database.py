from sqlalchemy import create_engine, Index
from sqlalchemy.orm import sessionmaker, Session
from config import settings
from models import Base, CheckIn, DailyQuote

# Create engine
engine = create_engine(settings.database_url, pool_pre_ping=True)

# Create unique index for check_ins
Index('idx_user_check_in_date', CheckIn.user_id, CheckIn.check_in_date, unique=True)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
