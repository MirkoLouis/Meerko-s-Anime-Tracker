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

### Comments and Moderation
- **User Comments:** Logged-in users can post comments on individual anime pages.
- **Guest Viewing:** Guest users can view comments but are prompted to log in to post.
- **Admin Moderation:** Users with an 'admin' role have the ability to delete any comment, ensuring a safe and respectful community environment.

### Personalized Dashboard
- **User-Specific Spotlight:** The dashboard displays a personalized spotlight of anime recommendations based on the user's watchlist and viewing history.
- **Watchlist Overview:** The dashboard provides a quick overview of the user's watchlist.

## Data Flow

The application follows a modern client-server architecture, with a clear separation between the backend and frontend.

### Backend (API & Database)
1.  **Database:** A MySQL database stores all the application data, including user information, anime details, watchlist entries, and comments.
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
4.  **Set up the database:**
    You have two main paths to set up and populate the database:

    #### Path A: Manual SQL Execution (Recommended for most users)

    This path is for users who want to use the pre-generated SQL files to populate the database.

    1.  **Create the database schema:**
        Run the following command to create the database and all the necessary tables.
        ```bash
        mysql -u your_database_user -p your_database_name < "auto insert to db/database_creation.sql"
        ```

    2.  **Insert initial data:**
        Execute the following SQL files in order to populate the database with initial data for studios, tags, animes, users, and watchlists.
        ```bash
        mysql -u your_database_user -p your_database_name < "auto insert to db/inserts_studios.sql"
        mysql -u your_database_user -p your_database_name < "auto insert to db/insert_tags.sql"
        mysql -u your_database_user -p your_database_name < "auto insert to db/anime_insert_15192.sql" 
        mysql -u your_database_user -p your_database_name < "auto insert to db/update_spotlight_anime.sql"
        mysql -u your_database_user -p your_database_name < "auto insert to db/insert_users.sql"
        mysql -u your_database_user -p your_database_name < "auto insert to db/insert_watchlists.sql"
        mysql -u your_database_user -p your_database_name < "auto insert to db/insert_comments.sql"
        ```
        **Note:**
        - `anime_insert_15192.sql` contains over 15,000 anime entries. For a smaller dataset, you can use `Dump20250513.sql` which contains around 1,000 animes, but be aware that it might not be up-to-date with the latest schema changes.
        - `insert_users.sql` contains sample users. The password for all users is `123`. You can modify this file to add your own users and assign roles. `mirkolouis` is pre-configured as an admin.
        - `insert_watchlists` is optional but recommended to populate the "Most Watchlisted Animes" section.
        - `insert_comments.sql` is optional but recommended for populating the comments section with sample data.

    #### Path B: Full Data Seeding from Scratch (Developer)

    This path is for developers who want to generate the entire dataset from scratch using the Python seeding scripts. This gives you the most control over the data but is also the most time-consuming.

    **Important:** Before running these scripts, it is highly recommended to delete any previously generated SQL files (e.g., `insert_studios.sql`, `insert_tags.sql`, `studio_map.txt`, `tag_map.txt`, `insert_anime_*.sql`) in the `auto insert to db` directory to avoid conflicts or outdated data.

    1.  **Install Python dependencies:**
        Navigate to the `auto insert to db` directory and install the required Python libraries.
        ```bash
        cd "auto insert to db"
        pip install -r requirements.txt
        cd ..
        ```

    2.  **Generate Studio and Tag SQL files:**
        These scripts fetch data from the Jikan API and generate the base SQL insert files.
        - `studiocatcher2.py`: Fetches studio data and generates `insert_studios.sql`.
        - `tagcatcher.py`: Fetches tag data and generates `insert_tags.sql`.

        Run them in your terminal:
        ```bash
        python "auto insert to db/studiocatcher2.py"
        python "auto insert to db/tagcatcher.py"
        ```
        **Note:** `studiocatcher2.py` can take 10-15 minutes to finish as it fetches a large amount of data from the Jikan API.

    3.  **Generate Studio and Tag Map files (Optional but Recommended for speed):**
        These scripts parse the generated SQL files to create Python map files (`.txt` files) that `autoinsert3.py` can load directly, avoiding re-parsing the SQL.
        - `studiomapcreator2.py`: Generates `studio_map.txt` from `insert_studios.sql`.
        - `tagmapcreator.py`: Generates `tag_map.txt` from `insert_tags.sql`.

        Run them in your terminal:
        ```bash
        python "auto insert to db/studiomapcreator2.py"
        python "auto insert to db/tagmapcreator.py"
        ```

    4.  **Run the main anime auto-inserter script:**
        `autoinsert3.py` is the main script that fetches anime data, processes it, and generates the final `insert_anime_{count}.sql` file. It uses the studio and tag maps (preferring `.txt` files, falling back to parsing `.sql` files) to correctly assign IDs.

        Run the script:
        ```bash
        python "auto insert to db/autoinsert3.py"
        ```
        **Note:** This script can take around 20-30 minutes to finish, depending on the number of pages in the Jikan API.

    5.  **Execute the generated SQL files:**
        After running the Python scripts, you will have a set of `.sql` files in the `auto insert to db` directory. You can then execute them as described in "Path A" to populate your database.

5.  **Start the server:**
    ```bash
    npm start
    ```
    The application will be running at `http://localhost:3000`.
