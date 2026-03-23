import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv

async def check():
    load_dotenv('backend/.env')
    mongo_url = os.environ.get("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url)
    db = client["main_site_db"]
    student = await db.students.find_one({"image_url": {"$ne": None}})
    if student:
        print(f"ID: {student['id']}")
        print(f"Image prefix: {student['image_url'][:50]}")
    else:
        print("No image found")

asyncio.run(check())
