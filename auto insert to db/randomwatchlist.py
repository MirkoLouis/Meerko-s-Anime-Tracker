import random

# Import the random module for generating random numbers and choices.

# Define constants for user IDs, anime IDs, watchlist statuses, and maximum entries per user.
USER_IDS = range(1, 11)  # Total Users + 1
ANIME_IDS = range(1, 15193)  # Total Animes + 1
STATUS_OPTIONS = ['Completed', 'Watching', 'Plan to Watch']  # Status options
MAX_WATCHLIST_PER_USER = 500  # Max watchlist entries per user

# Generates a single SQL INSERT statement for populating the 'watchlist' table with random data.
def generate_watchlist_insert():
    # List to store all value sets for the single INSERT statement
    values = []

    # Generate watchlist for each user
    for user_id in USER_IDS:
        # Randomly determine how many anime to add (up to 100 per user)
        num_entries = random.randint(1, MAX_WATCHLIST_PER_USER)
        anime_ids = random.sample(ANIME_IDS, num_entries)  # Randomly select anime IDs
        statuses = random.choices(STATUS_OPTIONS, k=num_entries)  # Random statuses for each anime

        # Add each value set to the values list
        for anime_id, status in zip(anime_ids, statuses):
            values.append(f"({user_id}, {anime_id}, '{status}')")

    # Create the final SQL statement with all values
    sql_statement = f"INSERT INTO watchlist (UserID, AnimeID, status) VALUES\n" + ",\n".join(values) + ";"

    return sql_statement

# Define the output file path for the SQL insert statement.
output_file = "insert_watchlists.sql"

# Open the output file in write mode and write the generated SQL statement to it.
with open(output_file, 'w') as file:
    file.write(generate_watchlist_insert())

# Print a confirmation message indicating where the SQL statement was written.
print(f"SQL statement has been written to {output_file}")
