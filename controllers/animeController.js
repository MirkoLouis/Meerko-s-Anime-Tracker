const db = require('../config/database');

const getFocusAnime = async (req, res) => {
    const animeId = req.params.animeId;
    const query = `
        SELECT
            a.AnimeID, a.title, a.type, a.episodes, a.status, a.airing_start,
            a.airing_end, a.rating, a.synopsis, a.image_url,
            s.studio_name, s.rating AS studio_rating,
            GROUP_CONCAT(DISTINCT t.tag ORDER BY t.tag SEPARATOR ', ') AS genres
        FROM Anime a
        JOIN Studio s ON a.StudioID = s.StudioID
        LEFT JOIN Anime_Tags at ON a.AnimeID = at.AnimeID
        LEFT JOIN Tags t ON at.TagID = t.TagID
        WHERE a.AnimeID = ?;
    `;

    try {
        const [results] = await db.query(query, [animeId]);
        console.log('Query results:', results);
        if (results.length > 0) {
            res.json(results[0]);
        } else {
            res.status(404).json({ error: 'Anime not found' });
        }
    } catch (err) {
        console.error('Error fetching anime details:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const searchAnime = async (req, res) => {
    const query = req.query.q || '';
    const page = parseInt(req.query.page) || 1;
    const tags = req.query.tags ? req.query.tags.split(',') : [];
    const studio = req.query.studio || '';
    const rating = req.query.rating || '';
    const limit = 51;
    const offset = (page - 1) * limit;

    try {
        const whereClauses = [`a.title LIKE ?`];
        const queryParams = [`%${query}%`];

        if (studio) {
            whereClauses.push(`s.studio_name = ?`);
            queryParams.push(studio);
        }

        if (rating) {
            whereClauses.push(`a.rating = ?`);
            queryParams.push(rating);
        }

        const whereSQL = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

        const [results] = await db.query(`
            SELECT 
                a.AnimeID, a.title, a.type, a.episodes, a.status, a.airing_start, 
                a.airing_end, a.rating, a.synopsis, a.image_url,
                s.studio_name, s.rating AS studio_rating, 
                GROUP_CONCAT(DISTINCT t2.tag ORDER BY t2.tag SEPARATOR ', ') AS genres
            FROM Anime a
            JOIN Studio s ON a.StudioID = s.StudioID
            ${tags.length ? `
            JOIN (
                SELECT at.AnimeID
                FROM Anime_Tags at
                JOIN Tags t ON at.TagID = t.TagID
                WHERE t.tag IN (${tags.map(() => '?').join(',')})
                GROUP BY at.AnimeID
                HAVING COUNT(DISTINCT t.tag) = ?
            ) filtered_anime ON a.AnimeID = filtered_anime.AnimeID
            ` : ''}
            JOIN Anime_Tags at2 ON a.AnimeID = at2.AnimeID
            JOIN Tags t2 ON at2.TagID = t2.TagID
            ${whereSQL}
            GROUP BY a.AnimeID
            ORDER BY a.title ASC
            LIMIT ? OFFSET ?
        `,
        tags.length ? [...tags, tags.length, ...queryParams, limit, offset] : [...queryParams, limit, offset]
        );

        // Count all animes for proper pagination
        const [[{ count }]] = await db.query(`
            SELECT COUNT(DISTINCT a.AnimeID) as count
            FROM Anime a
            JOIN Studio s ON a.StudioID = s.StudioID
            ${tags.length ? `
            JOIN (
                SELECT at.AnimeID
                FROM Anime_Tags at
                JOIN Tags t ON at.TagID = t.TagID
                WHERE t.tag IN (${tags.map(() => '?').join(',')})
                GROUP BY at.AnimeID
                HAVING COUNT(DISTINCT t.tag) = ?
            ) filtered_anime ON a.AnimeID = filtered_anime.AnimeID
            ` : ''}
            ${whereSQL}
        `,
        tags.length ? [...tags, tags.length, ...queryParams] : queryParams
        );

        res.json({
            results,
            total: count,
            page
        });

    } catch (err) {
        console.error('Search error:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getAnimeSpotlight = async (req, res) => {
    const query = `
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
            GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ') AS genres
        FROM Anime a
        JOIN Studio s ON a.StudioID = s.StudioID
        JOIN Anime_Tags at ON a.AnimeID = at.AnimeID
        JOIN Tags t ON at.TagID = t.TagID
        WHERE a.rating >= 10
        GROUP BY a.AnimeID
        ORDER BY a.title ASC
        LIMIT 10
        ;
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getNewAnimes = async (req, res) => {
    const query = `
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
            GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ') AS genres
        FROM Anime a
        JOIN Studio s ON a.StudioID = s.StudioID
        JOIN Anime_Tags at ON a.AnimeID = at.AnimeID
        JOIN Tags t ON at.TagID = t.TagID
        WHERE a.status = 'Airing'
        GROUP BY a.AnimeID
        ORDER BY a.airing_start DESC
        ;
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getUpcomingAnimes = async (req, res) => {
    const query = `
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
            GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ') AS genres
        FROM Anime a
        JOIN Studio s ON a.StudioID = s.StudioID
        JOIN Anime_Tags at ON a.AnimeID = at.AnimeID
        JOIN Tags t ON at.TagID = t.TagID
        WHERE a.status = 'Upcoming'
        GROUP BY a.AnimeID
        ORDER BY a.airing_start DESC
        ;
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getRecommendedAnimes = async (req, res) => {
    const query = `
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
            GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ') AS genres
        FROM Anime a
        JOIN Studio s ON a.StudioID = s.StudioID
        JOIN Anime_Tags at ON a.AnimeID = at.AnimeID
        JOIN Tags t ON at.TagID = t.TagID
        WHERE a.rating IN ('8','9')
        GROUP BY a.AnimeID
        ORDER BY a.rating DESC
        limit 15
        ;
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getRandomAnimes = async (req, res) => {
    const query = `
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
            GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ') AS genres
        FROM Anime a
        JOIN Studio s ON a.StudioID = s.StudioID
        JOIN Anime_Tags at ON a.AnimeID = at.AnimeID
        JOIN Tags t ON at.TagID = t.TagID
        GROUP BY a.AnimeID
        ORDER BY RAND()
        LIMIT 5;
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getAllAnimes = async (req, res) => {
    const query = `
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
            GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ') AS genres
        FROM Anime a
        JOIN Studio s ON a.StudioID = s.StudioID
        JOIN Anime_Tags at ON a.AnimeID = at.AnimeID
        JOIN Tags t ON at.TagID = t.TagID
        GROUP BY a.AnimeID
        ORDER BY a.title ASC
        ;
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getAllTags = async (req, res) => {
    const query = `
        SELECT DISTINCT tag FROM Tags ORDER BY tag
        ;
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

const getMostWatchlistedAnimes = async (req, res) => {
    const query = `
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
            GROUP_CONCAT(t.tag ORDER BY t.tag SEPARATOR ', ') AS genres,
            COUNT(w.WatchlistID) AS watchlist_count
        FROM Anime a
        JOIN Studio s ON a.StudioID = s.StudioID
        JOIN Watchlist w ON a.AnimeID = w.AnimeID
        JOIN Anime_Tags at ON a.AnimeID = at.AnimeID
        JOIN Tags t ON at.TagID = t.TagID
        GROUP BY a.AnimeID
        ORDER BY watchlist_count DESC
        LIMIT 30;
    `;

    try {
        const [results] = await db.query(query);
        res.json(results);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Database error' });
    }
};

module.exports = {
    getFocusAnime,
    searchAnime,
    getAnimeSpotlight,
    getNewAnimes,
    getUpcomingAnimes,
    getRecommendedAnimes,
    getRandomAnimes,
    getAllAnimes,
    getAllTags,
    getMostWatchlistedAnimes,
};