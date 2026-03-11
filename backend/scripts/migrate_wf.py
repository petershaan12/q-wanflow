import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal
from sqlalchemy import text

def add_col():
    db = SessionLocal()
    try:
        db.execute(text("ALTER TABLE workflows ADD COLUMN share_permission VARCHAR DEFAULT 'private'"))
        db.commit()
        print("Successfully added share_permission column to workflows table")
    except Exception as e:
        print("Failed or column might already exist:", str(e))
    finally:
        db.close()

if __name__ == '__main__':
    add_col()
