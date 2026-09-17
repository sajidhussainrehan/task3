"""
One-time backfill: recompresses every base64 image already stored in the
`students` collection (image_url) and `teams` collection (group_photo)
using the same resize/quality settings as the fixed upload endpoints.

Why this is needed: uploads used to store raw bytes as base64 with no
resizing or compression, sometimes several MB per photo. Every full
"/students" list response embeds every student's photo inline, which is
why that endpoint could balloon to ~150MB (see the /students/light
endpoint added to work around it). The endpoint code fix only helps *new*
uploads - this script fixes images that are already sitting in the
database today.

Run this ON THE SERVER from the backend directory with the venv active
(after `pip install -r requirements.txt` so Pillow is installed):
    cd /home/ghiras/task3/backend
    source venv/bin/activate
    pip install -r requirements.txt
    python compress_existing_images.py

Safe to re-run: images already small/compressed are skipped.
"""
import asyncio
import base64
import io
import os
from pathlib import Path

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient
from PIL import Image

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MAX_IMAGE_DIMENSION = 800
JPEG_QUALITY = 78
SKIP_IF_UNDER_BYTES = 150_000  # already small enough, don't bother touching it


def compress_data_uri(data_uri: str):
    """Returns (new_data_uri, before_bytes, after_bytes), or None if skipped."""
    if not data_uri or not data_uri.startswith("data:"):
        return None
    try:
        header, b64data = data_uri.split(",", 1)
    except ValueError:
        return None

    raw = base64.b64decode(b64data)
    if len(raw) < SKIP_IF_UNDER_BYTES:
        return None

    try:
        img = Image.open(io.BytesIO(raw))
        img = img.convert("RGB")
        img.thumbnail((MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION), Image.LANCZOS)
        buffer = io.BytesIO()
        img.save(buffer, format="JPEG", quality=JPEG_QUALITY, optimize=True)
        new_bytes = buffer.getvalue()
    except Exception as e:
        print(f"    skip (couldn't decode as image: {e})")
        return None

    if len(new_bytes) >= len(raw):
        return None  # not actually smaller, leave it alone

    new_b64 = base64.b64encode(new_bytes).decode()
    return f"data:image/jpeg;base64,{new_b64}", len(raw), len(new_bytes)


async def process_collection(db, collection_name: str, field: str, id_field: str, label_field: str):
    collection = db[collection_name]
    docs = await collection.find(
        {field: {"$regex": "^data:"}}, {"_id": 0, id_field: 1, field: 1, label_field: 1}
    ).to_list(10000)

    if not docs:
        print(f"\n=== {collection_name}.{field}: nothing to do ===")
        return

    print(f"\n=== {collection_name}.{field}: {len(docs)} document(s) with an inline image ===")
    total_before = 0
    total_after = 0
    changed = 0

    for doc in docs:
        label = doc.get(label_field, doc.get(id_field))
        result = compress_data_uri(doc[field])
        if result is None:
            continue
        new_uri, before, after = result
        await collection.update_one({id_field: doc[id_field]}, {"$set": {field: new_uri}})
        total_before += before
        total_after += after
        changed += 1
        print(f"  {label}: {before/1024:.0f} KB -> {after/1024:.0f} KB")

    print(f"  -- {changed}/{len(docs)} recompressed. "
          f"Total: {total_before/1024/1024:.2f} MB -> {total_after/1024/1024:.2f} MB")


async def main():
    client = AsyncIOMotorClient(os.environ["MONGO_URL"])
    db = client[os.environ["DB_NAME"]]

    await process_collection(db, "students", "image_url", "id", "name")
    await process_collection(db, "teams", "group_photo", "name", "name")

    client.close()


if __name__ == "__main__":
    asyncio.run(main())
