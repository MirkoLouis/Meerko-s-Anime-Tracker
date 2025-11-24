# Meerko's Anime Tracker

## Description

Meerko's Anime Tracker is a web app for anime fans to track their favorite series. Users can create accounts, search, add anime to watchlists, and manage watching status. It offers a personalized experience with a user dashboard, recommendations, and a comprehensive search and filtering system.

## Features

### User Authentication
- **User Registration:** New users can create an account by providing a username, email, and password.
- **User Login:** Registered users can log in to access their personalized dashboard and watchlist.
- **Session Management:** The application uses JWT (JSON Web Tokens) for secure session management.

### Anime Discovery
- **Anime Spotlight:** The homepage features a rotating spotlight of highly-rated animes.
- **New & Upcoming:** Browse dedicated sections for newly released and upcoming anime series.
- **Recommendations:** Discover recommended animes based on ratings and popularity.
- **Most Watchlisted:** See which animes are most popular among other users.
- **Random Anime:** Get a random selection of animes to discover something new.
- **Comprehensive Search:** A powerful search functionality that allows users to search for anime by title.
- **Advanced Filtering:** Search results can be filtered by tags, studios, and ratings.

### Watchlist Management
- **Personalized Watchlist:** Each user has their own watchlist to keep track of animes they plan to watch or are currently watching.
- **Status Updates:** Users can update the status of an anime in their watchlist to "Watching", "Plan to Watch", or "Completed".
- **Completed List:** A separate section to view all the animes the user has completed.

### Personalized Dashboard
- **User-Specific Spotlight:** The dashboard displays a personalized spotlight of anime recommendations based on the user's watchlist and viewing history.
- **Watchlist Overview:** The dashboard provides a quick overview of the user's watchlist.

## Data Flow

The application follows a modern client-server architecture, with a clear separation between the backend and frontend.

### Backend (API & Database)
1.  **Database:** A MySQL database stores all the application data, including user information, anime details, and watchlist entries.
2.  **Node.js/Express Server:** The backend is built with Node.js and the Express framework. It acts as a RESTful API server.
3.  **API Endpoints:** The server exposes various API endpoints to handle user authentication, anime data retrieval, and watchlist management.
    -   `/auth` endpoints handle user registration, login, and logout.
    -   `/anime` endpoints provide data for the different anime sections on the site.
    -   `/api/user` endpoints manage user-specific data like watchlists and personalized recommendations.
4.  **Data Hydration:** When the frontend requests data, the backend queries the MySQL database, retrieves the necessary information, and sends it back to the frontend in JSON format.

### Frontend (Website)
1.  **Initial Page Load:** When a user visits the website, the Node.js server renders the initial HTML structure using the Handlebars templating engine.
2.  **Client-Side JavaScript:** The `public/animefetcher.js` script is loaded on the client-side. This script is responsible for all the dynamic functionality of the application.
3.  **AJAX Calls:** `animefetcher.js` makes asynchronous HTTP requests (AJAX calls) to the backend API endpoints to fetch anime and user data.
4.  **Dynamic Content Rendering:** Once the data is received from the backend, the JavaScript code dynamically generates HTML content (like anime cards, carousels, and watchlist items) and injects it into the DOM.
5.  **User Interaction:** User actions, such as searching for an anime, adding an item to the watchlist, or changing a status, trigger new AJAX calls to the backend. The backend processes the request, updates the database if necessary, and the frontend updates the UI to reflect the changes.

This data flow allows for a responsive and interactive user experience, as the page content can be updated without requiring a full page reload.

## Technologies Used

-   **Backend:** Node.js, Express.js
-   **Database:** MySQL
-   **Frontend:** HTML, CSS, JavaScript, Handlebars.js
-   **Authentication:** JSON Web Tokens (JWT), bcrypt.js
-   **Other Libraries:** `mysql2`, `dotenv`, `cookie-parser`, and others.

## Database Seeding Scripts

The `auto insert to db` directory contains several Python scripts to automatically populate the database with data from the Jikan API.

-   **`autoinsert2.py`:** Fetches anime data from the Jikan API, processes it, and generates SQL insert statements for the `Anime` and `Anime_Tags` tables.
-   **`randomwatchlist.py`:** Generates random watchlist entries for existing users to populate the `Watchlist` table with sample data.
-   **`studiocatcher.py`:** Fetches anime studio data, calculates a rating based on the frequency of their productions, and generates SQL insert statements for the `Studio` table.
-   **`studiomapcreator.py`:** A utility script that parses the generated `studio_inserts.sql` file to create a Python dictionary (`studio_map`) that maps studio names to their corresponding `StudioID`.
-   **`tagcatcher.py`:** Fetches all available anime genres and tags from the Jikan API and generates SQL insert statements for the `Tags` table.
-   **`tagmapcreator.py`:** A utility script that parses the generated `insert_tags.sql` file to create a Python dictionary (`tag_map`) that maps tag names to their corresponding `TagID`.

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/your-repo-name.git
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Create a `.env` file:**
    Create a `.env` file in the root directory and add the following environment variables:
    ```
    HOST=your_database_host
    USER=your_database_user
    PASSWORD=your_database_password
    DATABASE=your_database_name
    JWT_SECRET=your_jwt_secret
    JWT_EXPIRES_IN=90d
    JWT_COOKIE_EXPIRES=90
    ```
4.  **Start the server:**
    ```bash
    npm start
    ```
    The application will be running at `http://localhost:3000`.
