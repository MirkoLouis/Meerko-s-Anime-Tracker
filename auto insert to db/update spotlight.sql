SELECT * FROM anime 
WHERE title IN (
    "Sousou no Frieren",
    "Fullmetal Alchemist: Brotherhood",
    "Steins;Gate",
    "One Piece Fan Letter",
    "Shingeki no Kyojin Season 3 Part 2",
    "Gintama°",
    "Gintama: The Final",
    "Hunter x Hunter (2011)",
    "Gintama'",
    "Gintama': Enchousen"
);

UPDATE anime
SET rating = 10
WHERE title IN (
    "Sousou no Frieren",
    "Fullmetal Alchemist: Brotherhood",
    "Steins;Gate",
    "One Piece Fan Letter",
    "Shingeki no Kyojin Season 3 Part 2",
    "Gintama°",
    "Gintama: The Final",
    "Hunter x Hunter (2011)",
    "Gintama'",
    "Gintama': Enchousen"
);