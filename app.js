// Import required modules
const express = require('express');
const path = require('path');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');

// Load environment variables from a .env file
dotenv.config({ path: './.env'})

// Initialize the Express application
const app = express();
// Enable Cross-Origin Resource Sharing (CORS)
app.use(cors());
// Parse cookies from incoming requests
app.use(cookieParser());
// Compress HTTP responses for better performance
app.use(compression());
// Log HTTP requests to the console
app.use(morgan('dev')); // or 'combined' for even more detailed logs

// Custom middleware for logging incoming requests with a timestamp
app.use((req, res, next) => {
    const time = new Date().toISOString();
    console.log(`[${time}] ${req.method} ${req.url}`);
    next();
});

//Connect to the Database
//const db = mysql.createPool({
//    connectionLimit: 50,
//    host: process.env.HOST,
//    user: process.env.USER,
//    password: process.env.PASSWORD,
//    database: process.env.DATABASE
//}).promise();

//Error Checker for Database Connection
//db.connect( (error) => {
//    if(error) {
//        console.log(error)
//    } else {
//        console.log("MYSQL Database Connected...")
//    }
//})

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
// This asynchronous function attempts a simple query to the database to verify the connection's health.
// It logs success or any errors encountered during the test query.
async function testDbConnection() {
    try {
        const [rows] = await db.query('SELECT 1');
        console.log('Database query from app.js successful:', rows);
    } catch (error) {
        console.error('Error during query:', error);
    }
}

testDbConnection();

// Serve static files (CSS, client-side JS, images) from the 'public' directory
const publicDirectory = path.join(__dirname, './public')
console.log(__dirname);
app.use(express.static(publicDirectory, {maxAge: '1d' }));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({extended:false}));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Set Handlebars (hbs) as the template engine for rendering views
app.set('view engine', 'hbs');

