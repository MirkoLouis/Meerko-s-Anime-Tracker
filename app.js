// Import required modules
const express = require('express');
const path = require('path');

const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const morgan = require('morgan');
const crypto = require('crypto');

// Initialize the Express application
const app = express();
// Disable the X-Powered-By header for security purposes.
app.disable('x-powered-by');

// Parse cookies from incoming requests
app.use(cookieParser());
// Compress HTTP responses for better performance
app.use(compression());
// Log HTTP requests to the console for debugging
app.use(morgan('dev')); 

// Middleware to set various security headers to enhance application security.
app.use((req, res, next) => {
    // Generate a nonce for each request
    res.locals.cspNonce = crypto.randomBytes(16).toString("hex");

    // Content Security Policy (CSP) to prevent XSS and data injection attacks.
    res.setHeader("Content-Security-Policy", 
        "default-src 'self'; " +
        `script-src 'self' https://code.jquery.com https://cdn.jsdelivr.net https://unpkg.com 'nonce-${res.locals.cspNonce}'; ` +
        "style-src 'self' https://cdn.jsdelivr.net https://unpkg.com 'unsafe-inline'; " +
        "img-src 'self' data: https://cdn.myanimelist.net; " +
        "connect-src 'self' https://unpkg.com https://cdn.jsdelivr.net; " +
        "font-src 'self' https://cdn.jsdelivr.net; " +
        "frame-ancestors 'self'; " +
        "form-action 'self';"
    );
    // Prevents MIME-type sniffing.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Provides clickjacking protection for older browsers.
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    next();
});

// Custom middleware for logging incoming requests with a timestamp
app.use((req, res, next) => {
    const time = new Date().toISOString();
    const userAgent = req.headers['user-agent'];
    console.log(`[${time}] ${req.method} ${req.url} [User-Agent: ${userAgent}]`);
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

const db = require('./config/database');

// Serve static files (CSS, client-side JS, images) from the 'public' directory
const publicDirectory = path.join(__dirname, './public')
console.log(__dirname);
app.use(express.static(publicDirectory, {maxAge: '1d' }));

// Parse URL-encoded bodies (as sent by HTML forms)
app.use(express.urlencoded({extended:false}));
// Parse JSON bodies (as sent by API clients)
app.use(express.json());

// Set Handlebars (hbs) as the template engine for rendering views
const hbs = require('hbs');
hbs.registerHelper('json', function(context) {
    return JSON.stringify(context);
});
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
const { requireAuth, ensureAdmin } = require('./controllers/auth');
const commentService = require('./services/commentService');

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
app.use('/', require('./routes/anime'));
app.use('/api/user', require('./routes/user'));
app.use('/api', require('./routes/comment'));

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



// Anime Details Page Route
app.get('/anime/:animeId', (req, res) => {
    res.render('anime_details', {
        user: req.jwt || null
    });
});


