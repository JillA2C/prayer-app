import { useState } from 'react';
import CommentPanel from './CommentPanel';
import { incrementPray } from '../api/prayerApi';

export default function PrayerCard({ request }) {
  const [prayCount, setPrayCount] = useState(request.pray_count ?? 0);
  const [hasPrayed, setHasPrayed] = useState(() => {
  const stored = localStorage.getItem(`prayed_${request.id}`);
  if (!stored) return false;
  // Auto-expire after 30 days
  const savedTime = parseInt(stored);
  if (isNaN(savedTime)) return true;
  return Date.now() - savedTime < 30 * 24 * 60 * 60 * 1000;
});
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handlePray = async () => {
    if (hasPrayed) return;
    try {
      const data = await incrementPray(request.id);
      setPrayCount(data.pray_count);
      setHasPrayed(true);
      localStorage.setItem(`prayed_${request.id}`, Date.now().toString());
    } catch (e) { console.error(e); }
  };

  const msg = request.prayer_message || request.preview || request.message || '';
  const preview = msg.length > 160 ? msg.slice(0, 160) + '...' : msg;

  return (
    <div style={S.card}>
      <div style={S.cardTop}>
        <div>
          <div style={S.meta}>{request.display_name} · {new Date(request.date_added).toLocaleDateString('en-GB')}</div>
          <p style={S.body}>
            {expanded ? msg : preview}
            {msg.length > 160 && !expanded && (
              <button onClick={() => setExpanded(true)} style={S.readMore}>Read more</button>
            )}
          </p>
        </div>
      </div>
      <div style={S.actions}>
        <button onClick={handlePray} disabled={hasPrayed} style={hasPrayed ? S.prayedBtn : S.prayBtn}>
          {hasPrayed ? `Praying (${prayCount})` : `I'm Praying for This (${prayCount})`}
        </button>
        <button onClick={() => setShowComments(v => !v)} style={S.commentBtn}>
          Encouragements {showComments ? '▲' : '▼'}
        </button>
      </div>
      {showComments && <CommentPanel requestId={request.id} />}
    </div>
  );
}

const S = {
  card: {
    background: '#fff',
    border: '1px solid #E8EDF4',
    borderRadius: '14px',
    padding: '18px 20px',
    marginBottom: '12px',
    boxShadow: '0 2px 12px rgba(27,58,107,0.07)',
    fontFamily: "'Segoe UI', Arial, sans-serif",
    borderLeft: '4px solid #C9A84C',
  },
  cardTop: { marginBottom: '14px' },
  meta: { fontSize: '12px', color: '#9CA3AF', marginBottom: '6px', fontWeight: '500' },
  body: { fontSize: '14px', color: '#374151', lineHeight: '1.65', margin: 0 },
  readMore: {
    background: 'none', border: 'none', color: '#1B3A6B',
    cursor: 'pointer', textDecoration: 'underline',
    fontSize: '13px', padding: '0 0 0 4px', fontFamily: 'inherit', fontWeight: '600',
  },
  actions: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' },
  prayBtn: {
    border: '2px solid #C9A84C',
    background: '#fff',
    color: '#C9A84C',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'inherit',
    boxShadow: '0 2px 6px rgba(201,168,76,0.2)',
  },
  prayedBtn: {
    border: '2px solid #C9A84C',
    background: 'linear-gradient(135deg, #C9A84C 0%, #e0bf6a 100%)',
    color: '#fff',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'default',
    fontSize: '13px',
    fontWeight: '700',
    fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(201,168,76,0.4)',
  },
  commentBtn: {
    background: 'none',
    border: 'none',
    color: '#9CA3AF',
    cursor: 'pointer',
    fontSize: '13px',
    padding: '4px 0',
    fontFamily: 'inherit',
    fontWeight: '500',
  },
};