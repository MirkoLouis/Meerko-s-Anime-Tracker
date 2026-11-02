const mysql = require('mysql2');
const dotenv = require('dotenv');

// Load environment variables from a .env file if not already loaded
dotenv.config({ path: './.env'});

// Function to create and return a new MySQL connection pool.
// This is used to handle database connections efficiently, especially for concurrent requests.
function createDbConnection() {
    return mysql.createPool({
        connectionLimit: 50,
        // DB_-prefixed names avoid clashing with the shell's own USER/HOST variables,
        // which dotenv would otherwise refuse to override.
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
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
        console.log('Database query from config/database.js successful:', rows);
    } catch (error) {
        console.error('Error during query:', error);
    }
}

testDbConnection();

module.exports = db;