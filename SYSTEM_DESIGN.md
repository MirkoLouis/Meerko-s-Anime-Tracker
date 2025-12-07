Here is a comprehensive system architecture design for **Meerko's Anime Tracker**, designed to scale to 1 million daily active users and beyond.

### 1. Requirements Clarification

#### Functional Requirements
- **User Management**: User registration, login, and profile management (via JWT-based authentication).
- **Anime Discovery**: Search for anime by title, filter results by tags, studios, and ratings. Browse curated lists like "spotlight," "new," "upcoming," and "most watchlisted."
- **Watchlist Management**: Users can add/remove anime from their personal watchlist and update its status (e.g., "Watching," "Completed," "Plan to Watch").
- **Social Interaction**: Users can post and view comments on anime detail pages.
- **Admin Capabilities**: Admins can moderate content, such as deleting user comments.

#### Non-Functional Requirements
- **Performance**: P95 latency for API reads should be under 200ms. Page loads should feel instantaneous, with key content visible within 1.5 seconds.
- **Scalability**: The system must scale horizontally to support 1 million DAU and a peak traffic of ~1800 RPS.
- **Availability**: 99.9% uptime. The system should be resilient to single-component failures.
- **Reliability**: No data loss for user-profiles, watchlists, or comments.
- **Consistency**: Strong consistency for writes to user accounts and watchlists. Eventual consistency is acceptable for view counts or recommendations.
- **Security**: All traffic must be encrypted (HTTPS). The application must be protected against common web vulnerabilities (XSS, CSRF, SQLi). User passwords must be hashed.
- **Maintainability**: The system should be easy to deploy, monitor, and update.

#### Constraints
- **Technology**: The initial implementation is Node.js, Express, and MySQL. The design will build upon this foundation, suggesting production-grade alternatives where appropriate.
- **Budget**: The design will prioritize cost-effective, managed cloud services to reduce operational overhead.

### 2. Capacity Estimation

- **Traffic Estimates**
  - **Daily Active Users (DAU)**: 1,000,000
  - **Total Daily Requests**: 50,000,000
  - **Average RPS**: ~580 RPS
  - **Peak RPS (3x)**: ~1,740 RPS
- **Storage Estimates (5-Year Projection)**
  - **Database**: ~70-100 GB (User data, watchlists, comments, anime metadata).
  - **Object Storage**: ~500 GB (Assuming future support for user-uploaded images/avatars).
- **Bandwidth Estimates**: ~3.5 MB/s
- **Memory/Cache Estimates**: ~5-10 GB for Redis cache (caching hot anime data, sessions, etc.).

### 3. High-Level Architecture

The proposed architecture is a scalable, cloud-native system designed for high availability and performance.

#### Architecture Diagram (Text Format)
```
                    ┌────────────────┐
                    │     Client     │
                    │ (Web Browser)  │
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │      CDN       │
                    │ (CloudFront/S3)│
                    └───────┬────────┘
                            │
                    ┌───────▼────────┐
                    │ Load Balancer  │
                    │      (ALB)     │
                    └───────┬────────┘
            ┌───────────────┼───────────────┐
      ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
      │ Docker    │   │ Docker    │   │ Docker    │
      │ Container │   │ Container │   │ Container │
      │ [Node.js] │   │ [Node.js] │   │ [Node.js] │
      └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
            │               │               │
            └───────────┬───┴───────────────┘
                        │
      ┌─────────────────┼─────────────────┐
      │                 │                 │
┌─────▼─────┐     ┌─────▼─────┐     ┌─────▼─────┐
│   Cache   │     │  Message  │     │  Search   │
│  (Redis)  │     │   Queue   │     │(OpenSearch)│
└───────────┘     └─────┬─────┘     └───────────┘
                        │
            ┌───────────┴───────────┐
            │                       │
      ┌─────▼─────┐           ┌─────▼─────┐
      │  Primary  │◄──────────│   Read    │
      │ Database  ├──────────►│  Replica  │
      │  (Aurora) │           │ (Aurora)  │
      └───────────┘           └───────────┘
```

### 4. Component Design

- **CDN (AWS CloudFront)**: Serves all static assets (`.js`, `.css`, images) from an **S3 bucket**. This offloads traffic from the application servers and provides fast global delivery.
- **Load Balancer (AWS ALB)**: Distributes incoming API requests across the fleet of application servers using a round-robin strategy. It handles SSL termination and performs health checks on the servers.
- **Web/Application Servers (Node.js on AWS ECS/Fargate)**: The stateless Node.js/Express application will be containerized using Docker and run on a serverless container platform like Fargate. This allows for seamless horizontal auto-scaling based on CPU and memory usage, managed by ECS.
- **Caching Layer (AWS ElastiCache for Redis)**:
  - **What to cache**: User sessions, results of expensive DB queries (e.g., "most watchlisted animes"), anime details for popular shows, and rate-limiting counters.
  - **Strategy**: Primarily **Cache-aside (lazy loading)**. When a request for data comes, the application first checks Redis. If the data is not there, it queries the database, returns the data to the client, and asynchronously stores it in Redis for future requests.
- **Database (AWS Aurora - PostgreSQL compatible)**:
  - **Primary-Replica setup**: All write operations (user registration, adding to watchlist, posting comments) go to the Primary instance. All read operations (fetching anime details, user profiles, comments) are distributed across one or more Read Replicas. This significantly improves read performance and availability.
  - **Connection Pooling**: The Node.js application will use a connection pool to efficiently manage database connections.
