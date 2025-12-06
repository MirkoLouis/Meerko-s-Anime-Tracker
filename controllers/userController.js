const db = require('../config/database');

const getUserSpotlight = async (req, res) => {
    const userID = req.user.id;

    try {
        // Step 1: Check if user has ANY watchlist entries
        const [userWatchlistCheck] = await db.query(`
            SELECT COUNT(*) AS total FROM watchlist WHERE UserID = ?
        `, [userID]);

        const userHasWatchlist = userWatchlistCheck[0].total > 0;

        if (!userHasWatchlist) {
            // New user fallback — top-rated spotlight anime (rating >= 8), ordered by watchlist popularity
            const [topRatedResults] = await db.query(`
                SELECT 
                    a.AnimeID,
                    a.title,
                    a.type,
                    a.episodes,
                    a.status,
                    a.airing_start,
                    a.airing_end,
                    a.rating,
                    a.synopsis,
                    a.image_url,
                    s.studio_name,
                    s.rating AS studio_rating,
                    (SELECT GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ')
                     FROM anime_tags at2
                     JOIN tags t ON at2.TagID = t.TagID
                     WHERE at2.AnimeID = a.AnimeID
                    ) AS genres,
                    COUNT(w.WatchlistID) AS watchlist_count
                FROM Anime a
                JOIN Studio s ON a.StudioID = s.StudioID
                JOIN Watchlist w ON a.AnimeID = w.AnimeID
                WHERE a.rating >= 8
                GROUP BY a.AnimeID
                ORDER BY watchlist_count DESC
            `);

            return res.json(topRatedResults);
        }

        // Step 2: Get top tags from user’s watchlist (any status)
        const [topTagsResult] = await db.query(`
            SELECT t.tag, COUNT(*) AS tag_count
            FROM watchlist w
            JOIN anime_tags at ON w.AnimeID = at.AnimeID
            JOIN tags t ON at.TagID = t.TagID
            WHERE w.UserID = ?
            GROUP BY t.tag
            ORDER BY tag_count DESC
        `, [userID]);

        if (topTagsResult.length === 0) {
            return res.status(404).json({ message: "No tag data found for user." });
        }

        const topTags = topTagsResult.map(row => row.tag);
        const placeholders = topTags.map(() => '?').join(', ');

        // Step 3: Recommend highly-rated anime based on top tags, that the user hasn't watched
        const [spotlightResults] = await db.query(`
            SELECT 
                a.AnimeID,
                a.title,
                a.type,
                a.episodes,
                a.status AS anime_status,
                a.airing_start,
                a.airing_end,
                a.rating,
                a.synopsis,
                a.image_url,
                s.studio_name,
                s.rating AS studio_rating,
                (SELECT GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ')
                 FROM anime_tags at2
                 JOIN tags t ON at2.TagID = t.TagID
                 WHERE at2.AnimeID = a.AnimeID
                ) AS genres,
                COUNT(DISTINCT w.WatchlistID) AS watchlist_count
            FROM anime a
            LEFT JOIN studio s ON a.StudioID = s.StudioID
            LEFT JOIN watchlist w ON a.AnimeID = w.AnimeID
            WHERE a.rating >= 8
              AND a.AnimeID NOT IN (
                  SELECT AnimeID FROM watchlist WHERE UserID = ?
              )
              AND a.AnimeID IN (
                  SELECT DISTINCT at.AnimeID
                  FROM anime_tags at
                  JOIN tags t ON at.TagID = t.TagID
                  WHERE t.tag IN (${placeholders})
              )
            GROUP BY a.AnimeID
            ORDER BY a.rating DESC, watchlist_count DESC
        `, [userID, ...topTags]);

        if (spotlightResults.length === 0) {
            // Step 4: Fallback — most watchlisted anime with rating >= 8
            const [fallbackResults] = await db.query(`
                SELECT 
                    a.AnimeID,
                    a.title,
                    a.type,
                    a.episodes,
                    a.status,
                    a.airing_start,
                    a.airing_end,
                    a.rating,
                    a.synopsis,
                    a.image_url,
                    s.studio_name,
                    s.rating AS studio_rating,
                    (SELECT GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ')
                        FROM anime_tags at2
                        JOIN tags t ON at2.TagID = t.TagID
                        WHERE at2.AnimeID = a.AnimeID
                    ) AS genres,
                    COUNT(w.WatchlistID) AS watchlist_count
                FROM Anime a
                JOIN Studio s ON a.StudioID = s.StudioID
                JOIN Watchlist w ON a.AnimeID = w.AnimeID
                WHERE a.rating >= 8
                GROUP BY a.AnimeID
                ORDER BY watchlist_count DESC
            `);

            return res.json(fallbackResults);
        }

        return res.json(spotlightResults);

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Database error" });
    }
};

