const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const port = process.env.PORT || 4000;
const dbPath = path.join(__dirname, '..', 'database', 'event-registration.db');

app.use(express.json());

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
});

const createTables = `
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  location TEXT NOT NULL,
  date TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY(event_id) REFERENCES events(id)
);
`;

db.exec(createTables, (err) => {
  if (err) {
    console.error('Database initialization failed:', err.message);
    process.exit(1);
  }
  seedEvents();
});

function seedEvents() {
  const sql = 'SELECT COUNT(*) AS count FROM events';
  db.get(sql, (err, row) => {
    if (err) {
      console.error('Seed check failed:', err.message);
      return;
    }
    if (row.count === 0) {
      const insert = `INSERT INTO events (title, description, category, location, date) VALUES (?, ?, ?, ?, ?)`;
      const events = [
        ['Tech Networking Meet', 'Connect with professionals and discover career opportunities in technology.', 'Networking', 'Downtown Conference Hall', '2026-07-20'],
        ['Frontend Workshop', 'Hands-on workshop on modern HTML, CSS, and JavaScript techniques.', 'Workshop', 'City Tech Center', '2026-08-05'],
        ['Startup Pitch Night', 'Watch founders pitch ideas and learn what makes a strong business case.', 'Business', 'Innovation Hub', '2026-08-18'],
        ['Design Thinking Session', 'Collaborative session to practice user-centered design methods.', 'Design', 'Studio 12', '2026-09-02'],
        ['AI Ethics Panel', 'Industry leaders discuss responsible AI use and future approaches.', 'Panel', 'Auditorium A', '2026-09-15']
      ];
      const stmt = db.prepare(insert);
      for (const event of events) {
        stmt.run(event, (err) => {
          if (err) console.error('Insert event failed:', err.message);
        });
      }
      stmt.finalize();
    }
  });
}

function validateRegistrationInput(data) {
  const errors = [];
  if (!data.event_id || typeof data.event_id !== 'number') {
    errors.push('event_id is required and must be a number.');
  }
  if (!data.name || !data.name.trim()) {
    errors.push('name is required.');
  }
  if (!data.email || !/^\S+@\S+\.\S+$/.test(data.email)) {
    errors.push('email is required and must be valid.');
  }
  if (!data.phone || !/^\d{6,15}$/.test(data.phone.replace(/\D/g, ''))) {
    errors.push('phone is required and must contain 6 to 15 digits.');
  }
  return errors;
}

app.get('/events', (req, res) => {
  const { search = '', category = '' } = req.query;
  let sql = 'SELECT * FROM events';
  const params = [];

  if (search || category) {
    const clauses = [];
    if (search) {
      clauses.push('(title LIKE ? OR description LIKE ? OR location LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (category) {
      clauses.push('category = ?');
      params.push(category);
    }
    sql += ' WHERE ' + clauses.join(' AND ');
  }

  sql += ' ORDER BY date ASC';
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to retrieve events.' });
    }
    res.json(rows);
  });
});

app.get('/events/:id', (req, res) => {
  const eventId = Number(req.params.id);
  if (!eventId) {
    return res.status(400).json({ error: 'Invalid event ID.' });
  }
  db.get('SELECT * FROM events WHERE id = ?', [eventId], (err, row) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to retrieve event.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Event not found.' });
    }
    res.json(row);
  });
});

app.get('/register/:id', (req, res) => {
  const registrationId = Number(req.params.id);
  if (!registrationId) {
    return res.status(400).json({ error: 'Invalid registration ID.' });
  }
  db.get(
    'SELECT r.id, r.event_id, r.name, r.email, r.phone, r.created_at, e.title AS event_title, e.date AS event_date FROM registrations r JOIN events e ON r.event_id = e.id WHERE r.id = ?',
    [registrationId],
    (err, row) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to retrieve registration.' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Registration not found.' });
      }
      res.json(row);
    }
  );
});

app.post('/register', (req, res) => {
  const data = req.body;
  const errors = validateRegistrationInput(data);
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  db.get('SELECT id FROM events WHERE id = ?', [data.event_id], (err, event) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to validate event.' });
    }
    if (!event) {
      return res.status(400).json({ error: 'Selected event does not exist.' });
    }
    const insert = 'INSERT INTO registrations (event_id, name, email, phone) VALUES (?, ?, ?, ?)';
    db.run(insert, [data.event_id, data.name.trim(), data.email.trim(), data.phone.trim()], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to create registration.' });
      }
      res.status(201).json({ message: 'Registration created successfully.', id: this.lastID });
    });
  });
});

app.put('/register/:id', (req, res) => {
  const registrationId = Number(req.params.id);
  const data = req.body;
  if (!registrationId) {
    return res.status(400).json({ error: 'Invalid registration ID.' });
  }
  const errors = validateRegistrationInput(data);
  if (errors.length) {
    return res.status(400).json({ errors });
  }

  db.get('SELECT id FROM registrations WHERE id = ?', [registrationId], (err, reg) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to validate registration.' });
    }
    if (!reg) {
      return res.status(404).json({ error: 'Registration not found.' });
    }
    const update = 'UPDATE registrations SET event_id = ?, name = ?, email = ?, phone = ? WHERE id = ?';
    db.run(update, [data.event_id, data.name.trim(), data.email.trim(), data.phone.trim(), registrationId], function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Failed to update registration.' });
      }
      res.json({ message: 'Registration updated successfully.', id: registrationId });
    });
  });
});

app.delete('/register/:id', (req, res) => {
  const registrationId = Number(req.params.id);
  if (!registrationId) {
    return res.status(400).json({ error: 'Invalid registration ID.' });
  }
  db.run('DELETE FROM registrations WHERE id = ?', [registrationId], function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to delete registration.' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Registration not found.' });
    }
    res.json({ message: 'Registration deleted successfully.' });
  });
});

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'frontend', '404.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
