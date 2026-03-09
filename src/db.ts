import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('skillswap.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS skills (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT CHECK(type IN ('offer', 'want')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL
  );

  CREATE TABLE IF NOT EXISTS skill_tags (
    skill_id INTEGER NOT NULL,
    tag_id INTEGER NOT NULL,
    PRIMARY KEY (skill_id, tag_id),
    FOREIGN KEY (skill_id) REFERENCES skills(id) ON DELETE CASCADE,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS swaps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    requester_id INTEGER NOT NULL,
    owner_id INTEGER NOT NULL,
    skill_offered_id INTEGER NOT NULL,
    skill_wanted_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'confirmed', 'rejected')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (requester_id) REFERENCES users(id),
    FOREIGN KEY (owner_id) REFERENCES users(id),
    FOREIGN KEY (skill_offered_id) REFERENCES skills(id),
    FOREIGN KEY (skill_wanted_id) REFERENCES skills(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    swap_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (swap_id) REFERENCES swaps(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)
  );
`);

// Seed some tags
const seedTags = ['Beginner', 'Intermediate', 'Advanced', 'Online', 'In-Person', 'Creative', 'Technical', 'Academic'];
const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
seedTags.forEach(tag => insertTag.run(tag));

export default db;
