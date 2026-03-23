import motor.motor_asyncio
import asyncio
import os
from dotenv import load_dotenv
from pathlib import Path

async def main():
    root = Path(__file__).parent
    load_dotenv(root / 'backend' / '.env')
    
    mongo_url = os.environ.get("MONGO_URL")
    
    client = motor.motor_asyncio.AsyncIOMotorClient(mongo_url)
    
    dbs = await client.list_database_names()
    print("Databases in cluster:", dbs)
    
    for db_name in dbs:
        db = client[db_name]
        try:
            colls = await db.list_collection_names()
            if 'students' in colls:
                count = await db.students.count_documents({})
                print(f"DB: {db_name} | Students count: {count}")
        except: pass

if __name__ == "__main__":
    asyncio.run(main())
