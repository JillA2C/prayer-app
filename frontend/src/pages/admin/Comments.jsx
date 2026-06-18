import { useState, useEffect } from 'react';
import { adminGetComments, adminDeleteComment } from '../../api/prayerApi';

export default function Comments() {
  const [comments, setComments] = useState([]);
  const [deletingId, setDeletingId] = useState(null);
  const [reason, setReason] = useState('');

  const load = async () => {
    const data = await adminGetComments();
    setComments(data.comments);
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{maxWidth:'800px', margin:'0 auto', padding:'20px', fontFamily:'sans-serif'}}>
      <h2 style={{color:'#1B3A6B'}}>Comments</h2>
      <a href="/admin/dashboard">&larr; Back to Dashboard</a>

      {comments.length === 0 ? <p>No comments yet.</p> :
        comments.map(c => (
          <div key={c.id} style={{background:'#F4F7FB', padding:'12px', borderRadius:'6px', marginTop:'12px'}}>
            <strong>{c.visitor_name}</strong> on <em>{c.prayer_title}</em>
            <p style={{margin:'6px 0'}}>{c.comment_text}</p>
            <span style={{fontSize:'12px', color:'#16A34A', fontWeight:'600'}}>✅ Visible</span>
            {deletingId === c.id ? (
              <div style={{marginTop:'8px'}}>
                <input
                  placeholder="Reason for deletion (optional)..."
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  style={{display:'block', width:'100%', padding:'6px', marginBottom:'6px', border:'1px solid #ccc', borderRadius:'4px', boxSizing:'border-box'}}
                />
                <button onClick={async () => { await adminDeleteComment(c.id, reason); setDeletingId(null); setReason(''); load(); }}
                  style={{background:'#DC2626', color:'white', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer', marginRight:'6px'}}>
                  Confirm Delete
                </button>
                <button onClick={() => { setDeletingId(null); setReason(''); }}
                  style={{background:'#6B7280', color:'white', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer'}}>
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setDeletingId(c.id)}
                style={{background:'#DC2626', color:'white', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer', marginLeft:'8px'}}>
                🗑️ Delete
              </button>
            )}
          </div>
        ))
      }
    </div>
  );
}