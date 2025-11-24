const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

//Connect to the Database
//const db = mysql.createConnection({
//    host: process.env.HOST,
//    user: process.env.USER,
//    password: process.env.PASSWORD,
//    database: process.env.DATABASE
//});

//Connect to the Database ver2
// Function to create and return a new MySQL connection pool.
// This is used to handle database connections efficiently, especially for concurrent requests.
function createDbConnection() {
    return mysql.createPool({
        connectionLimit: 50,
        host: process.env.HOST,
        user: process.env.USER,
        password: process.env.PASSWORD,
        database: process.env.DATABASE
    }).promise();
}

let db = createDbConnection();

// MySQL Connection Error Handler
// This event listener attempts to re-establish a database connection if the current one is lost or encounters a fatal error.
// It logs the error, closes the existing pool, and retries connection after a delay.
db.on('error', (err) => {
    console.error('MySQL connection error:', err);

    if (err.code === 'PROTOCOL_CONNECTION_LOST' || err.fatal) {
        console.warn('Reconnecting to the database...');

        // Close the previous connection pool before attempting reconnection
        db.end(() => {
            console.log('Previous connection pool closed.');
            // Retry every 5 seconds
            setTimeout(() => {
                db = createDbConnection();
                console.log('Reconnected to the database!');
            }, 5000);
        });
    } else {
        console.error('Unexpected MySQL error:', err);
    }
});

// Database Connection Tester
// Database Connection Tester
// This asynchronous function attempts a simple query to the database to verify the connection's health.
// It logs success or any errors encountered during the test query.
async function testDbConnection() {
    try {
        const [rows] = await db.query('SELECT 1');
        console.log('Database query from auth.js successful:', rows);
    } catch (error) {
        console.error('Error during query:', error);
    }
}

testDbConnection();

// Prevent login/register access if already logged in
// Middleware to prevent authenticated users from accessing login/register pages.
// If a valid JWT is found in the cookies, the user is redirected to the dashboard.
exports.redirectIfLoggedIn = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) return next(); // If no token is found user is redirected to login page

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return next(); // If token is invalid or expired move to the next middleware
        }

        // If token is valid redirect user
        return res.redirect('/dashboard');
    });
};

// Makes non logged in users and users with no token or invalid not be able to access the dashboard
// Middleware to protect routes, ensuring only authenticated users can access them.
// It checks for a valid JWT in the cookies. If invalid or missing, it redirects to login or sends an error for API calls.
exports.requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        if (req.originalUrl.startsWith('/api')) {
            return res.status(401).json({ error: 'You need to login to use this feature.' });
        }
        return res.redirect('/login');
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            if (req.originalUrl.startsWith('/api')) {
                return res.status(401).json({ error: 'Invalid or expired token. Please login again.' });
            }
            return res.redirect('/login');
        }

        req.user = decoded;
        next();
    });
};

// Middleware to verify the JWT and attach the decoded user payload to the request object.
// This is typically used for API routes that require user authentication but might not redirect.
exports.verifyUser = (req, res, next) => {
    const token = req.cookies.jwt;

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
    }
};

// Register Logic
// Handles user registration.
// Validates input, checks for existing users, hashes the password, inserts the new user into the database,
// generates a JWT, sets it as a cookie, and redirects to the dashboard.
exports.register = async (req, res) => {
    console.log("- Registration Attempt -");
    console.log(req.body);

    const { username, email, displayname, password, passwordConfirm } = req.body;

    if (password !== passwordConfirm) {
        return res.render('register', { message: 'Passwords do not match.' });
    }

    try {
        const [results] = await db.query(
            'SELECT username, email, display_name FROM user WHERE username = ? OR email = ? OR display_name = ?',
            [username, email, displayname]
        );

        const existingUsernames = results.map(row => row.username);
        const existingEmails = results.map(row => row.email);
        const existingDisplayNames = results.map(row => row.display_name);

        if (existingEmails.includes(email)) {
            return res.render('register', { message: 'That Email is already in use.' });
        } else if (existingUsernames.includes(username)) {
            return res.render('register', { message: 'That Username is already in use.' });
        } else if (existingDisplayNames.includes(displayname)) {
            return res.render('register', { message: 'That Display Name is already in use.' });
        }

        const hashedPassword = await bcrypt.hash(password, 8);

        const [insertResult] = await db.query(
            'INSERT INTO user SET ?',
            { username, userpassword: hashedPassword, display_name: displayname, email, first_login: null }
        );

        const userId = insertResult.insertId;

        const token = jwt.sign({ id: userId, username, display_name: displayname }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.cookie('jwt', token, {
            httpOnly: true,
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000)
        });

        console.log('- New User Registered and Logged In -');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Registration error:', error);
        res.render('register', { message: 'An error occurred while registering. Please try again.' });
    }
};

// Login Logic
// Handles user login.
// Validates credentials, compares the password with the stored hash, generates a JWT,
// sets it as a cookie, updates login timestamps, and redirects to the dashboard.
exports.login = async (req, res) => {
    console.log("- Login Attempt -");
    console.log(req.body);

    const { username, password } = req.body;

    if (!username || !password) {
        return res.render('login', { message: 'Please enter your username and password.' });
    }

    try {
        const [results] = await db.query('SELECT * FROM user WHERE username = ?', [username]);

        if (results.length === 0) {
            return res.render('login', { message: 'Invalid username or password.' });
        }

        const user = results[0];

        if (!user.first_login) {
            await db.query('UPDATE user SET first_login = NOW() WHERE username = ?', [username]);
        } else {
            await db.query('UPDATE user SET last_login = NOW() WHERE username = ?', [username]);
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.userpassword);

        if (!isPasswordCorrect) {
            return res.render('login', { message: 'Invalid username or password.' });
        }

        const token = jwt.sign({ id: user.UserID, username: user.username, display_name: user.display_name }, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN
        });

        res.cookie('jwt', token, {
            httpOnly: true,
            expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000)
        });

        console.log('- Login Successful -');
        res.redirect('/dashboard');
    } catch (error) {
        console.error('Login error:', error);
        res.render('login', { message: 'Something went wrong. Please try again.' });
    }
};

// Handles user logout.
// Clears the JWT cookie and redirects the user to the homepage.
exports.logout = (req, res) => {
    console.log('- User Logout Attempt -');
    res.cookie('jwt', '', {
        expires: new Date(0),
        httpOnly: true
    });
    console.log('- User Logged Out -');
    res.redirect('/');
};
