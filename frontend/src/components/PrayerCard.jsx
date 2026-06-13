import { useState } from 'react';
import CommentPanel from './CommentPanel';
import { incrementPray } from '../api/prayerApi';

export default function PrayerCard({ request }) {
  const [prayCount, setPrayCount] = useState(request.pray_count);
  const [hasPrayed, setHasPrayed] = useState(
    () => !!localStorage.getItem(`prayed_${request.id}`)
  );
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handlePray = async () => {
    if (hasPrayed) return;
    try {
      const data = await incrementPray(request.id);
      setPrayCount(data.pray_count);
      setHasPrayed(true);
      localStorage.setItem(`prayed_${request.id}`, '1');
    } catch (e) { console.error(e); }
  };

  return (
    <div style={{background:'white', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'16px', marginBottom:'16px', boxShadow:'0 1px 3px rgba(0,0,0,0.08)'}}>
      <h3 style={{margin:'0 0 4px', color:'#1B3A6B'}}>{request.prayer_title}</h3>
      <div style={{fontSize:'13px', color:'#6B7280', marginBottom:'8px'}}>
        {request.display_name} &middot; {new Date(request.date_added).toLocaleDateString()}
      </div>

      <p>
        {expanded ? request.prayer_message : request.preview}
        {!expanded && request.preview?.length >= 200 && (
          <button onClick={() => setExpanded(true)}
            style={{background:'none', border:'none', color:'#1B3A6B', cursor:'pointer', textDecoration:'underline'}}>
            &nbsp;Read more
          </button>
        )}
      </p>

      <div style={{display:'flex', gap:'10px', marginTop:'10px'}}>
        <button
          onClick={handlePray}
          disabled={hasPrayed}
          style={{
            border:'1px solid #C9A84C',
            background: hasPrayed ? '#C9A84C' : 'white',
            color: hasPrayed ? 'white' : '#C9A84C',
            padding:'6px 12px', borderRadius:'4px', cursor: hasPrayed ? 'default' : 'pointer'
          }}
        >
          🙏 {hasPrayed ? 'Praying' : "I'm Praying for This"} ({prayCount})
        </button>

        <button onClick={() => setShowComments(v => !v)}
          style={{background:'none', border:'none', color:'#6B7280', cursor:'pointer'}}>
          💬 Encouragements {showComments ? '▲' : '▼'}
        </button>
      </div>

      {showComments && <CommentPanel requestId={request.id} />}
    </div>
  );
}