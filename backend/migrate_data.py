"""
Migration script: Copy all data from 'clubbariaa' database to 'clubbariaa_task3'
Run this once to populate the new separate database for task3.
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

MONGO_URL = os.environ.get("MONGO_URL")

# Source (old shared database) and destination (new separate database)
SOURCE_DB = "clubbariaa"
DEST_DB = "clubbariaa_task3"

# Collections to copy
COLLECTIONS = [
    "students",
    "groups",
    "tasks",
    "challenges",
    "matches",
    "league_star",
    "points_log",
    "viewer_links",
    "ramadan_quiz",
    "ramadan_answers",
    "halaqa_grades",
    "attendance_sessions",
    "attendance_records",
]

async def migrate():
    client = AsyncIOMotorClient(MONGO_URL)
    source = client[SOURCE_DB]
    dest = client[DEST_DB]

    for coll_name in COLLECTIONS:
        docs = await source[coll_name].find({}).to_list(None)
        if docs:
            # Remove MongoDB _id to avoid duplicates if run multiple times
            for doc in docs:
                doc.pop("_id", None)
            
            # Clear destination collection first (safe to re-run)
            await dest[coll_name].delete_many({})
            await dest[coll_name].insert_many(docs)
            print(f"✅ Copied {len(docs)} documents from '{coll_name}'")
        else:
            print(f"⏭️  Skipped '{coll_name}' (empty)")

    print("\n🎉 Migration complete! All data copied to 'clubbariaa_task3'")
    client.close()

if __name__ == "__main__":
    asyncio.run(migrate())
