import requests
import time
import tqdm
from collections import defaultdict

# Import necessary libraries: requests for API calls, time for delays, tqdm for progress bars,
# and defaultdict for efficient counting of studio frequencies.

# Fetches anime data from the Jikan API, counts the frequency of each studio,
# and identifies studios associated with Hentai-tagged anime for skipping.
def fetch_studio_frequencies():
    studio_count = defaultdict(int) # Dictionary to store the frequency of each studio.
    skipped_studios = defaultdict(list) # Dictionary to store studios associated with skipped anime.
    page = 1 # Initialize page number for API requests.

    print("📥 Starting to fetch all anime pages...")

    with tqdm.tqdm(desc="📄 Fetching Pages", unit="page") as pbar:
        while True:
            url = f'https://api.jikan.moe/v4/anime?page={page}'
            response = requests.get(url)

            if response.status_code != 200:
                print(f"❌ Failed to fetch page {page}")
                break

            data = response.json().get('data', [])
            if not data:
                break

            for anime in data:
                title = anime.get('title')
                genres = [g['name'].lower() for g in anime.get('genres', [])]
                explicit_genres = [g['name'].lower() for g in anime.get('explicit_genres', [])]
                themes = [g['name'].lower() for g in anime.get('themes', [])]
                demographics = [g['name'].lower() for g in anime.get('demographics', [])]

                all_tags = genres + explicit_genres + themes + demographics

                # Skip anime with 'hentai' tag and log associated studios.
                if 'hentai' in all_tags:
                    for studio in anime.get('studios', []):
                        name = studio.get('name')
                        if name:
                            skipped_studios[name].append(title)
                    continue

                # Count the frequency of each valid studio.
                for studio in anime.get('studios', []):
                    name = studio.get('name')
                    if name:
                        studio_count[name] += 1

            page += 1
            pbar.update(1)
            time.sleep(1)  # Respect API rate limit

    return studio_count, skipped_studios

# Calculates a rating for a studio based on its frequency of anime productions.
# Higher frequency leads to a higher rating (up to 5).
def calculate_rating(frequency):
    if frequency >= 10:
        return 5
    elif frequency >= 6:
        return 4
    elif frequency >= 3:
        return 3
    elif frequency >= 1:
        return 2
    else:
        return 1

# Sanitizes a string for SQL insertion by escaping single quotes.
def sanitize(string):
    return string.replace("'", "''")

if __name__ == "__main__":
    print("🚀 Fetching studio frequencies...")
    # Call the function to fetch studio frequencies and identify skipped studios.
    studio_count, skipped_studios = fetch_studio_frequencies()

    # Write SQL INSERT statements to a file.
    print("💾 Writing SQL insert statements to studio_inserts.sql...")
    with open("studio_inserts.sql", "w", encoding="utf-8") as sql_file:
        sql_file.write("INSERT INTO Studio (studio_name, rating) VALUES\n")
        values = []
        for studio_name in sorted(studio_count.keys()):
            rating = calculate_rating(studio_count[studio_name])
            name = sanitize(studio_name)
            values.append(f"('{name}', {rating})")
        sql_file.write(",\n".join(values) + ";\n")

    # Write skipped studios and associated anime titles to a log file.
    print("📄 Writing skipped studios to skipped_studios.log...")
    with open("skipped_studios.log", "w", encoding="utf-8") as log_file:
        if skipped_studios:
            log_file.write("⛔ Skipped Studios due to Hentai-tagged anime:\n\n")
            for studio in sorted(skipped_studios.keys()):
                log_file.write(f"{studio}:\n")
                for title in skipped_studios[studio]:
                    log_file.write(f"  - {title}\n")
                log_file.write("\n")
        else:
            log_file.write("✅ No studios were skipped.\n")

    print("✅ All done!")
