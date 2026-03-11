import os
import sys
from sqlalchemy import create_engine, text

# Add the parent directory to the path so we can import app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def migrate():
    engine = create_engine(settings.DATABASE_URL)
    with engine.connect() as conn:
        print("Adding new columns to 'users' table...")
        
        try:
            # 1. hashed_password
            conn.execute(text("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255)"))
            print("Added column: hashed_password")
        except Exception as e:
            print(f"Skipping hashed_password: {e}")

        try:
            # 2. is_verified
            conn.execute(text("ALTER TABLE users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE"))
            conn.execute(text("UPDATE users SET is_verified = TRUE WHERE google_id IS NOT NULL"))
            print("Added column: is_verified")
        except Exception as e:
            print(f"Skipping is_verified: {e}")

        try:
            # 3. otp_code
            conn.execute(text("ALTER TABLE users ADD COLUMN otp_code VARCHAR(6)"))
            print("Added column: otp_code")
        except Exception as e:
            print(f"Skipping otp_code: {e}")

        try:
            # 4. otp_expiry
            conn.execute(text("ALTER TABLE users ADD COLUMN otp_expiry TIMESTAMP WITH TIME ZONE"))
            print("Added column: otp_expiry")
        except Exception as e:
            print(f"Skipping otp_expiry: {e}")

        conn.commit()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
