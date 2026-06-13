const express  = require('express');
const { query, body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const pool = require('../config/db');
const router = express.Router();

// GET /api/prayer-requests (paginated public list)
router.get('/prayer-requests', async (req, res) => {
  const page   = Math.max(1, parseInt(req.query.page) || 1);
  const offset = (page - 1) * 20;
  try {
    const { rows } = await pool.query(
      `SELECT id, prayer_title, pray_count, date_added,
              CASE WHEN show_name THEN full_name ELSE 'Anonymous' END AS display_name,
              LEFT(prayer_message, 200) AS preview
       FROM prayer_requests WHERE status = 'approved'
       ORDER BY date_added DESC LIMIT 20 OFFSET $1`, [offset]
    );
    const total = await pool.query(
      `SELECT COUNT(*) FROM prayer_requests WHERE status='approved'`
    );
    res.json({ requests: rows, total: parseInt(total.rows[0].count), page });
  } catch (err) { res.status(500).json({ error: 'Fetch failed' }); }
});

// GET /api/prayer-requests/search
router.get('/prayer-requests/search', async (req, res) => {
  const { name, from, to } = req.query;
  const params = [];
  let where = "WHERE status = 'approved'";
  if (name) { params.push(`%${name}%`); where += ` AND LOWER(full_name) LIKE LOWER($${params.length})`; }
  if (from) { params.push(from);        where += ` AND date_added >= $${params.length}`; }
  if (to)   { params.push(to);          where += ` AND date_added <= $${params.length}`; }
  const { rows } = await pool.query(
    `SELECT id, prayer_title, pray_count, date_added,
            CASE WHEN show_name THEN full_name ELSE 'Anonymous' END AS display_name,
            LEFT(prayer_message,200) AS preview
     FROM prayer_requests ${where} ORDER BY date_added DESC LIMIT 50`, params
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
    `SELECT visitor_name, comment_text, approved_at
     FROM comments WHERE request_id = $1 AND status = 'approved'
     ORDER BY approved_at DESC`, [req.params.id]
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
      `INSERT INTO comments (request_id, visitor_name, comment_text)
       VALUES ($1, $2, $3)`, [req.params.id, visitor_name, comment_text]
    );
    res.status(201).json({
      message: 'Thank you! Your encouragement will appear shortly.'
    });
  }
);

module.exports = router;