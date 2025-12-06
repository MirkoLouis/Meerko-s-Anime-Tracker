const db = require('../config/database');

const getCommentsByAnimeId = async (animeId) => {
    const [comments] = await db.query(
        `SELECT c.CommentID, c.comment_text, c.created_at, u.display_name, u.UserID, u.role
         FROM comments c
         JOIN user u ON c.UserID = u.UserID
         WHERE c.AnimeID = ?
         ORDER BY c.created_at ASC`,
        [animeId]
    );
    return comments;
};

module.exports = {
    getCommentsByAnimeId,
};