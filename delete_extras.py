import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

async def main():
    root = Path(__file__).parent
    load_dotenv(root / 'backend' / '.env')
    
    mongo_url = os.environ.get("MONGO_URL")
    db_name = "main_site_db"
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    extra_ids = [
        "a6ab52cd-c90a-4e09-87ff-f0e00a9734d9", # sdfasd
        "8222ed27-8154-4ae0-a761-4796c6d7ef0b", # sdfs
        "de660403-0ced-4184-98d2-e48c122115d1", # هه
        "9e9f475d-e619-4de1-9461-0d37562d7376"  # الاسود
    ]
    
    result = await db.students.delete_many({"id": {"$in": extra_ids}})
    print(f"Deleted {result.deleted_count} extra students.")

if __name__ == "__main__":
    asyncio.run(main())
