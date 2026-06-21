# Event Registration System

Complete production-quality Event Registration System built with:
- Frontend: HTML5, CSS3, Vanilla JavaScript
- Backend: Node.js + Express.js
- Database: SQLite

## Project Structure

- `frontend/`
  - `index.html` - Home page
  - `events.html` - Events listing page with search and category filtering
  - `event-details.html` - Event details page
  - `register.html` - Event registration form page
  - `success.html` - Registration success page
  - `registration.html` - Registration detail / edit / delete page
  - `404.html` - Page not found fallback
  - `assets/css/styles.css` - Responsive styling
  - `assets/js/app.js` - Frontend interaction and API integration

- `backend/`
  - `server.js` - REST API server
  - `package.json` - Node project config
  - `package-lock.json` - Lockfile created by npm

- `database/`
  - `init.sql` - Database schema definition
  - `README.md` - Database schema notes

## Database Schema

### Events
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `title` (TEXT)
- `description` (TEXT)
- `category` (TEXT)
- `location` (TEXT)
- `date` (TEXT)

### Registrations
- `id` (INTEGER PRIMARY KEY AUTOINCREMENT)
- `event_id` (INTEGER) - foreign key to `events.id`
- `name` (TEXT)
- `email` (TEXT)
- `phone` (TEXT)
- `created_at` (TEXT)

## API Documentation

Base URL: `http://localhost:4000`

### GET /events
- Returns all events
- Supports query parameters:
  - `search` - keyword search on title, description, or location
  - `category` - filter by category
- Response: `200 OK` with JSON array

### GET /events/:id
- Returns event details by ID
- Response: `200 OK` or `404 Not Found`

### GET /register/:id
- Returns registration details by registration ID
- Response: `200 OK` or `404 Not Found`

### POST /register
- Creates a registration
- Request body: `{ event_id, name, email, phone }`
- Validation: required fields, valid email, phone digits
- Response: `201 Created` with created ID

### PUT /register/:id
- Updates a registration
- Request body: `{ event_id, name, email, phone }`
- Response: `200 OK` or `404 Not Found`

### DELETE /register/:id
- Deletes a registration
- Response: `200 OK` or `404 Not Found`

## Features Implemented

- Responsive frontend pages
- Event search and category filtering
- Event details page with registration CTA
- Registration form with client-side validation
- Server-side validation and JSON API responses
- Persistent SQLite database
- Registration detail page with update and delete actions
- Proper HTTP status codes and error handling

## Setup Instructions

1. Open a terminal in `d:\decode project\event registration system\backend`
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Start the server:
   ```powershell
   node server.js
   ```
4. Open the application in a browser:
   `http://localhost:4000/index.html`

## Testing Instructions

1. Verify the home page loads.
2. Navigate to `events.html`, perform search and category filter.
3. Open an event details page.
4. Register for an event in `register.html`.
5. Confirm success and use the link to view registration details.
6. On `registration.html`, update registration fields and save.
7. Delete the registration and confirm the app returns to home.

## Notes

- No extra frameworks or libraries are used beyond the required stack.
- The backend serves frontend files and API endpoints from a single server.
- Database persistence is provided by SQLite in `database/event-registration.db`.