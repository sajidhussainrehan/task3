import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

async def main():
    root = Path(__file__).parent
    load_dotenv(root / 'backend' / '.env')
    
    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    students = await db.students.find({}, {"_id": 0, "id": 1, "name": 1, "supervisor": 1}).to_list(100)
    
    print("Total Students:", len(students))
    for s in students:
        print(f"ID: {s['id']} | Name: {s['name']} | Group: {s.get('supervisor', 'None')}")

if __name__ == "__main__":
    asyncio.run(main())
