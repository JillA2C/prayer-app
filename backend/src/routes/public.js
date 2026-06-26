const express  = require('express');
const { query, body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');
const router = express.Router();

// GET /api/prayer-requests (public list - no limit)
router.get('/prayer-requests', async (req, res) => {
  const { church } = req.query;
  try {
    let where = "WHERE status = 'approved'";
    const params = [];
    if (church) { params.push(church); where += ` AND church = $${params.length}`; }

    const { rows } = await pool.query(
      `SELECT id, prayer_title, pray_count, date_added, church,
              full_name,
              CASE WHEN show_name THEN full_name ELSE 'Anonymous' END AS display_name,
              LEFT(prayer_message, 200) AS preview
       FROM prayer_requests ${where}
       ORDER BY date_added DESC`, params
    );

    const totalParams = church ? [church] : [];
    const totalWhere = church ? "WHERE status='approved' AND church = $1" : "WHERE status='approved'";
    const total = await pool.query(
      `SELECT COUNT(*) FROM prayer_requests ${totalWhere}`, totalParams
    );
    res.json({ requests: rows, total: parseInt(total.rows[0].count), page: 1 });
  } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

// GET /api/prayer-requests/search
router.get('/prayer-requests/search', async (req, res) => {
  const { name, from, to, church } = req.query;
  const params = [];
  let where = "WHERE status = 'approved'";
  if (name)   { params.push(`%${name}%`); where += ` AND LOWER(full_name) LIKE LOWER($${params.length})`; }
  if (from)   { params.push(from);        where += ` AND date_added >= $${params.length}`; }
  if (to)     { params.push(to);          where += ` AND date_added <= $${params.length}`; }
  if (church) { params.push(church);      where += ` AND church = $${params.length}`; }
  const { rows } = await pool.query(
    `SELECT id, prayer_title, pray_count, date_added, church,
            full_name,
            CASE WHEN show_name THEN full_name ELSE 'Anonymous' END AS display_name,
            LEFT(prayer_message,200) AS preview
     FROM prayer_requests ${where} ORDER BY date_added DESC`, params
  );
  res.json({ requests: rows });
});

// GET /api/prayer-requests/:id/full
router.get('/prayer-requests/:id/full', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, prayer_title, pray_count, date_added, prayer_message,
            CASE WHEN show_name THEN full_name ELSE 'Anonymous' END AS display_name
     FROM prayer_requests WHERE id = $1 AND status = 'approved'`, [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
});

// POST /api/prayer-requests/:id/pray
const prayLimiter = rateLimit({ windowMs: 60*60*1000, max: 50,
  message: { error: 'Too many requests' } });

router.post('/prayer-requests/:id/pray', prayLimiter, async (req, res) => {
  const { rows } = await pool.query(
    `UPDATE prayer_requests SET pray_count = pray_count + 1
     WHERE id = $1 AND status = 'approved' RETURNING pray_count`, [req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Not found' });
  res.json({ pray_count: rows[0].pray_count });
});

// GET /api/prayer-requests/:id/comments
router.get('/prayer-requests/:id/comments', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT visitor_name, 
            CASE WHEN status = 'deleted' THEN '***' ELSE comment_text END AS comment_text,
            submitted_at, approved_at, status, deleted_reason
     FROM comments WHERE request_id = $1 AND status IN ('approved', 'deleted')
     ORDER BY submitted_at DESC`, [req.params.id]
  );
  res.json({ comments: rows });
});

// POST /api/prayer-requests/:id/comments
const commentLimiter = rateLimit({ windowMs: 60*60*1000, max: 5,
  message: { error: 'Too many comments. Please wait.' } });

router.post('/prayer-requests/:id/comments', commentLimiter,
  body('comment_text').trim().isLength({ min: 5, max: 300 }),
  body('visitor_name').optional().trim().isLength({ max: 80 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { comment_text, visitor_name = 'Anonymous' } = req.body;
    await pool.query(
      `INSERT INTO comments (request_id, visitor_name, comment_text, status, submitted_at)
       VALUES ($1, $2, $3, 'approved', NOW())`, [req.params.id, visitor_name, comment_text]
    );
    res.status(201).json({
      message: 'Thank you! Your encouragement is now visible.'
    });
  }
);

// POST /api/prayer-requests/submit (public submission)
router.post('/prayer-requests/submit',
  body('full_name').trim().isLength({ min:2, max:120 }),
  body('prayer_message').trim().isLength({ min:10 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });

    const { full_name, prayer_message } = req.body;
    await pool.query(
      `INSERT INTO prayer_requests
         (full_name, prayer_title, prayer_message, show_name, status, church)
       VALUES ($1,$2,$3,$4,'pending','public')`,
      [full_name, 'Public Prayer Request', prayer_message, true]
    );
    res.status(201).json({ message: 'Prayer request submitted! It will appear after review.' });
  }
);

// GET /api/prayer-requests/my-status
router.get('/prayer-requests/my-status', async (req, res) => {
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'Name required' });
  
  const { rows: prayers } = await pool.query(
    `SELECT id, full_name, prayer_message, status, reject_reason, date_added
     FROM prayer_requests 
     WHERE LOWER(full_name) LIKE LOWER($1)
     AND church = 'public'
     ORDER BY date_added DESC`,
    [`%${name}%`]
  );

  const { rows: comments } = await pool.query(
    `SELECT c.id, c.visitor_name, 
            CASE WHEN c.status = 'deleted' THEN '***' ELSE c.comment_text END AS comment_text,
            c.status, c.reject_reason, c.deleted_reason,
            c.submitted_at, pr.prayer_title, pr.church
     FROM comments c
     JOIN prayer_requests pr ON c.request_id = pr.id
     WHERE LOWER(c.visitor_name) LIKE LOWER($1)
     ORDER BY c.submitted_at DESC`,
    [`%${name}%`]
  );

  res.json({ requests: prayers, comments });
});

// GET /api/games/random
router.get('/games/random', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, answer, hint1, hint2, hint3 FROM bible_games WHERE active = true ORDER BY RANDOM() LIMIT 1`
  );
  if (!rows[0]) return res.status(404).json({ error: 'No games available' });
  res.json(rows[0]);
});

module.exports = router;