// Favicon Server
// Serves the application's favicon and sets appropriate caching headers.
const fs = require('fs'); 
const favicon = fs.readFileSync(__dirname+'/public/favicon.png');
//const favicon = new Buffer.from('iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAACxEAAAsRAX9kX5EAAAUhSURBVFhHxVbtU5RVFH9qdibAwWBxKmGGkbeRl/VTBCloBWjs7rOwb8TswO6y7O7zrNWf0DjIMM2UiL0IWkJqKuCumk5hfSjzWzMyFRWIgZIJKpVY5gtGE7/m3GWXffbZN/tgd+Y3c+8595z7e+5z7jmH4zjukf8ZMsHDRnDyaARlOBId4XaxIBNEwvJYuUXJZdW9oFjDi0kF/GsERS7v4bJ1VVxmdYZkr9xPJMgE4WAjqaBu0yqV/kjpZuNvNrcF7W12dHc5GNq322F3W1C62XgjQ1Xfn5TPP/cAJGQCiTKl8MXVSlX9QK25Ef37nJg9JwCXROCKB5heAs0viUzX3+uE2twIpapuMHltTWYCJGSCoCI1v/bZnHL99Ns7HJg/LwAzHmBSBMYFLJ6XgmRMN+PB/XEB73Q6kFtumEkt5NfHISETMOHKAm1ZYaXh9udeJ3DVA0yIskOjgfaSzRdeJ4o2Gu/Qh8QgIResyDU8kVNWf/2M1wVcE4EIh8QD2ZDtl14X1pTpZ1eodE9GISEXpBXxvt07HMBVEfhRYAg/IB4CduSju7MVaUX88UQIcIo8zQYKuAVyMing92EX7o24/cF2QX5QOGgP7SUbsiUff48LUDc0QpGrq4hAQrpQFvNHj+5zAjMi8JOIU/ttqFAb8GFPMxYnBH/ERwtC0k0IOLSnmdmc/MAGXKbAFOHrdSK9hPfFIsBxj2vTS6v0f8zRU5sUsDgu4P6YAF+fFRs1BqjNJgwdtmF+zM10QQLjAubHBJw+YoPGbEKl2gBvr5XJSEe+bg4LKK3W32KJTEoihECWuqrFbfG/czK8LOL0QRvMVjMarWZkqHRIzufxEX3Zz8uvguYn99uQks9DWaLDS1Yzsxk6sHQDtGdKhEOwgMvW1kQloMjRvNzRZgeuLDkPu4FakwkfH7JhfjTCDYy68clhG7ul8BtgJK+IeH27HYoc/pWoBJLyNdt6uhzAtJ8AsT91wIaKWgMOdjfjH4rqODFAcULxQjaBGGD6aRF7dzmQnKdtS5jA4gUBN8+5cPfbB38FZEO25ENCoCAGAdkvCDj8r3kghDD7Be30C7SvRiUgCcJwp2MCcFFkOpqz9ZTIZME12VHKpnUomaUgbI0XhPQMn67W3wo+w1ACkwJGP3Pgh08dQSJfnWjByJDDf/BFkekun3WyOJAQCDzDGv2fsZ4hWyhLeK+315+IQr+E/mH3G00wWszArx5g1gO1yQRbawNwYytwzYMtBiN871klT5TZzog41keJSBczEbGFIlddQfV8gaI65EtoPve1iyUau7MBVkcDDBYz6hpNaHU3wGIzw9Rkxu3v3ZKYITtKxRqWivnKeASYIK1Ie4wKCBWS4JcsxcCtb9zY29mE97uasDAq4M6IGz1vNqHvrWbc+87NegLJzV0T0bOzFenF/IkIh0cmQKUzp1x/nUqppBwTCar1lAsIgYoXsg4cHijHZ30u5JbpZ1OKNU8lSoAJUws05dRMUFPhb0ikgRULtJdi4ozPheJNxrtxuiKZYJlEIb+e2qp3Ox2szUq0JftrXMDunawlu5q6VrMhxuExCTAlNZbUYFI9H+h14pfhKE3plMh0g31OFnDKdfXe5AJtVpzD4xJgG2hQq52hqh+g1rtFsKBjux17drUydLTb0SJa8Mxm41zGurrBx/K0zwfsIvgLh0wQCcsjU5/BZfPVihzd1qR8fhuB5iTjVvOrJHvlfiJBJoiFREe4XSzIBA8bMsFDxb+JP5qjtp1SzgAAAABJRU5ErkJggg==', 'base64'); 
app.get("/favicon.ico", function(req, res) {
    console.log("Serving favicon...");
    res.statusCode = 200;
    res.setHeader('Content-Length', favicon.length);
    res.setHeader('Content-Type', 'image/x-icon');
    res.setHeader("Cache-Control", "public, max-age=2592000");
    res.setHeader("Expires", new Date(Date.now() + 2592000000).toUTCString());
    res.end(favicon);
});

// JWT Authentication Middleware
// This middleware checks for a JWT in incoming requests (from cookies or Authorization header).
// If a valid token is found, it verifies it and attaches the decoded payload to the request object.
const jwt = require('jsonwebtoken');
const { requireAuth } = require('./controllers/auth');

app.use((req, res, next) => {
    const token = req.cookies.jwt || req.headers['authorization']?.split(' ')[1]; // Check cookie or Bearer token

    if (!token) return next(); // If no token, proceed to the next middleware or route

    // Verify the token
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log("JWT verification failed:", err.message);
            return next(); // If verification fails, proceed without setting the user
        }

        req.jwt = decoded; // Attach decoded user to request
        if (process.env.JWT_DEBUG_MODE === 'true') {
            console.log("✅ JWT verified:", decoded);
        }
        next(); // Continue to the next middleware or route
    });
});

// Protected Route for the Dashboard
// This route is protected by the `requireAuth` middleware, ensuring only authenticated users can access it.
// It renders the dashboard view, passing user data from the decoded JWT.
app.get('/dashboard', requireAuth,(req, res) => {
    const userID = req.user.id;
    console.log("Current Logged-In User ID:", userID);
    if (!req.jwt) {
        return res.redirect('/login');
    }

    console.log("JWT payload on dashboard route:", req.jwt);
    res.render('dashboard', {
        user: req.jwt,
        display_name: req.jwt.display_name
    });
});

