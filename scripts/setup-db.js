// Database setup script.
// Rebuilds the anime_tracker database from the SQL files in "auto insert to db",
// using the same .env connection settings as the app so both always target the same database.
//
// Usage:
//   npm run db:setup                     # schema + all seed data
//   npm run db:setup -- --skip-optional  # schema + required seed data only

const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const mysql = require('mysql2/promise');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SEED_DIRECTORY = path.join(PROJECT_ROOT, 'auto insert to db');

// database_creation.sql hardcodes this name (DROP/CREATE/USE), so .env must match it.
const EXPECTED_DATABASE_NAME = 'anime_tracker';

// The schema file runs first; it drops and recreates the database.
const SCHEMA_FILE = 'database_creation.sql';

// Seed files in dependency order (studios/tags before anime, users before watchlists/comments).
const SEED_FILES = [
    { name: 'insert_studios.sql', optional: false },
    { name: 'insert_tags.sql', optional: false },
    { name: 'anime_insert_15192.sql', optional: false },
    { name: 'update_spotlight_anime.sql', optional: false },
    { name: 'insert_users.sql', optional: false },
    { name: 'insert_watchlists.sql', optional: true },
    { name: 'insert_comments.sql', optional: true },
];

// Tables whose row counts are reported after a successful run.
const SUMMARY_TABLES = ['studio', 'tags', 'anime', 'anime_tags', 'user', 'watchlist', 'comments'];

// Environment variables the script needs to connect.
const REQUIRED_ENVIRONMENT_KEYS = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];

// Loads .env from the project root, regardless of the directory the script is run from.
function loadEnvironment() {
    require('dotenv').config({ path: path.join(PROJECT_ROOT, '.env') });
}

// Exits with a message if any required variable is missing or the database name is unexpected.
function validateEnvironment() {
    const missingKeys = REQUIRED_ENVIRONMENT_KEYS.filter((key) => !process.env[key]);

    // Stop early when the .env file is incomplete
    if (missingKeys.length > 0) {
        exitWithError(`Missing in .env: ${missingKeys.join(', ')}`);
    }

    // The schema file would create a different database than the one the app reads from
    if (process.env.DB_NAME !== EXPECTED_DATABASE_NAME) {
        exitWithError(
            `DB_NAME is "${process.env.DB_NAME}", but ${SCHEMA_FILE} creates "${EXPECTED_DATABASE_NAME}". ` +
            `Set DB_NAME=${EXPECTED_DATABASE_NAME} in .env.`
        );
    }
}

// Resolves a seed file name to an absolute path and verifies it stays inside the seed directory.
function resolveSeedFile(fileName) {
    const absolutePath = path.resolve(SEED_DIRECTORY, fileName);

    // Guard against a file name escaping the seed directory
    if (!absolutePath.startsWith(SEED_DIRECTORY + path.sep)) {
        exitWithError(`Refusing to read file outside the seed directory: ${fileName}`);
    }

    // Fail before touching the database if a file is missing
    if (!fs.existsSync(absolutePath)) {
        exitWithError(`SQL file not found: ${absolutePath}`);
    }

    return absolutePath;
}

// Builds the ordered list of absolute SQL file paths to run.
function buildFilePlan(skipOptional) {
    const seedNames = SEED_FILES
        .filter((seedFile) => !(skipOptional && seedFile.optional))
        .map((seedFile) => seedFile.name);

    return [SCHEMA_FILE, ...seedNames].map(resolveSeedFile);
}

// Shows the connection target and file plan, then asks the user to confirm the destructive rebuild.
async function confirmTarget(filePlan) {
    console.log('This will DROP and recreate the database:');
    console.log(`  host:     ${process.env.DB_HOST}`);
    console.log(`  user:     ${process.env.DB_USER}`);
    console.log(`  database: ${process.env.DB_NAME}`);
    console.log('Files to run, in order:');

    // List every file so the user can verify the plan
    for (const filePath of filePlan) {
        console.log(`  - ${path.basename(filePath)}`);
    }

    const prompt = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await prompt.question('Continue? [y/N] ');
    prompt.close();

    return answer.trim().toLowerCase() === 'y';
}

// Runs one SQL file over the shared connection and reports how long it took.
async function runSqlFile(connection, filePath) {
    const fileName = path.basename(filePath);
    const sqlText = fs.readFileSync(filePath, 'utf8');
    const startTime = Date.now();

    process.stdout.write(`Running ${fileName} ... `);

    try {
        await connection.query(sqlText);
    } catch (error) {
        console.log('FAILED');
        exitWithError(`${fileName}: ${error.sqlMessage || error.message}`);
    }

    console.log(`done (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
}

// Prints the row count of each application table.
async function printSummary(connection) {
    console.log('Row counts:');

    // Exact COUNT(*) per table; information_schema estimates are unreliable right after inserts
    for (const tableName of SUMMARY_TABLES) {
        const [rows] = await connection.query('SELECT COUNT(*) AS total FROM ??', [tableName]);
        console.log(`  ${tableName.padEnd(12)} ${rows[0].total}`);
    }
}

// Prints an error and terminates with a failing exit code.
function exitWithError(message) {
    console.error(`Error: ${message}`);
    process.exit(1);
}

// Entry point: validate, confirm, then run the schema and seed files in order.
async function main() {
    loadEnvironment();
    validateEnvironment();

    const skipOptional = process.argv.includes('--skip-optional');
    const filePlan = buildFilePlan(skipOptional);

    // Abort unless the user explicitly confirms
    if (!(await confirmTarget(filePlan))) {
        console.log('Aborted. Nothing was changed.');
        return;
    }

    // No database selected yet: the schema file creates it and switches to it with USE.
    // One connection is required so session variables (SET @anime_id = LAST_INSERT_ID()) carry across statements.
    let connection;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true,
        });
    } catch (error) {
        exitWithError(`Could not connect to MySQL: ${error.message}`);
    }

    try {
        const [schemaFile, ...seedFiles] = filePlan;
        await runSqlFile(connection, schemaFile);

        // Pin the connection to the configured database so seed files cannot land anywhere else
        await connection.changeUser({ database: process.env.DB_NAME });

        // Seed files run strictly in order; runSqlFile exits on the first failure
        for (const filePath of seedFiles) {
            await runSqlFile(connection, filePath);
        }

        await printSummary(connection);
        console.log('Database setup complete.');
    } finally {
        await connection.end();
    }
}

main();
