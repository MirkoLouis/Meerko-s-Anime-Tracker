-- Indexes for the `Anime` table
CREATE INDEX idx_anime_title ON Anime(title);
CREATE INDEX idx_anime_status ON Anime(status);
CREATE INDEX idx_anime_rating ON Anime(rating);

-- Index for the `Studio` table
CREATE INDEX idx_studio_name ON Studio(studio_name);

-- Index for the `Tags` table
CREATE INDEX idx_tag_name ON Tags(tag);

-- Indexes for the `Watchlist` table
CREATE UNIQUE INDEX idx_watchlist_user_anime ON Watchlist(UserID, AnimeID);

-- Index for the `comments` table

-- Indexes for the `user` table

-- Composite index for the junction table `Anime_Tags`
-- This helps in finding all tags for an anime or all animes for a tag efficiently.
CREATE INDEX idx_animetags_anime_tag ON Anime_Tags(AnimeID, TagID);
CREATE INDEX idx_animetags_tag_anime ON Anime_Tags(TagID, AnimeID);
