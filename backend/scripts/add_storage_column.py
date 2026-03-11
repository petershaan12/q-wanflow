import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal
from sqlalchemy import text

def add_storage_column():
    db = SessionLocal()
    try:
        # Check if column exists
        result = db.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name = 'storage_used'
        """)).fetchone()
        
        if result:
            print("Column 'storage_used' already exists in users table")
        else:
            db.execute(text("ALTER TABLE users ADD COLUMN storage_used INTEGER DEFAULT 0"))
            db.commit()
            print("Successfully added storage_used column to users table")
    except Exception as e:
        print("Error:", str(e))
    finally:
        db.close()

if __name__ == '__main__':
    add_storage_column()