- **Message Queue (AWS SQS)**: Used to decouple long-running or non-critical tasks from the main request/response cycle. For example, if a user gets a new recommendation, an event can be published to SQS, and a separate worker service can process it without blocking the user's API call.
- **Search (AWS OpenSearch)**: For advanced search capabilities beyond simple title matching (e.g., full-text search on synopsis), anime data can be indexed in OpenSearch. This provides a much faster and richer search experience than `LIKE` queries in SQL.

### 5. Data Flow

- **Read Flow (e.g., fetching an anime detail page):**
  1. Client requests the page. CDN serves static assets (JS/CSS).
  2. The client-side JS sends an API request for anime details to `/api/anime/:id`.
  3. The Load Balancer routes the request to an available Node.js server.
  4. The server checks the Redis cache for `anime:id`.
     - **Cache Hit**: The cached JSON is returned immediately to the client.
     - **Cache Miss**: The server queries a **Read Replica** of the database for the anime details, stores the result in Redis with a TTL (e.g., 1 hour), and then returns it to the client.
- **Write Flow (e.g., adding an anime to a watchlist):**
  1. Client sends a `POST` request to `/api/user/watchlist`.
  2. The Load Balancer routes it to a Node.js server.
  3. The server validates the request and user authentication.
  4. The server executes an `INSERT` command on the **Primary** database.
  5. The server invalidates any related cache keys in Redis (e.g., `user:id:watchlist`).
  6. A success response is returned to the client.

### 6. Scalability Strategy

- **Horizontal Scaling**: The primary strategy. The use of Docker containers on AWS Fargate allows the application to auto-scale by adding more container instances based on real-time traffic metrics (CPU/Memory).
- **Database Scaling**:
  - **Reads**: Add more Read Replicas to the Aurora cluster to handle increased read traffic.
  - **Writes**: If write-heavy, Aurora can scale vertically. For extreme scale, the database would be sharded by `UserID`.
- **Decoupling**: SQS allows background services to be scaled independently of the main web application.

### 7. Fault Tolerance & Reliability

- **Redundancy**:
  - The ALB runs across multiple Availability Zones (AZs).
  - ECS Fargate tasks are distributed across multiple AZs.
  - The Aurora database cluster runs with a primary and at least one replica in a different AZ.
- **Fault Tolerance**: If a Node.js container fails, the ALB health checks will detect it and stop sending traffic to it. ECS will automatically replace the failed container. If the primary database fails, Aurora will automatically promote a read replica to be the new primary.
- **Disaster Recovery**: Automated daily snapshots of the Aurora database are stored in S3, with cross-region replication enabled to recover from a regional outage.

### 8. Security Measures

- **Network**: The entire system runs within a VPC. The database and cache are in private subnets, only accessible by the application servers. Security Groups act as a firewall, only allowing traffic on specific ports from specific sources. AWS Shield is used for DDoS protection.
- **Application**:
  - **Authentication**: JWTs are used to authenticate every API request for protected resources.
  - **Authorization**: Logic in controllers checks user roles (e.g., admin) and ownership (e.g., a user can only modify their own watchlist).
  - **Web Security**: The existing CSP is a good start. All user input is validated and sanitized on the backend to prevent SQLi. The use of a templating engine (Handlebars) and programmatic DOM manipulation on the frontend helps prevent XSS.
- **Data Security**: Data is encrypted in transit (TLS) and at rest (using AWS KMS for Aurora and S3).

### 9. Technology Stack

- **Frontend**: Handlebars.js (current), but **React** is recommended for a richer, more complex single-page application experience as the project grows.
- **Backend**: **Node.js** with **Express.js**.
- **Database**: **AWS Aurora (PostgreSQL)** for its performance, scalability, and managed features.
- **Cache**: **AWS ElastiCache for Redis**.
- **Search**: **AWS OpenSearch**.
- **Infrastructure**: **AWS ECS Fargate** (for containers), **S3** (for static assets), **CloudFront** (CDN), **ALB** (load balancing), **SQS** (queue), **IAM** (permissions).
- **CI/CD**: **GitHub Actions** for building Docker containers and deploying to ECS.

### 10. Trade-offs

- **Managed Services vs. Self-Hosted**: This design heavily favors AWS managed services (Aurora, ElastiCache, Fargate) over self-hosting (e.g., running a PostgreSQL cluster on EC2). This increases cost but significantly reduces operational complexity and improves reliability, which is a worthwhile trade-off for a small team.
- **Monolith vs. Microservices**: The current application is a monolith. This design scales the monolith horizontally. While a future move to microservices could offer more flexibility, it also adds significant complexity in deployment, inter-service communication, and monitoring. The current design postpones that complexity until the scale absolutely demands it.
- **SQL vs. NoSQL**: A relational database (Aurora/PostgreSQL) is chosen because the data (users, anime, watchlists) is highly relational. A NoSQL database would not be a good fit for the core data model.

### 11. Deployment Strategy

A CI/CD pipeline using GitHub Actions will be implemented:
1. **On Push to `main` branch**:
2. A GitHub Actions workflow triggers.
3. It runs any automated tests.
4. It builds a new Docker image of the Node.js application.
5. It pushes the image to Amazon ECR (Elastic Container Registry).
6. It triggers a new deployment on AWS ECS, which performs a rolling update to replace the old running containers with the new version with zero downtime.
7. Environment variables and secrets are injected securely into the containers from AWS Secrets Manager.
