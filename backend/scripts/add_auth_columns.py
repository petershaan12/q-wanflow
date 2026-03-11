import os
import sys
from sqlalchemy import create_engine, text

# Add the parent directory to the path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    
    # List of migration queries
    migrations = [
        ("hashed_password", "ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255)"),
        ("is_verified", "ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE"),
        ("otp_code", "ALTER TABLE users ADD COLUMN otp_code VARCHAR(6)"),
        ("otp_expiry", "ALTER TABLE users ADD COLUMN otp_expiry TIMESTAMP WITH TIME ZONE")
    ]
    
    for col, query in migrations:
        with engine.connect() as conn:
            try:
                print(f"Trying to add column: {col}...")
                conn.execute(text(query))
                conn.commit()
                print(f"SUCCESS: Added column {col}")
            except Exception as e:
                if "already exists" in str(e).lower():
                    print(f"INFO: Column {col} already exists, skipping.")
                else:
                    print(f"ERROR adding {col}: {e}")
                conn.rollback()
    
    # Special update for is_verified for Google users
    with engine.connect() as conn:
        try:
            conn.execute(text("UPDATE users SET is_verified = TRUE WHERE google_id IS NOT NULL"))
            conn.commit()
            print("SUCCESS: Updated is_verified for Google users")
        except Exception as e:
            print(f"Error updating is_verified: {e}")
            conn.rollback()

    print("Migration finished!")

if __name__ == "__main__":
    migrate()
