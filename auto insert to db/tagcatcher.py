import requests

# Jikan API endpoint for anime genres/tags
url = "https://api.jikan.moe/v4/genres/anime"

# Send GET request
response = requests.get(url)

# Check if the request was successful
if response.status_code == 200:
    data = response.json()
    genres = data.get("data", [])

    # Start building SQL
    sql_lines = ["-- Insert statements for anime tags/genres"]
    sql_lines.append("INSERT INTO Tags (tag)")
    sql_lines.append("VALUES")

    values = []
    for genre in genres:
        tag_name = genre.get("name", "").replace("'", "''")  # Escape single quotes
        values.append(f"('{tag_name}')")

    # Join values with commas, add semicolon at end
    sql_lines.append(",\n".join(values) + ",\n('NO TAGS');")

    # Write to file
    with open("insert_tags.sql", "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines))

    print("✅ SQL file 'insert_tags.sql' created successfully.")
else:
    print(f"❌ Failed to fetch genres: HTTP {response.status_code}")
