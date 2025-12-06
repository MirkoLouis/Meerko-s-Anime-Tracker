import aiohttp
import asyncio
import tqdm
import os
from collections import defaultdict

# GLOBAL CONFIGURATION
MAX_CONCURRENT_REQUESTS = 3
BASE_URL = "https://api.jikan.moe/v4/top/anime"

# --- HELPER FUNCTIONS ---

def load_map_from_text(file_path, variable_name):
    """
    Reads a text file containing Python code (e.g., "studio_map = {...}")
    and extracts the dictionary.
    """
    if not os.path.exists(file_path):
        return None
    
    print(f"📂 Loading map from {file_path}...")
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Create a temporary local scope to execute the file content
        local_scope = {}
        exec(content, {}, local_scope)
        
        # Retrieve the specific dictionary variable
        return local_scope.get(variable_name)
    except Exception as e:
        print(f"⚠️ Error loading {file_path}: {e}")
        return None

def parse_studio_sql_fallback(file_path):
    """Fallback: Parse SQL if TXT map is missing."""
    studio_map = {}
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        values_str = ''.join(lines[1:])
        entries = values_str.split('),')
        index = 1
        for entry in entries:
            entry = entry.strip().lstrip('(').rstrip(',\n );')
            if entry:
                try:
                    name, _ = entry.split(',', 1)
                    studio_name = name.strip().strip("'").strip() 
                    # Handle the SQL escape fix (Brain''s Base -> Brain's Base)
                    studio_name = studio_name.replace("''", "'") 
                    studio_map[studio_name] = index
                    index += 1
                except ValueError:
                    continue
        return studio_map
    except FileNotFoundError:
        return None

