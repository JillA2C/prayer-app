const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
require('dotenv').config();

const publicRoutes = require('./routes/public');
const adminRoutes  = require('./routes/admin');

const app = express();
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://prayer-app-umber.vercel.app'
    : 'http://localhost:5173',
}));
app.use(express.json({ limit: '10kb' }));

app.use('/api', publicRoutes);
app.use('/api/admin', adminRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

// Run cleanup daily
setInterval(async () => {
  try {
    await pool.query(`DELETE FROM comments WHERE status='deleted' AND submitted_at < NOW() - INTERVAL '30 days'`);
    await pool.query(`DELETE FROM prayer_requests WHERE status='hidden' AND date_added < NOW() - INTERVAL '30 days'`);
    console.log('Auto-cleanup ran successfully');
  } catch (err) { console.error('Cleanup error:', err); }
}, 24 * 60 * 60 * 1000); // runs every 24 hours

module.exports = app;