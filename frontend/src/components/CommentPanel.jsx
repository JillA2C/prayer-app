import { useState, useEffect } from 'react';
import { getComments, submitComment } from '../api/prayerApi';

export default function CommentPanel({ requestId }) {
  const [comments, setComments] = useState([]);
  const [form, setForm] = useState({ visitor_name: '', comment_text: '' });
  const [status, setStatus] = useState('idle');

  useEffect(() => {
    getComments(requestId).then(d => setComments(d.comments));
  }, [requestId]);

  const handleSubmit = async () => {
    if (form.comment_text.trim().length < 5) return;
    setStatus('loading');
    try {
      await submitComment(requestId, form);
      setStatus('success');
      setForm({ visitor_name: '', comment_text: '' });
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
                {new Date(c.approved_at).toLocaleDateString()}
              </span>
              <p style={{margin:'4px 0 0'}}>{c.comment_text}</p>
            </div>
          ))
      }

      <div style={{marginTop:'10px'}}>
        <h4 style={{margin:'0 0 6px'}}>Leave an Encouragement</h4>
        {status === 'success' ? (
          <p style={{color:'#16A34A'}}>Thank you! Your encouragement will appear shortly.</p>
        ) : (
          <>
            <input
              placeholder="Your name (optional)"
              value={form.visitor_name}
              onChange={e => setForm({...form, visitor_name: e.target.value})}
              maxLength={80}
              style={{display:'block', width:'100%', marginBottom:'6px', padding:'6px'}}
            />
            <textarea
              placeholder="Write a short encouragement..."
              value={form.comment_text}
              onChange={e => setForm({...form, comment_text: e.target.value})}
              maxLength={300}
              rows={3}
              style={{display:'block', width:'100%', marginBottom:'6px', padding:'6px'}}
            />
            <div style={{fontSize:'12px', color:'#999'}}>{form.comment_text.length}/300</div>
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