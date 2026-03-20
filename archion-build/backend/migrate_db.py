import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("No DATABASE_URL found in .env")
    exit(1)

print(f"Connecting to database...")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    print("Adding floorplan_data and share_id columns to projects table if they don't exist...")
    # Using IF NOT EXISTS is safe for PostgreSQL
    conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS floorplan_data JSON;"))
    conn.execute(text("ALTER TABLE projects ADD COLUMN IF NOT EXISTS share_id VARCHAR(64);"))
    conn.commit()
    print("Migration applied successfully!")
