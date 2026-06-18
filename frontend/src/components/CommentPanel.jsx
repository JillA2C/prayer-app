import { useState, useEffect } from 'react';
import { getComments, submitComment } from '../api/prayerApi';

export default function CommentPanel({ requestId }) {
  const [comments, setComments] = useState([]);
  const [asAnonymous, setAsAnonymous] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [status, setStatus] = useState('idle');

  const isAdmin = !!localStorage.getItem('adminToken');
  const rawName = localStorage.getItem('visitorName') || 'Anonymous';
  const visitorName = (isAdmin && window.location.pathname.startsWith('/admin')) ? 'Admin' : rawName;

  useEffect(() => {
    getComments(requestId).then(d => setComments(d.comments));
  }, [requestId]);

  const handleSubmit = async () => {
    if (commentText.trim().length < 5) return;
    setStatus('loading');
    try {
      await submitComment(requestId, {
        visitor_name: asAnonymous ? 'Anonymous' : visitorName,
        comment_text: commentText
      });
      setStatus('success');
      setCommentText('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <div style={{background:'#EFF6FF', padding:'12px', marginTop:'8px', borderRadius:'6px'}}>
      {comments.length === 0
        ? <p style={{color:'#6B7280', fontSize:'14px'}}>Be the first to leave an encouragement.</p>
        : comments.map((c, i) => (
            <div key={i} style={{marginBottom:'8px', paddingBottom:'8px', borderBottom:'1px solid #ddd'}}>
              <strong>{c.visitor_name}</strong>
              <span style={{color:'#999', fontSize:'12px', marginLeft:'8px'}}>
                {new Date(c.submitted_at || c.approved_at).toLocaleDateString()}
              </span>
              {c.status === 'deleted' ? (
                <div style={{marginTop:'4px'}}>
                  <p style={{margin:'0', color:'#9CA3AF', fontStyle:'italic'}}>***</p>
                  <p style={{margin:'2px 0 0', fontSize:'12px', color:'#DC2626'}}>🗑️ Removed by admin</p>
                  {c.deleted_reason && <p style={{margin:'2px 0 0', fontSize:'11px', color:'#6B7280'}}>Reason: {c.deleted_reason}</p>}
                </div>
              ) : (
                <p style={{margin:'4px 0 0'}}>{c.comment_text}</p>
              )}
            </div>
          ))
      }

      <div style={{marginTop:'10px'}}>
        <h4 style={{margin:'0 0 6px'}}>Leave an Encouragement</h4>
        {status === 'success' ? (
          <p style={{color:'#16A34A'}}>Thank you! Your encouragement is now visible. 🙏</p>
        ) : (
          <>
            <div style={{fontSize:'13px', color:'#555', marginBottom:'8px'}}>
              Posting as: <strong>{asAnonymous ? 'Anonymous' : visitorName}</strong>
              <label style={{marginLeft:'12px', fontSize:'12px', color:'#6B7280', cursor:'pointer'}}>
                <input
                  type="checkbox"
                  checked={asAnonymous}
                  onChange={e => setAsAnonymous(e.target.checked)}
                  style={{marginRight:'4px'}}
                />
                Post as Anonymous
              </label>
            </div>
            <textarea
              placeholder="Write a short encouragement..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              maxLength={300}
              rows={3}
              style={{display:'block', width:'100%', marginBottom:'6px', padding:'6px', borderRadius:'4px', border:'1px solid #ccc', boxSizing:'border-box'}}
            />
            <div style={{fontSize:'12px', color:'#999', marginBottom:'6px'}}>{commentText.length}/300</div>
            {status === 'error' && <p style={{color:'#DC2626'}}>Something went wrong. Try again.</p>}
            <button onClick={handleSubmit} disabled={status==='loading'}
              style={{background:'#1B3A6B', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer'}}>
              {status==='loading' ? 'Sending...' : 'Send Encouragement'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}