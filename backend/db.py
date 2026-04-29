# backend/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

# SQLite — file lives at backend/aether.db
# To swap to MySQL later, replace this one line with:
# mysql+pymysql://user:password@localhost:3306/aether_db
# Use /tmp for SQLite on Vercel, otherwise use local file
import os
if os.environ.get("VERCEL"):
    DATABASE_URL = "sqlite:////tmp/aether.db"
else:
    DATABASE_URL = "sqlite:///./aether.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # required for SQLite only
    echo=False
)

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()