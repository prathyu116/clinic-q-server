# Clinic Queue Manager - Backend (Server)

This directory contains the Node.js, Express, and MongoDB backend for the Clinic Queue Manager application. It handles API requests for booking, queue management, admin actions, and authentication.

## Core Technologies

*   **Node.js:** JavaScript runtime environment.
*   **Express:** Web application framework for Node.js.
*   **MongoDB:** NoSQL database for storing booking information.
*   **Mongoose:** Object Data Modeling (ODM) library for MongoDB and Node.js.
*   **JSON Web Tokens (JWT):** Used for securing admin routes via HTTP-only cookies.
*   **bcrypt:** Library for hashing admin passwords.
*   **cookie-parser:** Middleware for parsing cookie headers.
*   **cors:** Middleware for enabling Cross-Origin Resource Sharing.
*   **dotenv:** Module for loading environment variables from a `.env` file.
*   **uuid:** For generating unique booking IDs (patient-facing).

## Prerequisites

*   Node.js (v16 or later recommended)
*   npm or yarn
*   MongoDB instance (local or Atlas cluster)

## Setup and Installation

1.  **Navigate to the server directory:**
    ```bash
    cd server
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Create Environment Variables File:**
    *   Create a `.env` file in the `server/` directory: `touch .env`
    *   Add the following variables, replacing placeholder values:

    ```dotenv
    # MongoDB connection string
    MONGODB_URI=mongodb://localhost:27017/clinicQueueDB # Or your Atlas connection string

    # Server port
    PORT=5000

    # Admin Credentials (Plain text password here will be hashed)
    ADMIN_USERNAME=admin
    ADMIN_PASSWORD=your_chosen_plain_text_password # Change this!

    # JWT Configuration
    JWT_SECRET=your_super_secret_jwt_key_please_change_this # Generate a long, random string
    JWT_EXPIRES_IN=1h # e.g., 1h, 30m, 1d
    ```

4.  **Hash the Admin Password:**
    *   **IMPORTANT SECURITY STEP!** Do not store the plain text password. Run the following command in your terminal (ensure `bcrypt` is installed globally or use `npx`):
        ```bash
        node -e "console.log(require('bcrypt').hashSync('your_chosen_plain_text_password', 10));"
        ```
    *   Copy the **entire output hash** (starting with `$2b$10$...`).
    *   Replace the plain text password in the `ADMIN_PASSWORD` variable within your `.env` file with this **hash**.

## Running the Server

1.  **Ensure MongoDB is running** or accessible.
2.  **Start the development server (with auto-reload using `nodemon`):**
    ```bash
    npm run dev
    ```
3.  **Start the production server:**
    ```bash
    npm start
    ```

The server should start, connect to MongoDB, and listen on the specified `PORT` (default: 5000).

## API Endpoints

### Authentication (`/api/auth`)

*   `POST /login`: Authenticates the admin using username/password and sets an HTTP-only JWT cookie.
*   `POST /logout`: Clears the JWT cookie.
*   `GET /status`: Checks if the current user has a valid JWT cookie (is authenticated).

### Bookings & Queue (`/api`)

*   `POST /bookings`: (Public) Creates a new patient booking.
    *   Body: `{ "patientName": "string" }`
*   `GET /queue`: (Public) Gets simplified current queue status for patient view.
*   `GET /bookings/:bookingId`: (Public) Gets the status of a specific booking using the patient-facing `bookingId`.
*   `DELETE /bookings/:bookingId`: (Public) Cancels a specific 'Waiting' booking using the patient-facing `bookingId`.

### Admin (`/api/admin`) - Requires Authentication

*   `GET /admin/queue`: Gets the detailed active queue for the admin view.
*   `PATCH /admin/bookings/:id/done`: Marks a patient as 'Done' using their internal MongoDB `_id`.

## Key Features

*   Patient booking creation with unique IDs.
*   Public queue status view (total waiting, current/next patient identifiers).
*   Patient status checking and cancellation using their booking ID.
*   Secure admin login using JWT stored in HTTP-only cookies.
*   Admin view of the detailed waiting queue.
*   Admin ability to mark patients as 'Done', removing them from the active queue.

## Future Improvements

*   Implement WebSockets (Socket.IO) for real-time queue updates.
*   Add database indexing for larger scale.
*   More robust error handling and logging.
*   Implement refresh tokens for longer-lived admin sessions.
*   Consider adding estimated wait times.
*   Add unit and integration tests.