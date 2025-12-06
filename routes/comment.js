const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');
const { requireAuth, ensureAdmin } = require('../controllers/auth');

router.get('/anime/:animeId/comments', commentController.getComments);
router.post('/anime/:animeId/comments', requireAuth, commentController.postComment);
router.delete('/comments/:commentId', requireAuth, ensureAdmin, commentController.deleteComment);

module.exports = router;