import { useState, useEffect } from 'react';
import { adminGetComments, adminApproveComment, adminRejectComment } from '../../api/prayerApi';

export default function Comments() {
  const [comments, setComments] = useState([]);

  const load = async () => {
    const data = await adminGetComments('pending');
    setComments(data.comments);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => { await adminApproveComment(id); load(); };
  const handleReject = async (id) => { await adminRejectComment(id); load(); };

  return (
    <div style={{maxWidth:'800px', margin:'0 auto', padding:'20px', fontFamily:'sans-serif'}}>
      <h2 style={{color:'#1B3A6B'}}>Pending Comments</h2>
      <a href="/admin/dashboard">&larr; Back to Dashboard</a>

      {comments.length === 0 ? <p>No pending comments.</p> :
        comments.map(c => (
          <div key={c.id} style={{background:'#FEF3C7', padding:'12px', borderRadius:'6px', marginTop:'12px'}}>
            <strong>{c.visitor_name}</strong> on <em>{c.prayer_title}</em>
            <p style={{margin:'6px 0'}}>{c.comment_text}</p>
            <button onClick={() => handleApprove(c.id)}
              style={{background:'#16A34A', color:'white', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer', marginRight:'6px'}}>
              Approve
            </button>
            <button onClick={() => handleReject(c.id)}
              style={{background:'#DC2626', color:'white', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer'}}>
              Reject
            </button>
          </div>
        ))
      }
    </div>
  );
}