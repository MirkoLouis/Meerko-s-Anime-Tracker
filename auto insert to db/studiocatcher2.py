import aiohttp
import asyncio
import tqdm
from collections import defaultdict

# GLOBAL CONFIGURATION
# Updated to the "Top Anime" endpoint
BASE_URL = "https://api.jikan.moe/v4/top/anime"
MAX_CONCURRENT_REQUESTS = 3

async def fetch_page(session, page, semaphore):
    async with semaphore: 
        # We pass parameters as a dictionary now.
        # 'sfw': 'true' asks the server to filter out Hentai before sending data.
        params = {'page': page, 'sfw': 'true'}
        
        try:
            async with session.get(BASE_URL, params=params) as response:
                if response.status == 429:
                    print(f"⚠️ Rate limit hit on page {page}. Cooling down...")
                    await asyncio.sleep(2)
                    return await fetch_page(session, page, semaphore)
                
                if response.status != 200:
                    print(f"❌ Failed to fetch page {page}: {response.status}")
                    return []

                payload = await response.json()
                await asyncio.sleep(0.5) 
                return payload.get('data', [])
                
        except Exception as e:
            print(f"⚠️ Error on page {page}: {e}")
            return []

async def get_pagination_limit():
    """
    Fetches Page 1 to see how many total pages of 'Top Anime' exist.
    """
    async with aiohttp.ClientSession() as session:
        # We must include sfw=true here too, or the page count might be different
        # (e.g. including hentai pages)
        params = {'page': 1, 'sfw': 'true'}
        async with session.get(BASE_URL, params=params) as response:
            if response.status == 200:
                data = await response.json()
                return data['pagination']['last_visible_page']
            return 1

async def main():
    print("🔍 Checking total pages for Top Anime (SFW)...")
    total_pages = await get_pagination_limit()
    print(f"📄 Found {total_pages} pages. Starting parallel fetch...")

    studio_count = defaultdict(int)
    skipped_studios = defaultdict(list)
    
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)

    async with aiohttp.ClientSession() as session:
        tasks = []
        for page in range(1, total_pages + 1):
            tasks.append(fetch_page(session, page, semaphore))

        results = []
        for f in tqdm.tqdm(asyncio.as_completed(tasks), total=len(tasks), desc="🚀 Downloading", unit="page"):
            page_data = await f
            results.extend(page_data)

    print("📥 Processing data...")

    for anime in results:
        title = anime.get('title')
        # Safely get list fields (some might be None in rare cases)
        genres = [g['name'].lower() for g in anime.get('genres', [])]
        explicit_genres = [g['name'].lower() for g in anime.get('explicit_genres', [])]
        themes = [g['name'].lower() for g in anime.get('themes', [])]
        demographics = [g['name'].lower() for g in anime.get('demographics', [])]

        all_tags = genres + explicit_genres + themes + demographics

        # Note: Since we used ?sfw=true, this check should theoretically find nothing.
        # But we keep it as a backup "sanity check".
        if 'hentai' in all_tags:
            for studio in anime.get('studios', []):
                name = studio.get('name')
                if name:
                    skipped_studios[name].append(title)
            continue

        for studio in anime.get('studios', []):
            name = studio.get('name')
            if name:
                studio_count[name] += 1

    print("💾 Writing SQL insert statements...")
    with open("insert_studios.sql", "w", encoding="utf-8") as sql_file:
        sql_file.write("INSERT INTO Studio (studio_name, rating) VALUES\n")
        values = []
        
        def calculate_rating(freq):
            if freq >= 10: return 5
            elif freq >= 6: return 4
            elif freq >= 3: return 3
            elif freq >= 1: return 2
            return 1
            
        for studio_name in sorted(studio_count.keys()):
            rating = calculate_rating(studio_count[studio_name])
            name = studio_name.replace("'", "''")
            values.append(f"('{name}', {rating})")
        
        if values:
            sql_file.write(",\n".join(values) + ";\n")

    print("✅ All done!")

if __name__ == "__main__":
    asyncio.run(main())