const express = require('express');

const router = express.Router();

// Route to render the homepage.
router.get('/', (req, res) => {
    res.render('index');
});

// Route to render the anime details page.
router.get('/anime/:animeId', (req, res) => {
    res.render('anime_details');
});

//router.get('/login', (req, res) => {
//    res.render('login');
//});

//router.get('/register', (req, res) => {
//    res.render('register');
//});

//router.get('/dashboard', (req, res) => {
//    res.render('dashboard');
//});

//router.get('/logout', (req, res) => {
    // Clear the JWT cookie
//    res.clearCookie('token'); // Replace 'token' if your cookie has a different name
//    res.redirect('/');   // Redirect to login or homepage
//});

module.exports = router;
