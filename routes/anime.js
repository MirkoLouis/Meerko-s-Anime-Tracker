const express = require('express');
const router = express.Router();
const animeController = require('../controllers/animeController');

// Anime routes
router.get('/focusanime/:animeId', animeController.getFocusAnime);
router.get('/search', animeController.searchAnime);
router.get('/anime/animespotlight-animes', animeController.getAnimeSpotlight);
router.get('/anime/new-animes', animeController.getNewAnimes);
router.get('/anime/upcoming-animes', animeController.getUpcomingAnimes);
router.get('/anime/recommended-animes', animeController.getRecommendedAnimes);
router.get('/anime/random-animes', animeController.getRandomAnimes);
router.get('/anime/all-animes', animeController.getAllAnimes);
router.get('/anime/all-tags', animeController.getAllTags);
router.get('/anime/mostwatchlist-animes', animeController.getMostWatchlistedAnimes);

module.exports = router;