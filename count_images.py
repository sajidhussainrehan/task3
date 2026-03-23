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
    
    count = await db.students.count_documents({"image_url": {"$ne": None}})
    print(f"Students with images: {count}")

if __name__ == "__main__":
    asyncio.run(main())