def generate_tag_map_fallback(sql_file):
    """Fallback: Parse SQL if TXT map is missing."""
    try:
        with open(sql_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()
        in_values = False
        tags = []
        for line in lines:
            if not in_values:
                if 'VALUES' in line.upper():
                    in_values = True
            elif in_values:
                line = line.strip()
                if line.startswith('(') and line.endswith(('),', ');')):
                    tag = line.split("'")[1]
                    tags.append(tag)
        return {tag: idx + 1 for idx, tag in enumerate(tags)}
    except FileNotFoundError:
        return None

def map_score_to_rating(score):
    return str(round(score)) if score else '5'

def sanitize(text):
    # Standard SQL escape for single quotes
    return text.replace("'", "''") if text else ''

# --- ASYNC NETWORK FUNCTIONS ---

async def fetch_page(session, page, semaphore):
    async with semaphore:
        # 'sfw': 'true' filters out Adult content on the API side
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
    async with aiohttp.ClientSession() as session:
        params = {'page': 1, 'sfw': 'true'}
        async with session.get(BASE_URL, params=params) as response:
            if response.status == 200:
                data = await response.json()
                return data['pagination']['last_visible_page']
            return 1

# --- MAIN LOGIC ---

async def main():
    print("🚀 Starting Auto-Insert Process (Async Mode)")
    
    # 1. LOAD MAPS (Priority: TXT -> Fallback: SQL)
    studio_map = load_map_from_text('studio_map.txt', 'studio_map')
    if not studio_map:
        print("⚠️ studio_map.txt not found. Attempting to parse SQL...")
        studio_map = parse_studio_sql_fallback('studio_inserts.sql')

    tag_map = load_map_from_text('tag_map.txt', 'tag_map')
    if not tag_map:
        print("⚠️ tag_map.txt not found. Attempting to parse SQL...")
        tag_map = generate_tag_map_fallback('insert_tags.sql')

    if not studio_map or not tag_map:
        print("\n❌ CRITICAL ERROR: Could not load Studio or Tag maps.")
        print("   Please ensure 'studio_map.txt' and 'tag_map.txt' exist.")
        print("   (Or provide 'studio_inserts.sql' and 'insert_tags.sql' as fallback).")
        return

    print(f"✅ Loaded {len(studio_map)} Studios and {len(tag_map)} Tags.")

    # 2. CHECK PAGES
    print("🔍 Checking total pages available...")
    total_pages = await get_pagination_limit()
    print(f"📄 Found {total_pages} pages. Starting parallel fetch...")

    # 3. FETCH DATA
    all_anime_data = []
    semaphore = asyncio.Semaphore(MAX_CONCURRENT_REQUESTS)
    
    async with aiohttp.ClientSession() as session:
        tasks = []
        for page in range(1, total_pages + 1):
            tasks.append(fetch_page(session, page, semaphore))
        
        for f in tqdm.tqdm(asyncio.as_completed(tasks), total=len(tasks), desc="🚀 Downloading Pages", unit="page"):
            page_data = await f
            all_anime_data.extend(page_data)

    print(f"📥 Download complete. Processing {len(all_anime_data)} anime entries...")

    # 4. PROCESS DATA
    skipped_animes = []
    anime_insert_values = []
    anime_tags_insert_values = []
    seen_titles = set()
    anime_id_counter = 1

    for anime in tqdm.tqdm(all_anime_data, desc="⚙️ Processing Data", colour="green"):
        title = sanitize(anime.get('title'))

        if title in seen_titles:
            skipped_animes.append(f"{title} - Duplicate title")
            continue
        seen_titles.add(title)

        type_ = anime.get('type')
        if type_ == 'Music':
            skipped_animes.append(f"{title} - Type: Music")
            continue

        if type_ in ['TV Special', 'PV', 'CM']:
            type_ = 'Special'

        if type_ not in ['TV', 'Movie', 'ONA', 'OVA', 'Special']:
            skipped_animes.append(f"{title} - Invalid type: {type_}")
            continue

        status_map = {'Currently Airing': 'Airing', 'Finished Airing': 'Completed', 'Not yet aired': 'Upcoming'}
        status = status_map.get(anime.get('status'), 'Upcoming')

        start = anime.get('aired', {}).get('from')
        end = anime.get('aired', {}).get('to')
        airing_start = f"'{start[:10]}'" if start else 'NULL'
        airing_end = f"'{end[:10]}'" if end else 'NULL'
        
        episodes = anime.get('episodes') or 'NULL'
        score = anime.get('score')
        rating = map_score_to_rating(score)
        synopsis = sanitize(anime.get('synopsis') or '')
        image_url = sanitize(anime.get('images', {}).get('jpg', {}).get('image_url', ''))

        # Studio Mapping
        studios = anime.get('studios')
        if not studios:
            skipped_animes.append(f"{title} - No studio")
            continue
        
        studio_name = studios[0]['name']
        
        # Try direct match
        StudioID = studio_map.get(studio_name)
        
        # Try unescaped match (if API has "Brain's Base" but map has it differently)
        if not StudioID and "'" in studio_name:
             StudioID = studio_map.get(studio_name.replace("'", "''"))

        if not StudioID:
            skipped_animes.append(f"{title} - Unknown studio: {studio_name}")
            continue

        # Tag Mapping
        genres = anime.get('genres', [])
        themes = anime.get('themes', [])
        genre_names = [g['name'] for g in genres]
        theme_names = [t['name'] for t in themes]
        all_tags = genre_names + theme_names

        # Safety Check
        if any(x in all_tags for x in ['Hentai', 'NSFW', 'Erotica']):
            skipped_animes.append(f"{title} - Skipped due to NSFW tags")
            continue

        tag_ids = [tag_map[tag_name] for tag_name in all_tags if tag_name in tag_map]
        if not tag_ids:
            if 'NO TAGS' in tag_map:
                tag_ids = [tag_map['NO TAGS']]

        # Build SQL
        anime_insert_values.append(
            f"('{title}', '{type_}', {episodes}, '{status}', {airing_start}, {airing_end}, '{rating}', '{synopsis}', {StudioID}, '{image_url}')"
        )

        for tag_id in tag_ids:
            anime_tags_insert_values.append(f"(@anime_id_{anime_id_counter}, {tag_id})")

        anime_id_counter += 1

    # 5. WRITE FILES
    print("💾 Writing logs and SQL files...")
    
    # Dynamic Filename Logic
    count = len(anime_insert_values)
    output_filename = f"insert_anime_{count}.sql"
    
    with open("skipped_animes.txt", "w", encoding="utf-8") as log_file:
        log_file.write("Skipped Anime Log:\n")
        log_file.write("\n".join(skipped_animes))

    with open(output_filename, "w", encoding="utf-8") as f:
        f.write("START TRANSACTION;\n")
        curr_id = 1
        for val in anime_insert_values:
            f.write(f"INSERT INTO Anime (title, type, episodes, status, airing_start, airing_end, rating, synopsis, StudioID, image_url) VALUES {val};\n")
            f.write(f"SET @anime_id_{curr_id} = LAST_INSERT_ID();\n")
            curr_id += 1

        if anime_tags_insert_values:
            f.write("\nINSERT INTO Anime_Tags (AnimeID, TagID) VALUES\n")
            f.write(",\n".join(anime_tags_insert_values) + ";\n")

        f.write("COMMIT;\n")

    print(f"✅ Anime insert script generated as: {output_filename}")
    print(f"📦 Total Entries: {count}")

if __name__ == "__main__":
    asyncio.run(main())