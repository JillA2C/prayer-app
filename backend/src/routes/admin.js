const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const pool = require('../config/db');
const auth = require('../middleware/auth');
const router = express.Router();

const loginLimit = rateLimit({ windowMs:15*60*1000, max:5,
  message:{ error:'Too many attempts. Wait 15 minutes.' } });

// POST /api/admin/login
router.post('/login', loginLimit,
  body('username').trim().notEmpty(),
  body('password').notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { username, password } = req.body;
    const { rows } = await pool.query(
      'SELECT * FROM admins WHERE username = $1', [username]
    );
   const admin = rows[0];

if (!admin) {
  return res.status(401).json({ error: 'Invalid credentials' });
}

if (!admin.password_hash) {
  return res.status(500).json({ error: 'Server misconfiguration' });
}

const isMatch = await bcrypt.compare(password, admin.password_hash);

if (!isMatch) {
  return res.status(401).json({ error: 'Invalid credentials' });
}

    const token = jwt.sign({ id: admin.id, username: admin.username },
      process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, username: admin.username });
  }
);

// GET /api/admin/requests
router.get('/requests', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM prayer_requests ORDER BY date_added DESC`
  );
  res.json({ requests: rows });
});

// POST /api/admin/requests
router.post('/requests', auth,
  body('full_name').trim().isLength({ min:2, max:120 }),
  body('prayer_title').trim().isLength({ min:3, max:200 }),
  body('prayer_message').trim().isLength({ min:10 }),
  body('show_name').optional().isBoolean(),
  body('church').optional().trim(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { full_name, prayer_title, prayer_message, show_name = true, church = 'st_michael', date_override } = req.body;
    const dateValue = date_override ? new Date(date_override) : new Date();
    const { rows } = await pool.query(
      `INSERT INTO prayer_requests
         (full_name, prayer_title, prayer_message, show_name, added_by, church, date_added)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [full_name, prayer_title, prayer_message, show_name, req.admin.id, church, dateValue]
    );
    res.status(201).json({ request: rows[0] });
  }
);

// GET /api/admin/requests/pending
router.get('/requests/pending', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT * FROM prayer_requests WHERE status = 'pending' ORDER BY date_added DESC`
  );
  res.json({ requests: rows });
});


// PUT /api/admin/requests/:id
router.put('/requests/:id', auth, async (req, res) => {
  const { full_name, prayer_title, prayer_message, show_name, status } = req.body;
  const { rows } = await pool.query(
    `UPDATE prayer_requests
     SET full_name=$1, prayer_title=$2, prayer_message=$3,
         show_name=$4, status=$5
     WHERE id=$6 RETURNING *`,
    [full_name, prayer_title, prayer_message, show_name, status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ request: rows[0] });
});

// DELETE /api/admin/requests/:id
router.delete('/requests/:id', auth, async (req, res) => {
  const { rowCount } = await pool.query(
    'DELETE FROM prayer_requests WHERE id=$1', [req.params.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted.' });
});


// PUT /api/admin/requests/:id/approve
router.put('/requests/:id/approve', auth, async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE prayer_requests SET status='approved' WHERE id=$1 RETURNING *`, [req.params.id]
  );
  res.json({ request: rows[0] });
});

// PUT /api/admin/comments/:id/reject
router.put('/comments/:id/reject', auth, async (req, res) => {
  const { reason = '' } = req.body;
  const { rows } = await pool.query(
    `UPDATE comments SET status='rejected', reject_reason=$1 WHERE id=$2 RETURNING *`,
    [reason, req.params.id]
  );
  res.json({ comment: rows[0] });
});

// GET /api/admin/comments
router.get('/comments', auth, async (req, res) => {
  const { rows } = await pool.query(
    `SELECT c.*, pr.prayer_title, pr.church
     FROM comments c
     JOIN prayer_requests pr ON c.request_id = pr.id
     ORDER BY c.submitted_at DESC`
  );
  res.json({ comments: rows });
});

// DELETE /api/admin/comments/:id (soft delete with optional reason)
router.delete('/comments/:id', auth, async (req, res) => {
  const { reason = '' } = req.body;
  const { rows } = await pool.query(
    `UPDATE comments SET status='deleted', deleted_reason=$1 WHERE id=$2 RETURNING *`,
    [reason, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Comment deleted.', comment: rows[0] });
});
// GET /api/admin/games
router.get('/games', auth, async (req, res) => {
  const { rows } = await pool.query(`SELECT * FROM bible_games ORDER BY id DESC`);
  res.json({ games: rows });
});

// POST /api/admin/games
router.post('/games', auth,
  body('answer').trim().notEmpty(),
  body('hint1').trim().notEmpty(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { answer, hint1, hint2 = '', hint3 = '', difficulty = 'easy' } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO bible_games (answer, hint1, hint2, hint3, difficulty)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [answer, hint1, hint2, hint3, difficulty]
    );
    res.status(201).json({ game: rows[0] });
  }
);

// PUT /api/admin/games/:id
router.put('/games/:id', auth, async (req, res) => {
  const { answer, hint1, hint2, hint3, difficulty, active } = req.body;
  const { rows } = await pool.query(
    `UPDATE bible_games SET answer=$1, hint1=$2, hint2=$3, hint3=$4, difficulty=$5, active=$6
     WHERE id=$7 RETURNING *`,
    [answer, hint1, hint2, hint3, difficulty, active, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ game: rows[0] });
});

// DELETE /api/admin/games/:id
router.delete('/games/:id', auth, async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM bible_games WHERE id=$1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Not found' });
  res.json({ message: 'Deleted.' });
});

module.exports = router;