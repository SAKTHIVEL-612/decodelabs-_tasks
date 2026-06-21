# Database Integration

This project uses SQLite for persistent data storage.

Files:
- `event-registration.db` - SQLite database file generated when the backend starts.
- `init.sql` - Schema definition for the `events` and `registrations` tables.

Schema:
- `events`:
  - `id`
  - `title`
  - `description`
  - `category`
  - `location`
  - `date`
- `registrations`:
  - `id`
  - `event_id`
  - `name`
  - `email`
  - `phone`
  - `created_at`
