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
    """Create all tables and run lightweight SQLite migrations for backward compatibility."""
    Base.metadata.create_all(bind=engine)
    try:
        with engine.begin() as migration_conn:
            cursor = migration_conn.connection.cursor()

            # Add user_id column to forms if missing (legacy migration)
            cursor.execute("PRAGMA table_info(forms)")
            columns = [row[1] for row in cursor.fetchall()]
            if "user_id" not in columns and len(columns) > 0:
                cursor.execute("ALTER TABLE forms ADD COLUMN user_id INTEGER REFERENCES users(id)")

            # Ensure logic_rules table exists (legacy migration for older SQLite DBs)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS logic_rules (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    question_id INTEGER NOT NULL,
                    condition_value VARCHAR NOT NULL,
                    action VARCHAR NOT NULL DEFAULT 'jump',
                    destination_question_id INTEGER,
                    FOREIGN KEY(question_id) REFERENCES questions(id) ON DELETE CASCADE,
                    FOREIGN KEY(destination_question_id) REFERENCES questions(id) ON DELETE CASCADE
                )
            """)
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_logic_rules_question_id ON logic_rules (question_id)")
            cursor.execute("CREATE INDEX IF NOT EXISTS ix_logic_rules_id ON logic_rules (id)")
    except Exception as e:
        # Non-fatal: tables may already be up-to-date
        print(f"DB migration note: {e}")


init_db()

def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

