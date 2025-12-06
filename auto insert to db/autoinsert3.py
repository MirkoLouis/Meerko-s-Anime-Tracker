#!/usr/bin/env python
import requests
import random
import time
from tqdm import tqdm
import os

# Import necessary libraries for API requests, random operations, time delays, progress bars, and file system operations.

def parse_studio_sql(file_path):
    studio_map = {} # Initialize an empty dictionary to store the studio name to ID mapping.
    try:
        # Open and read all lines from the specified SQL file.
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Skip the first line, which contains the INSERT INTO statement.
        values_lines = lines[1:]

        # Join the remaining lines into a single string and split by the '),(' delimiter to get individual entries.
        values_str = ''.join(values_lines)
        entries = values_str.split('),')

        index = 1 # Initialize a counter for assigning StudioIDs.
        for entry in entries:
            # Clean up each entry by removing leading/trailing whitespace and specific characters.
            entry = entry.strip().lstrip('(').rstrip(',\n );')
            if entry:
                try:
                    # Extract the studio name (first part of the entry before the comma).
                    name, _ = entry.split(',', 1)
                    studio_name = name.strip().strip("' மதி") # Clean up the studio name.
                    studio_map[studio_name] = index # Map the studio name to its ID.
                    index += 1 # Increment the ID counter.
                except ValueError:
                    print(f"Skipping malformed entry: {entry}")
        return studio_map
    except FileNotFoundError:
        print(f"File not found: {file_path}")
        return None

def generate_tag_map(sql_file):
    tag_map = {} 
    try:
        with open(sql_file, 'r', encoding='utf-8') as file:
            lines = file.readlines()

        # Skip lines until we reach the 'VALUES' keyword
        in_values = False
        tags = []
        for line in lines:
            if not in_values:
                if 'VALUES' in line.upper():
                    in_values = True
            elif in_values:
                line = line.strip()
                if line.startswith('(') and line.endswith(('),', ');')):
                    tag = line.split("'")[1]  # Gets the content inside single quotes
                    tags.append(tag)

        # Generate the tag map
        tag_map = {tag: idx + 1 for idx, tag in enumerate(tags)}
        return tag_map
    except FileNotFoundError:
        print(f"File not found: {sql_file}")
        return None

# Generate maps from SQL files
studio_map = parse_studio_sql('studio_inserts.sql')
tag_map = generate_tag_map("insert_tags.sql")

if not studio_map or not tag_map:
    raise Exception("❌ Could not generate studio or tag maps. Please ensure studio_inserts.sql and insert_tags.sql exist.")

# Function to map Jikan API scores (0-10) to a rating scale (1-10), defaulting to 5 if no score.
def map_score_to_rating(score):
    return str(round(score)) if score else '5'

# Function to sanitize text for SQL insertion by escaping single quotes.
def sanitize(text):
    return text.replace("' மதி", "''") if text else ''

# Function to fetch data from a given URL with retry logic for robustness against transient network issues.
def fetch_with_retry(url, retries=3, delay=3):
    for attempt in range(retries):
        try:
            res = requests.get(url)
            if res.status_code == 200:
                return res
            print(f"Attempt {attempt+1}: Failed to fetch {url} (Status Code: {res.status_code})")
        except Exception as e:
            print(f"Attempt {attempt+1}: Error fetching {url} - {e}")
        time.sleep(delay)
    return None

skipped_log = [] # Stores logs of anime entries that were skipped during processing. 
anime_insert_values = [] # Accumulates SQL INSERT value strings for the Anime table.
anime_tags_insert_values = [] # Accumulates SQL INSERT value strings for the Anime_Tags table.
seen_titles = set() # Keeps track of anime titles already processed to avoid duplicates.
anime_id_counter = 1 # Simulated AnimeID for INSERT references (auto-increment in actual DB).

