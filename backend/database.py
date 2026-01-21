from sqlalchemy import create_engine, Index, text
from sqlalchemy.orm import sessionmaker, Session
from config import settings
from models import Base, CheckIn, DailyQuote
import time
import logging

logger = logging.getLogger(__name__)

def create_db_engine():
    """Create database engine with retry logic"""
    max_retries = 5
    retry_delay = 2
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Attempting to connect to database (attempt {attempt + 1}/{max_retries})")
            engine = create_engine(
                settings.database_url,
                pool_pre_ping=True,
                pool_size=10,
                max_overflow=20,
                connect_args={'connect_timeout': 10}
            )
            # Test connection with text() wrapper
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            logger.info("✓ Database connection successful")
            return engine
        except Exception as e:
            logger.error(f"✗ Database connection failed: {e}")
            if attempt < max_retries - 1:
                logger.info(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                logger.error("Max retries reached. Unable to connect to database.")
                raise

# Create engine with retry
engine = create_db_engine()

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
