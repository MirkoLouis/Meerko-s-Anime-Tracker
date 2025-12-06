const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { requireAuth } = require('../controllers/auth');

// All these routes are prefixed with /api/user because of how they will be registered in app.js

router.get('/spotlight', requireAuth, userController.getUserSpotlight);
router.get('/watchlist', requireAuth, userController.getWatchlist);
router.get('/watchlist/completed', requireAuth, userController.getCompletedWatchlist);
router.post('/watchlist', requireAuth, userController.addToWatchlist);
router.put('/watchlist/:animeId', requireAuth, userController.updateWatchlistStatus);
router.delete('/watchlist/:animeId', requireAuth, userController.deleteFromWatchlist);

module.exports = router;