const getWatchlist = async (req, res) => {
    const userID = req.user.id;
    console.log("Current Logged-In User ID:", userID);
  
    const query = `
        SELECT 
            u.UserID, 
            u.username, 
            a.AnimeID, 
            a.title, 
            a.type, 
            a.episodes, 
            a.status AS anime_status, 
            a.airing_start, 
            a.airing_end, 
            a.rating, 
            a.synopsis, 
            a.image_url,
            s.studio_name, 
            s.rating AS studio_rating,
            GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ') AS genres,
            w.status AS watchlist_status,
            w.date_added, 
            w.last_updated
        FROM watchlist w
        LEFT JOIN user u ON w.UserID = u.UserID
        LEFT JOIN anime a ON w.AnimeID = a.AnimeID
        LEFT JOIN studio s ON a.StudioID = s.StudioID
        LEFT JOIN anime_tags at ON a.AnimeID = at.AnimeID
        LEFT JOIN tags t ON at.TagID = t.TagID
        WHERE u.UserID = ? AND (w.status = 'Plan to Watch' OR w.status = 'Watching')
        GROUP BY a.AnimeID, w.status, w.last_updated, w.date_added
        ORDER BY w.last_updated DESC;  -- to show the most recently added anime first
        ;
    `;
  
    try {
        const [results] = await db.query(query, [userID]);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getCompletedWatchlist = async (req, res) => {
    const userID = req.user.id;

    const query = `
        SELECT 
            u.UserID, 
            u.username, 
            a.AnimeID, 
            a.title, 
            a.type, 
            a.episodes, 
            a.status AS anime_status, 
            a.airing_start, 
            a.airing_end, 
            a.rating, 
            a.synopsis, 
            a.image_url,
            s.studio_name, 
            s.rating AS studio_rating,
            GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ') AS genres,
            w.status AS watchlist_status, 
            w.date_added,
            w.last_updated
        FROM watchlist w
        LEFT JOIN user u ON w.UserID = u.UserID
        LEFT JOIN anime a ON w.AnimeID = a.AnimeID
        LEFT JOIN studio s ON a.StudioID = s.StudioID
        LEFT JOIN anime_tags at ON a.AnimeID = at.AnimeID
        LEFT JOIN tags t ON at.TagID = t.TagID
        WHERE u.UserID = ? AND w.status = 'Completed'
        GROUP BY a.AnimeID, w.status, w.last_updated, w.date_added
        ORDER BY w.last_updated DESC;
    `;

    try {
        const [results] = await db.query(query, [userID]);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

const addToWatchlist = async (req, res) => {
    const userId = req.user.id;
    const { animeId, status } = req.body;

    if (!animeId || !status) {
        return res.status(400).json({ error: 'AnimeID and Status are required' });
    }

    const validStatuses = new Set(['Plan to Watch', 'Watching', 'Completed']);
    if (!validStatuses.has(status)) {
        return res.status(400).json({ error: 'Invalid status value' });
    }

    try {
        const query = 'SELECT 1 FROM Watchlist WHERE UserID = ? AND AnimeID = ? LIMIT 1';
        const [rows] = await db.query(query, [userId, animeId]);

        if (rows.length > 0) {
            return res.status(409).json({ error: 'Anime already in your watchlist' });
        }

        const insertQuery = `
            INSERT INTO Watchlist (UserID, AnimeID, status, last_updated)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `;
        await db.query(insertQuery, [userId, animeId, status]);

        return res.status(201).json({ success: true, message: 'Anime added to watchlist' });
    } catch (error) {
        console.error('Watchlist insertion error:', error);
        return res.status(500).json({ error: 'Server error while adding to watchlist' });
    }
};

const updateWatchlistStatus = async (req, res) => {
    const userId = req.user.id;
    const animeId = req.params.animeId;
    const { status } = req.body;

    if (!animeId || !status) {
        return res.status(400).json({ error: 'AnimeID and Status are required' });
    }
  
    const allowed = ['Completed', 'Watching', 'Plan to Watch'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
  
    const sql = `
        UPDATE Watchlist
        SET status = ?, last_updated = CURRENT_TIMESTAMP
        WHERE UserID = ? AND AnimeID = ?
    `;
    try {
        const [result] = await db.query(
                `UPDATE Watchlist
                SET status = ?, last_updated = CURRENT_TIMESTAMP
                WHERE UserID = ? AND AnimeID = ?`,
            [status, userId, animeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Anime not found in watchlist' });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('Error updating watchlist:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const deleteFromWatchlist = async (req, res) => {
    const userId = req.user.id;
    const animeId = req.params.animeId;

    console.log(`Deleting anime with ID ${animeId} for user ID ${userId}`);

    try {
        const [result] = await db.query(
            'DELETE FROM watchlist WHERE UserID = ? AND AnimeID = ?',
            [userId, animeId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Anime not found in watchlist' });
        }

        res.json({ success: true, message: 'Anime deleted successfully' });

    } catch (err) {
        console.error('Error deleting from watchlist:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

module.exports = {
    getUserSpotlight,
    getWatchlist,
    getCompletedWatchlist,
    addToWatchlist,
    updateWatchlistStatus,
    deleteFromWatchlist,
};