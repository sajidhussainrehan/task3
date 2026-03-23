import os
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
from dotenv import load_dotenv

async def fix():
    load_dotenv('backend/.env')
    mongo_url = os.environ.get("MONGO_URL")
    client = AsyncIOMotorClient(mongo_url)
    db = client["main_site_db"]
    students = await db.students.find({"image_url": {"$regex": "^data:image/image/"}}).to_list(100)
    for s in students:
        new_url = s["image_url"].replace("data:image/image/", "data:image/")
        await db.students.update_one({"_id": s["_id"]}, {"$set": {"image_url": new_url}})
        print(f"Fixed image for ID: {s['id']}")
    
    # Also check other website DB if it exists
    # For now, let's just do main_site_db as we found the issue there.

asyncio.run(fix())
