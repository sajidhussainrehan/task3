import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path
import json

async def main():
    root = Path(__file__).parent
    load_dotenv(root / 'backend' / '.env')
    
    mongo_url = os.environ.get("MONGO_URL")
    db_name = "main_site_db"
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    students = await db.students.find({}, {"_id": 0, "id": 1, "name": 1, "supervisor": 1}).to_list(100)
    
    with open('students_list.json', 'w', encoding='utf-8') as f:
        json.dump(students, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    asyncio.run(main())
