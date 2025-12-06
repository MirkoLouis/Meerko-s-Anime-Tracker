import random
import tqdm

def generate_unique_comments(num_comments=500):
    """
    Generates a list of unique, randomly constructed comments about anime.
    """
    adjectives = [
        "amazing", "incredible", "stunning", "beautiful", "disappointing", "slow", 
        "fast-paced", "emotional", "hilarious", "dark", "thought-provoking", 
        "overrated", "underrated", "well-written", "poorly-executed", "memorable",
        "classic", "forgettable", "confusing", "masterful", "decent", "solid"
    ]
    nouns = [
        "story", "animation", "soundtrack", "main character", "ending", "pacing", 
        "world-building", "character development", "art style", "voice acting",
        "opening theme", "plot twist", "filler arc"
    ]
    genres = [
        "action", "romance", "comedy", "sci-fi", "fantasy", "slice of life", 
        "mecha", "isekai", "horror", "mystery", "sports", "psychological"
    ]
    verbs = ["loved", "hated", "enjoyed", "binge-watched", "appreciated", "couldn't stand"]
    adverbs = ["absolutely", "completely", "surprisingly", "a bit", "totally", "somewhat"]
    
    templates = [
        "The {noun} is simply {adjective}.",
        "I was blown away by the {adjective} {noun}.",
        "A must-watch for fans of {genre} anime.",
        "Honestly, the {noun} was a bit {adjective} for my taste.",
        "I'd rate this a solid {rating}/10, the {noun} was {adjective}.",
        "If you like {genre} shows, you'll probably love this.",
        "The {adjective} art style really stands out.",
        "This show has some of the best {noun} I've ever seen.",
        "A bit {adjective}, but still a good watch.",
        "The ending felt {adjective} and left me wanting more.",
        "Not a fan of the {noun}, it felt too {adjective}.",
        "This is peak {genre}. The {noun} is just perfect.",
        "A true masterpiece of the {genre} genre. The {noun} was {adjective}.",
        "I {adverb} {verb} the {noun} in this one.",
        "The first season was {adjective}, but the second one was a letdown.",
        "Can anyone recommend an anime like this? I'm looking for more {genre}.",
        "This is my comfort show. I always come back to it.",
        "The hype is real for this one. The {noun} is {adjective}!",
        "It's a shame this is so {adjective}, it had potential.",
        "A hidden gem! The {noun} is surprisingly {adjective}."
    ]

    comments = set()
    while len(comments) < num_comments:
        template = random.choice(templates)
        comment = template.format(
            adjective=random.choice(adjectives),
            noun=random.choice(nouns),
            genre=random.choice(genres),
            rating=random.randint(6, 10),
            adverb=random.choice(adverbs),
            verb=random.choice(verbs)
        )
        comments.add(comment)
    
    return list(comments)

# Define constants for user IDs and the range of anime IDs
USER_IDS = range(1, 11) # Total Users + 1
ANIME_IDS = range(1, 15193) # Total Animes + 1

def generate_comment_inserts(unique_comments):
    """
    Generates SQL INSERT statements for comments, assigning 1-5 random comments
    to every anime in the ANIME_IDS range.
    """
    values = []
    
    # NOTE: This will generate comments for ALL animes in the ANIME_IDS range,
    # which will create a very large SQL file (15k to 75k entries).
    for anime_id in tqdm.tqdm(ANIME_IDS, desc="✍️ Generating Comments for Animes", unit="anime"):
        num_comments_for_anime = random.randint(1, 5)
        
        for _ in range(num_comments_for_anime):
            user_id = random.choice(USER_IDS)
            comment_text = random.choice(unique_comments).replace("'", "''") 
            values.append(f"({anime_id}, {user_id}, '{comment_text}')")

    if not values:
        return ""

    sql_statement = f"INSERT INTO comments (AnimeID, UserID, comment_text) VALUES\n" + ",\n".join(values) + ";"
    return sql_statement

if __name__ == "__main__":
    output_file = "insert_comments.sql"
    
    print("✍️ Generating 500 unique comments...")
    unique_comments = generate_unique_comments(500)
    
    print(f"💾 Generating SQL insert statements for all {len(list(ANIME_IDS))} animes...")
    sql_inserts = generate_comment_inserts(unique_comments)
    
    with open(output_file, 'w', encoding='utf-8') as file:
        file.write(sql_inserts)

    print(f"✅ SQL statements for random comments have been written to {output_file}")
