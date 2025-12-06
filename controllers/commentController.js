const db = require('../config/database');
const commentService = require('../services/commentService');

const getComments = async (req, res) => {
    const { animeId } = req.params;
    try {
        const comments = await commentService.getCommentsByAnimeId(animeId);
        res.json(comments);
    } catch (err) {
        console.error('Error fetching comments:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const postComment = async (req, res) => {
    const { animeId } = req.params;
    const { comment_text } = req.body;
    const userID = req.user.id; // From requireAuth middleware

    if (!comment_text || comment_text.trim() === '') {
        return res.status(400).json({ error: 'Comment text cannot be empty.' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO comments (AnimeID, UserID, comment_text) VALUES (?, ?, ?)',
            [animeId, userID, comment_text]
        );
        res.status(201).json({ success: true, message: 'Comment added.', commentId: result.insertId });
    } catch (err) {
        console.error('Error adding comment:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

const deleteComment = async (req, res) => {
    const { commentId } = req.params;
    try {
        const [result] = await db.query(
            'DELETE FROM comments WHERE CommentID = ?',
            [commentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Comment not found.' });
        }
        res.json({ success: true, message: 'Comment deleted.' });
    } catch (err) {
        console.error('Error deleting comment:', err);
        res.status(500).json({ error: 'Database error' });
    }
};

module.exports = {
    getComments,
    postComment,
    deleteComment,
};