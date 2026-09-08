from pathlib import Path
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker, Session

# Use absolute path to ensure database file is always in the backend directory
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "typeform.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def init_db():
    Base.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        try:
            # Check if user_id column exists in forms table
            result = conn.execute(create_engine(SQLALCHEMY_DATABASE_URL).connect().connection.cursor().execute("PRAGMA table_info(forms)").fetchall)
        except Exception:
            pass
        try:
            with engine.begin() as migration_conn:
                cursor = migration_conn.connection.cursor()
                cursor.execute("PRAGMA table_info(forms)")
                columns = [row[1] for row in cursor.fetchall()]
                if "user_id" not in columns and len(columns) > 0:
                    cursor.execute("ALTER TABLE forms ADD COLUMN user_id INTEGER REFERENCES users(id)")
        except Exception as e:
            pass

init_db()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

