const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const { redirectIfLoggedIn } = require('../controllers/auth');
const { requireAuth } = require('../controllers/auth');

// Route to render the login page.
// The `redirectIfLoggedIn` middleware prevents authenticated users from accessing this page.

router.get('/login', redirectIfLoggedIn, (req, res) => {
    res.render('login');
});

// Route to render the registration page.
// The `redirectIfLoggedIn` middleware prevents authenticated users from accessing this page.
router.get('/register', redirectIfLoggedIn, (req, res) => {
    res.render('register');
});

// Route to render the dashboard page.
// The `requireAuth` middleware ensures that only authenticated users can access this page.
router.get('/dashboard', requireAuth, (req, res) => {
    res.render('dashboard');
});

// Route to handle user registration form submission.
// The actual registration logic is handled by `authController.register`.
router.post('/register', authController.register )

// Route to handle user login form submission.
// The actual login logic is handled by `authController.login`.
router.post('/login', authController.login )

// Route to handle user logout.
// The actual logout logic is handled by `authController.logout`.
router.post('/logout', authController.logout )

module.exports = router;