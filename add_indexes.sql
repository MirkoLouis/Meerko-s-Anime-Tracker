-- Indexes for the `Anime` table
CREATE INDEX idx_anime_title ON anime(title);
CREATE INDEX idx_anime_status ON anime(status);
CREATE INDEX idx_anime_rating ON anime(rating);

-- Index for the `Studio` table
CREATE INDEX idx_studio_name ON studio(studio_name);

-- Index for the `Tags` table
CREATE INDEX idx_tag_name ON tags(tag);

-- Indexes for the `Watchlist` table
CREATE UNIQUE INDEX idx_watchlist_user_anime ON watchlist(UserID, AnimeID);

-- Index for the `comments` table

-- Indexes for the `user` table

-- Composite index for the junction table `Anime_Tags`
-- This helps in finding all tags for an anime or all animes for a tag efficiently.
CREATE INDEX idx_animetags_anime_tag ON anime_tags(AnimeID, TagID);
CREATE INDEX idx_animetags_tag_anime ON anime_tags(TagID, AnimeID);
