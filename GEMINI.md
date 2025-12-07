# Meerko's Anime Tracker - `GEMINI.md`

This document provides a comprehensive overview of the Meerko's Anime Tracker project, intended as instructional context for AI-assisted development.

## Project Overview

Meerko's Anime Tracker is a full-stack web application designed for anime enthusiasts. It allows users to track, rate, and discover anime series. The application is built on a standard Node.js backend with a dynamic, server-rendered frontend.

-   **Backend**: The backend is built with **Node.js** and the **Express.js** framework. It serves as a RESTful API to handle data operations and user authentication.
-   **Frontend**: The frontend uses **Handlebars.js (hbs)** for server-side templating, with vanilla **JavaScript** for client-side interactivity. The UI is styled with **Bootstrap** and custom CSS.
-   **Database**: A **MySQL** database is used for data persistence, storing information about users, anime, watchlists, and comments.
-   **Authentication**: User authentication is managed using **JSON Web Tokens (JWT)**, which are stored in browser cookies.
-   **Architecture**: The application follows a traditional Model-View-Controller (MVC) pattern, with a clear separation of concerns:
    -   `app.js`: The main application entry point, responsible for setting up middleware, routes, and starting the server.
    -   `routes/`: Defines the API and page-rendering routes.
    -   `controllers/`: Contains the business logic for handling requests.
    -   `views/`: Holds the Handlebars templates for the UI.
    -   `public/`: Serves static assets like client-side JavaScript, CSS, and images.
    -   `config/`: Manages configuration, such as the database connection.

## Building and Running

### 1. Prerequisites
-   Node.js and npm installed.
-   MySQL server running.
-   Python (optional, for data seeding scripts).

### 2. Setup
1.  **Install Node.js dependencies:**
    ```bash
    npm install
    ```
2.  **Configure Environment:**
    Create a `.env` file in the project root and populate it with your database credentials and a JWT secret, following the example in `README.md`.
3.  **Database Setup:**
    The database schema and initial data can be populated by running the SQL scripts located in the `auto insert to db/` directory. Execute `database_creation.sql` first, followed by the various `insert_*.sql` files. See `README.md` for detailed instructions.

### 3. Running the Application
-   **Start the server with auto-reloading (for development):**
    ```bash
    npm start
    ```
    This command uses `nodemon` to automatically restart the server when file changes are detected.

-   **Access the application:**
    The application will be available at `http://localhost:3000`.

### 4. Testing
-   There are currently no automated tests configured for this project. The `test` script in `package.json` is a placeholder.

## Development Conventions

-   **Security**: The application uses a **Content Security Policy (CSP)** to mitigate XSS attacks. All client-side scripts are externalized, and inline scripts required for passing server-side data to the client (like user information) use a **nonce**.
-   **Code Structure**: Logic is separated into `controllers`, `routes`, and `services`. Client-side JavaScript is organized by feature (e.g., `search.js`, `carousels.js`, `comments.js`).
-   **Dependencies**: Backend dependencies are managed via `package.json`. The `auto insert to db/` directory contains Python scripts with their own `requirements.txt` for data seeding.
-   **Logging**: The application uses two logging middlewares:
    1.  `morgan('dev')` for concise, colored request logs.
    2.  A custom middleware that logs the timestamp, method, URL, and User-Agent for each request.
-   **Error Handling**: The project could be improved by adding more robust centralized error handling middleware, but currently relies on `try...catch` blocks within controllers and database queries.
-   **Styling**: The UI is built with Bootstrap and enhanced with custom styles in `public/style.css`. It includes a dark mode theme, which is toggled on the client-side and saved to local storage.