# Step 1: Start with the first page.
page = 1
while True:
    url = f'https://api.jikan.moe/v4/top/anime?page={page}'
    res = fetch_with_retry(url)
    
    if res is None:
        print(f"❌ Permanently failed to fetch page {page}")
        break

    data = res.json()
    anime_list = data.get('data', [])

    for anime in tqdm(anime_list, desc=f"Processing Page {page}", leave=False, colour="green"):
        # Extract and sanitize the anime title.
        title = sanitize(anime.get('title'))

        # Skip if the title is a duplicate.
        if title in seen_titles:
            skipped_log.append(f"{title} - Duplicate title")
            continue
        seen_titles.add(title)

        # Extract and validate anime type.
        type_ = anime.get('type')
        if type_ == 'Music':
            skipped_log.append(f"{title} - Type: Music")
            continue

        if type_ in ['TV Special', 'PV', 'CM']:
            type_ = 'Special'

        if type_ not in ['TV', 'Movie', 'ONA', 'OVA', 'Special']:
            skipped_log.append(f"{title} - Invalid type: {type_}")
            continue

        # Extract episodes and map status.
        episodes = anime.get('episodes') or 'NULL'
        status_map = {'Currently Airing': 'Airing', 'Finished Airing': 'Completed', 'Not yet aired': 'Upcoming'}
        status = status_map.get(anime.get('status'), 'Upcoming')

        # Extract and format airing dates.
        start = anime.get('aired', {}).get('from')
        end = anime.get('aired', {}).get('to')
        airing_start = f"'{start[:10]}'" if start else 'NULL'
        airing_end = f"'{end[:10]}'" if end else 'NULL'

        # Extract score, map to rating, sanitize synopsis and image URL.
        score = anime.get('score') or 5
        rating = map_score_to_rating(score)
        synopsis = sanitize(anime.get('synopsis') or '')
        image_url = sanitize(anime.get('images', {}).get('jpg', {}).get('image_url', ''))

        # Extract studio information.
        studios = anime.get('studios')
        if not studios:
            skipped_log.append(f"{title} - No studio")
            continue
        studio_name = studios[0]['name']
        StudioID = studio_map.get(studio_name)
        if not StudioID:
            skipped_log.append(f"{title} - Unknown studio: {studio_name}")
            continue

        # Extract and process genres and themes.
        genres = anime.get('genres', [])
        themes = anime.get('themes', [])
        genre_names = [g['name'] for g in genres]
        theme_names = [t['name'] for t in themes]
        all_tags = genre_names + theme_names

        # Skip hentai/NSFW content.
        if 'Hentai' in all_tags or 'NSFW' in all_tags or 'Erotica' in all_tags:
            skipped_log.append(f"{title} - Skipped due to genre/theme: {'Hentai' if 'Hentai' in all_tags else 'NSFW'}")
            continue

        # Map tags to IDs, defaulting to 'NO TAGS' if none are found.
        tag_ids = [tag_map[tag_name] for tag_name in all_tags if tag_name in tag_map]
        if not tag_ids:
            tag_ids = [tag_map['NO TAGS']]

        # Append formatted SQL values for Anime table.
        anime_insert_values.append(
            f"('{title}', '{type_}', {episodes}, '{status}', {airing_start}, {airing_end}, '{rating}', '{synopsis}', {StudioID}, '{image_url}')"
        )

        # Append formatted SQL values for Anime_Tags table.
        for tag_id in tag_ids:
            anime_tags_insert_values.append(f"(@anime_id_{anime_id_counter}, {tag_id})")

        anime_id_counter += 1

    # Check if there is a next page.
    if not data.get('pagination', {}).get('has_next_page'):
        break

    page += 1

# Write skipped anime log to a text file for review.
with open("skipped_log.txt", "w", encoding="utf-8") as log_file:
    log_file.write("Skipped Anime Log:\n")
    log_file.write("\n".join(skipped_log))

# Write generated SQL INSERT statements for Anime and Anime_Tags tables to an .sql file.
with open("anime_insert_v3.sql", "w", encoding="utf-8") as f:
    f.write("START TRANSACTION;\n")
    anime_id = 1
    for val in anime_insert_values:
        f.write(f"INSERT INTO Anime (title, type, episodes, status, airing_start, airing_end, rating, synopsis, StudioID, image_url) VALUES {val};\n")
        f.write(f"SET @anime_id_{anime_id} = LAST_INSERT_ID();\n")
        anime_id += 1

    if anime_tags_insert_values:
        f.write("\nINSERT INTO Anime_Tags (AnimeID, TagID) VALUES\n")
        f.write(",\n".join(anime_tags_insert_values) + ";\n")

    f.write("COMMIT;\n")

# Print confirmation messages indicating the successful generation of SQL scripts and the number of entries.
print(f"✅ Anime insert script generated as anime_insert_v3.sql with {len(anime_insert_values)} entries.")
print(f"📦 Anime_Tags insert script generated with {len(anime_tags_insert_values)} entries.")
