"""One-time cleanup: shrink images already stored in MongoDB and remove duplicated photo copies.

New uploads are resized automatically by server.py; this script fixes data uploaded before that.

Usage (from the backend folder, with the same .env as the server):
    python shrink_existing_images.py           # dry run - only reports what would change
    python shrink_existing_images.py --apply   # writes the changes

Back up the database first (mongodump), since resized originals cannot be recovered.
"""
import asyncio
import base64
import sys
import time

from server import db, shrink_image, to_data_url

APPLY = "--apply" in sys.argv


def decode(data_url):
    header, b64_data = data_url.split(",", 1)
    return base64.b64decode(b64_data), header.split(":")[1].split(";")[0]


async def shrink_field(collection, field, version_field, max_size, key="id"):
    saved = 0
    count = 0
    cursor = db[collection].find({field: {"$regex": "^data:"}}, {"_id": 0, key: 1, field: 1})
    async for doc in cursor:
        old = doc[field]
        try:
            content, content_type = decode(old)
        except Exception:
            print(f"  skip {collection} {doc.get(key)}: invalid data URL")
            continue
        new_content, new_type = shrink_image(content, content_type, max_size)
        new = to_data_url(new_content, new_type)
        if len(new) >= len(old):
            continue
        count += 1
        saved += len(old) - len(new)
        print(f"  {collection} {doc.get(key)}: {len(old) // 1024} KB -> {len(new) // 1024} KB")
        if APPLY:
            await db[collection].update_one(
                {key: doc[key]}, {"$set": {field: new, version_field: int(time.time())}}
            )
    print(f"{collection}.{field}: {count} images, {saved // (1024 * 1024)} MB smaller")


async def main():
    from server import Image
    if Image is None:
        sys.exit("Pillow is not installed - run: pip install Pillow")
    print("APPLYING CHANGES" if APPLY else "DRY RUN (pass --apply to write)")

    await shrink_field("students", "image_url", "image_version", 400)
    await shrink_field("teams", "group_photo", "photo_version", 1200, key="name")
    await shrink_field("books", "cover_image", "cover_version", 600)

    # Photo copies that are no longer read - the server looks them up from students now
    lineup_copies = await db.teams.count_documents({"lineup.image_url": {"$ne": None}})
    star_copies = await db.league_star.count_documents({"image_url": {"$ne": None}})
    print(f"teams with copied lineup photos: {lineup_copies}, league stars with copied photos: {star_copies}")
    if APPLY:
        async for team in db.teams.find({"lineup.image_url": {"$ne": None}}, {"_id": 1, "lineup": 1}):
            lineup = [{k: v for k, v in p.items() if k != "image_url"} for p in team["lineup"]]
            await db.teams.update_one({"_id": team["_id"]}, {"$set": {"lineup": lineup}})
        await db.league_star.update_many({}, {"$set": {"image_url": None}, "$unset": {"image": ""}})

    print("Done." if APPLY else "Dry run finished - nothing was changed.")


if __name__ == "__main__":
    asyncio.run(main())
