"""
app/core/database.py
─────────────────────
SQLAlchemy engine + session factory.
Import `get_db` as a FastAPI dependency in your routes.
"""
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# PostgreSQL engine
engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,        # logs SQL when DEBUG=True
    pool_pre_ping=True,         # verify connection health
    pool_size=10,               # max connections in pool
    max_overflow=20             # extra connections beyond pool_size
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    """FastAPI dependency that yields a DB session and always closes it."""
    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
