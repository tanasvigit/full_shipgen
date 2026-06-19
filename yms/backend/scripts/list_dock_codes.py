import asyncio
import os
from pathlib import Path

import asyncpg
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[1] / ".env")


async def main():
    conn = await asyncpg.connect(os.environ["DATABASE_URL"])
    rows = await conn.fetch("SELECT dock_code FROM docks ORDER BY dock_code")
    for r in rows:
        print(r["dock_code"])
    await conn.close()


asyncio.run(main())