//Strict Auth
//app.use((req, res, next) => {
//    const token = req.headers['authorization'] || req.cookies.jwt; // Or wherever you store the token
//    if (token) {
//      // Logic to decode and verify JWT (using a library like `jsonwebtoken`)
//      jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
//        if (err) {
//          return res.status(401).send('Unauthorized');
//        }
//        req.jwt = decoded; // Store the decoded JWT in the request
//        next();
//      });
//    } else {
//      next();
//    }
//});

// Route Declarations
// Mounts the authentication routes (login, register, etc.) on both the root ('/') and '/auth' paths.
app.use('/', require('./routes/auth'));
app.use('/auth', require('./routes/auth'));

// Start the server
// Binds the application to port 3000 and listens for incoming connections.
app.listen(3000, '0.0.0.0', () => {
    console.log("Server started on Port 3000");
})

// Homepage Route
// Renders the index (homepage) view, passing the decoded JWT payload if the user is authenticated.
app.get('/', (req, res) => {
    res.render('index', {
        user: req.jwt || null
    });
    console.log('JWT on home page:', req.jwt);
});

// Debugger for routes
//app.use((req, res, next) => {
//    console.log(`${req.method} ${req.url}`);
//    next();
//});

// API Endpoint for Anime Search
// Handles complex search queries with filtering by title, tags, studio, and rating.
// It supports pagination and returns search results in JSON format.
app.get('/search', async (req, res) => {
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
});

// API Endpoint for Anime Spotlight
// Fetches a list of top-rated animes to be featured in the main spotlight section.
app.get('/anime/animespotlight-animes', async (req, res) => {
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
});

// API Endpoint for New Animes
// Fetches a list of currently airing animes, ordered by their start date.
app.get('/anime/new-animes', async (req, res) => {
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
});

// API Endpoint for Upcoming Animes
// Fetches a list of animes that are scheduled to be released in the future.
app.get('/anime/upcoming-animes', async (req, res) => {
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
});

// API Endpoint for Recommended Animes
// Fetches a list of highly-rated animes to be displayed as recommendations.
app.get('/anime/recommended-animes', async (req, res) => {
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
});

// API Endpoint for Random Animes
// Fetches a random selection of animes, allowing users to discover new series.
app.get('/anime/random-animes', async (req, res) => {
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
});

// API Endpoint for All Animes
// Fetches a complete list of all animes in the database.
app.get('/anime/all-animes', async (req, res) => {
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
});

// API Endpoint for All Tags
// Fetches a list of all unique anime tags, used for populating filter options.
app.get('/anime/all-tags', async (req, res) => {
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
});

// API Endpoint for Most Watchlisted Animes
// Fetches a list of animes that appear in the most user watchlists, indicating popularity.
app.get('/anime/mostwatchlist-animes', async (req, res) => {
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
});

// API Endpoint for User-Specific Spotlight Recommendations
// Provides personalized anime recommendations for the logged-in user based on their watchlist and tag preferences.
// Includes fallback logic for new users or when recommendations cannot be generated.
app.get('/api/user/spotlight', requireAuth, async (req, res) => {
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
});

// API Endpoint for User's Watchlist Data
// Fetches the logged-in user's watchlist, including animes with "Plan to Watch" or "Watching" status.
app.get('/api/user/watchlist', requireAuth, async (req, res) => {
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
});

// API Endpoint for User's Completed Watchlist Data
// Fetches animes from the logged-in user's watchlist that are marked as "Completed".
app.get('/api/user/watchlist/completed', requireAuth, async (req, res) => {
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
});

// API Endpoint for Adding an Anime to the User's Watchlist
// Handles POST requests to add a new anime to the logged-in user's watchlist,
// with validation for required fields and checks for duplicates.
app.post('/api/user/watchlist', requireAuth, async (req, res) => {
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
});

// API Endpoint for Updating Watchlist Anime Status
// Handles PUT requests to change the status of an anime in the user's watchlist (e.g., from "Watching" to "Completed").
app.put('/api/user/watchlist/:animeId', requireAuth, async (req, res) => {
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
});

// API Endpoint for Deleting an Anime from the Watchlist
// Handles DELETE requests to remove an anime from the logged-in user's watchlist.
app.delete('/api/user/watchlist/:animeId', requireAuth, async (req, res) => {
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
});
