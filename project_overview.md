# Project Overview

## 1. High-Level Goal

The primary goal of this project is to create a feature-rich, user-friendly web application for anime enthusiasts to track their favorite series. The application aims to provide a centralized platform for users to discover new animes, manage their watchlist, and get personalized recommendations.

## 2. Core Components

The application is built on a classic client-server architecture with a clear separation of concerns.

### 2.1. Backend
- **Technology Stack:** Node.js with the Express.js framework.
- **Responsibilities:**
    - **API Server:** Exposes a RESTful API to handle all data-related operations, including CRUD operations for comments.
    - **Service Layer:** Contains business logic and interacts with the database (e.g., `services/commentService.js`).
    - **Database Interaction:** Centralized database connection and pooling managed in `config/database.js`. Services communicate with the MySQL database to store and retrieve data.
    - **Authentication & Authorization:** Manages user authentication and authorization using JSON Web Tokens (JWT). Includes middleware to protect routes and implement Role-Based Access Control (e.g., ensuring only admins can delete comments).
    - **Routing:** Defines the application's routes and maps them to the appropriate controller logic.

### 2.2. Frontend
- **Technology Stack:** Standard HTML, CSS, and JavaScript, with Handlebars.js for server-side templating.
- **Responsibilities:**
    - **User Interface:** Renders the user interface and displays data fetched from the backend, including comments on anime pages.
    - **Client-Side Logic:** Handles all user interactions, such as form submissions, button clicks, and dynamic content updates for comments.
    - **API Consumption:** Makes AJAX calls to the backend API to fetch, create, and delete comments.
    - **Role-Based UI:** Dynamically displays UI elements, such as comment deletion buttons, based on the user's role.

### 2.3. Database
- **Technology:** MySQL relational database.
- **Responsibilities:**
    - **Data Persistence:** Stores all application data, including user accounts, anime information, studio details, tags, user watchlists, and comments.
    - **Data Integrity:** Enforces data integrity through a structured schema with relationships between tables. The `user` table includes a `role` column (`user` or `admin`) to support Role-Based Access Control.

### 2.4. Database Seeding
- **Technology:** Python with `aiohttp`, `tqdm` (dependencies listed in `auto insert to db/requirements.txt`).
- **Responsibilities:**
    - **Data Fetching:** The Python scripts in the `auto insert to db` directory are responsible for fetching large amounts of data from the public Jikan API asynchronously.
    - **Data Processing and Sanitization:** The scripts process the raw API data, sanitize it to prevent SQL injection and other errors, and format it into SQL `INSERT` statements.
    - **SQL Generation & Map Creation:**
        - `studiocatcher2.py`: Fetches studio data and generates `insert_studios.sql`.
        - `tagcatcher.py`: Fetches tag data and generates `insert_tags.sql`.
        - `studiomapcreator2.py`: Parses `insert_studios.sql` to create `studio_map.txt`.
        - `tagmapcreator.py`: Parses `insert_tags.sql` to create `tag_map.txt`.
        - `autoinsert3.py`: The main script that fetches anime data, processes it, and generates the final `insert_anime_{count}.sql`. It dynamically creates the studio and tag maps by loading from `.txt` files (if available) or parsing from `.sql` files, making the process more efficient.
    - **Sample Data Generation:**
        - `randomwatchlist.py` generates random watchlist data for users.
        - `randomcomments.py` generates random comments for a subset of animes.

## 3. Key Architectural Decisions

- **RESTful API:** The choice of a RESTful API on the backend allows for a decoupled architecture. This makes the application more scalable and easier to maintain. It also opens up the possibility of creating other clients (e.g., a mobile app) that can consume the same API.
- **JWT for Authentication:** Using JWTs for authentication is a modern and secure approach. It allows for stateless authentication, where the server does not need to store session information.
- **Client-Side Rendering:** A significant portion of the UI is rendered on the client-side using JavaScript. This approach enables a more dynamic and interactive user experience, as content can be updated without full page reloads.
- **Modular Structure:** The project is organized into distinct modules (`config`, `services`, `controllers`, `routes`, `views`, `public`), which improves code organization, separation of concerns, and maintainability.

## 4. Future Improvements

- **Frontend Framework:** To enhance the development process and create a more robust user interface, the frontend could be migrated to a modern JavaScript framework like React, Vue, or Svelte.
- **Recommendation Engine:** The current recommendation system could be improved by implementing a more sophisticated algorithm, such as collaborative filtering or content-based filtering.
- **Real-Time Features:** Adding real-time features, like notifications or live chat, could enhance user engagement. This could be achieved using technologies like WebSockets.
- **Testing:** Implementing a comprehensive testing strategy, including unit tests, integration tests, and end-to-end tests, would improve the application's reliability and stability.
- **Deployment & DevOps:** Setting up a CI/CD pipeline for automated testing and deployment would streamline the development workflow.
