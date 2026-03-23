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
    
    student = await db.students.find_one({"image_url": {"$ne": None}}, {"id": 1, "name": 1, "image_url": 1})
    if student:
        print(f"ID: {student['id']}")
        print(f"Image length: {len(student['image_url'])}")
    else:
        print("No student found with image.")

if __name__ == "__main__":
    asyncio.run(main())
