# Changelog

## 2025-11-24

- **DOCS:** Created `README.md` with a comprehensive overview of the project, including features, data flow, and technologies used.
- **DOCS:** Created `project_overview.md` with a high-level overview of the project's architecture, components, and future improvements.
- **DOCS:** Created `CHANGELOG.md` to track changes to the project.
- **DOCS:** Added comments to explain each code block in `controllers/auth.js`.
- **DOCS:** Added comments to explain each code block in `public/animefetcher.js`.
- **DOCS:** Added comments to explain each code block in `routes/auth.js`.
- **DOCS:** Added comments to explain each code block in `routes/pages.js`.
- **DOCS:** Added comments to explain each code block in `views/dashboard.hbs`.
- **DOCS:** Added comments to explain each code block in `views/index.hbs`.
- **DOCS:** Added comments to explain each code block in `views/login.hbs`.
- **DOCS:** Added comments to explain each code block in `views/register.hbs`.
- **DOCS:** Added comments to explain each code block in `views/search.hbs`.
- **DOCS:** Added comments to explain each code block in `app.js`.
- **DOCS:** Shortened the project description in `README.md` to a maximum of 350 characters.
- **BUILD:** Created `.gitignore` file to exclude unnecessary files and directories from version control.
- **DOCS:** Updated `README.md` and `project_overview.md` to include information about the database seeding scripts.
- **DOCS:** Updated `README.md` to include a detailed "Database Setup" section with multiple options for setting up the database.
- **DOCS:** Added comments to explain each code block in `auto insert to db/autoinsert2.py`.
- **DOCS:** Added comments to explain each code block in `auto insert to db/randomwatchlist.py`.
- **DOCS:** Added comments to explain each code block in `auto insert to db/studiocatcher.py`.
- **DOCS:** Added comments to explain each code block in `auto insert to db/studiomapcreator.py`.

## 2025-12-05

- **FIX:** Resolved issue where `/focusanime/:animeId` API endpoint was returning null values.
- **FEAT:** Implemented client-side logic in `public/animefetcher.js` to fetch and display anime details dynamically on the `/anime/:animeId` page.
- **FIX:** Registered Handlebars 'json' helper in `app.js` to resolve 'Missing helper: json' error on anime details page for logged-in users.
- **FIX:** Updated Content Security Policy (CSP) in `app.js` to allow connections to `https://unpkg.com`, resolving dashboard loading issues.
- **FEAT:** Implemented commenting system for anime pages.
    - Added `comments` table to `database_creation.sql`.
    - Added `role` column to `user` table in `database_creation.sql` for RBAC.
    - Updated `user_inserts.sql` to assign 'admin' role to 'mirkolouis' and 'user' role to others.
    - Implemented API endpoints for comments:
        - `GET /api/anime/:animeId/comments` (accessible to all users).
        - `POST /api/anime/:animeId/comments` (requires logged-in user).
        - `DELETE /api/comments/:commentId` (requires admin role).
    - Added `ensureAdmin` middleware in `controllers/auth.js` for RBAC.
    - Updated frontend (`views/anime_details.hbs` and `public/animefetcher.js`) to display comments, show conditional comment form (login prompt for guests), and enable admin-only comment deletion.
- **FEAT:** Improved layout of anime details page (`views/anime_details.hbs`).
    - Reduced banner height to 1/4 of its previous height.
    - Reorganized anime image and title to be closer using a flexbox layout.
- **FIX:** Added theme switching functionality to `views/anime_details.hbs`.
- **FEAT:** Made "View Details" button in spotlight the same size as "Add to Watchlist" button.
