import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './src/db.ts';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'skillswap-secret-key';
const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);

  app.use(express.json());
  app.use(cookieParser());

  // Auth Middleware
  const authenticate = (req: any, res: any, next: any) => {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Invalid token' });
    }
  };

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = db.prepare('INSERT INTO users (username, password) VALUES (?, ?)').run(username, hashedPassword);
      const token = jwt.sign({ id: result.lastInsertRowid, username }, JWT_SECRET);
      res.cookie('token', token, { httpOnly: true, sameSite: 'none', secure: true });
      res.json({ id: result.lastInsertRowid, username });
    } catch (err: any) {
      if (err.message.includes('UNIQUE')) return res.status(400).json({ error: 'Username taken' });
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.cookie('token', token, { httpOnly: true, sameSite: 'none', secure: true });
    res.json({ id: user.id, username: user.username });
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  app.get('/api/auth/me', authenticate, (req: any, res) => {
    res.json(req.user);
  });

  // --- Skill Routes ---
  app.get('/api/skills', (req, res) => {
    const skills = db.prepare(`
      SELECT s.*, u.username as owner_name, GROUP_CONCAT(t.name) as tags
      FROM skills s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN skill_tags st ON s.id = st.skill_id
      LEFT JOIN tags t ON st.tag_id = t.id
      GROUP BY s.id
    `).all();
    res.json(skills.map((s: any) => ({ ...s, tags: s.tags ? s.tags.split(',') : [] })));
  });

  app.post('/api/skills', authenticate, (req: any, res) => {
    const { name, description, type, tags } = req.body;
    const result = db.prepare('INSERT INTO skills (user_id, name, description, type) VALUES (?, ?, ?, ?)')
      .run(req.user.id, name, description, type);
    
    const skillId = result.lastInsertRowid;
    if (tags && Array.isArray(tags)) {
      const insertTag = db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
      const getTagId = db.prepare('SELECT id FROM tags WHERE name = ?');
      const linkTag = db.prepare('INSERT INTO skill_tags (skill_id, tag_id) VALUES (?, ?)');
      
      tags.forEach(tagName => {
        insertTag.run(tagName);
        const tag = getTagId.get(tagName) as any;
        if (tag) linkTag.run(skillId, tag.id);
      });
    }
    res.json({ id: skillId, name, description, type, tags });
  });

  // --- Swap Routes ---
  app.post('/api/swaps', authenticate, (req: any, res) => {
    const { owner_id, skill_offered_id, skill_wanted_id } = req.body;
    const result = db.prepare('INSERT INTO swaps (requester_id, owner_id, skill_offered_id, skill_wanted_id) VALUES (?, ?, ?, ?)')
      .run(req.user.id, owner_id, skill_offered_id, skill_wanted_id);
    res.json({ id: result.lastInsertRowid });
  });

  app.get('/api/swaps', authenticate, (req: any, res) => {
    const swaps = db.prepare(`
      SELECT sw.*, 
             u1.username as requester_name, 
             u2.username as owner_name,
             s1.name as offered_skill_name,
             s2.name as wanted_skill_name
      FROM swaps sw
      JOIN users u1 ON sw.requester_id = u1.id
      JOIN users u2 ON sw.owner_id = u2.id
      JOIN skills s1 ON sw.skill_offered_id = s1.id
      JOIN skills s2 ON sw.skill_wanted_id = s2.id
      WHERE sw.requester_id = ? OR sw.owner_id = ?
    `).all(req.user.id, req.user.id);
    res.json(swaps);
  });

  app.patch('/api/swaps/:id', authenticate, (req: any, res) => {
    const { status } = req.body;
    db.prepare('UPDATE swaps SET status = ? WHERE id = ? AND owner_id = ?').run(status, req.params.id, req.user.id);
    res.json({ success: true });
  });

  // --- Message Routes ---
  app.get('/api/messages/:swapId', authenticate, (req: any, res) => {
    const messages = db.prepare(`
      SELECT m.*, u.username as sender_name
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.swap_id = ?
      ORDER BY m.created_at ASC
    `).all(req.params.swapId);
    res.json(messages);
  });

  // --- Socket.io ---
  io.on('connection', (socket) => {
    socket.on('join_swap', (swapId) => {
      socket.join(`swap_${swapId}`);
    });

    socket.on('send_message', ({ swapId, senderId, content }) => {
      const result = db.prepare('INSERT INTO messages (swap_id, sender_id, content) VALUES (?, ?, ?)')
        .run(swapId, senderId, content);
      
      const user = db.prepare('SELECT username FROM users WHERE id = ?').get(senderId) as any;
      
      io.to(`swap_${swapId}`).emit('new_message', {
        id: result.lastInsertRowid,
        swap_id: swapId,
        sender_id: senderId,
        sender_name: user.username,
        content,
        created_at: new Date().toISOString()
      });
    });
  });

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
