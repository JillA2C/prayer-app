import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkMyStatus } from '../api/prayerApi';

const CHURCH_NAMES = {
  st_michael: 'AMC Paudpod',
  holy_trinity: 'AMC Carael',
  public: 'Public Prayers'
};

const maskName = (name) => {
  if (!name || name.length <= 2) return '**';
  const first = name[0];
  const last = name[name.length - 1];
  return `${first}${'*'.repeat(Math.min(name.length - 2, 3))}${last}`;
};

export default function MyStatus() {
  const [nameInput, setNameInput] = useState('');
  const [activeTab, setActiveTab] = useState('comments');
  const [prayers, setPrayers] = useState([]);
  const [comments, setComments] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!nameInput.trim()) { alert('Please enter your name.'); return; }
    setLoading(true);
    setSearched(false);
    const data = await checkMyStatus(nameInput);
    setPrayers(data.requests || []);
    setComments(data.comments || []);
    setLoading(false);
    setSearched(true);
  };

  // Group comments by church
  const commentsByChurch = {};
  comments.forEach(c => {
    const church = c.church || 'public';
    if (!commentsByChurch[church]) commentsByChurch[church] = [];
    commentsByChurch[church].push(c);
  });

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button onClick={() => navigate('/')} style={styles.backBtn}>← Back</button>
        <h1 style={styles.title}>🔍 Check My Status</h1>
      </header>

      <div style={styles.searchBox}>
        <input
          placeholder="Type your name here..."
          value={nameInput}
          onChange={e => setNameInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          style={styles.searchInput}
        />
        <button onClick={handleSearch} style={styles.searchBtn}>
          {loading ? 'Searching...' : '🔍 Search'}
        </button>
      </div>

      {searched && (
        <>
          <div style={styles.tabs}>
            <button onClick={() => setActiveTab('comments')}
              style={activeTab === 'comments' ? styles.tabActive : styles.tab}>
              💬 Comments
            </button>
            <button onClick={() => setActiveTab('prayers')}
              style={activeTab === 'prayers' ? styles.tabActive : styles.tab}>
              🙏 Prayer Requests
            </button>
          </div>

          {/* COMMENTS TAB */}
          {activeTab === 'comments' && (
            <div>
              {comments.length === 0 ? (
                <p style={{color:'#6B7280'}}>No comments found for <strong>{nameInput}</strong>.</p>
              ) : (
                Object.entries(commentsByChurch).map(([church, churchComments]) => (
                  <div key={church} style={{marginBottom:'20px'}}>
                    <div style={styles.churchHeader}>
                      {church === 'st_michael' ? '⛪' : church === 'holy_trinity' ? '✝️' : '🌍'}
                      {' '}{CHURCH_NAMES[church] || church}
                    </div>
                    {churchComments.map((c, i) => (
                      <div key={i} style={{
                        ...styles.statusCard,
                       background: c.status === 'approved' ? '#F0FDF4' : c.status === 'pending' ? '#FFFBEB' : c.status === 'deleted' ? '#F9FAFB' : '#FEF2F2',
                  border: c.status === 'approved' ? '1px solid #BBF7D0' : c.status === 'pending' ? '1px solid #FDE68A' : c.status === 'deleted' ? '1px solid #E2E8F0' : '1px solid #FECACA'
                      }}>
                        <div style={{fontSize:'13px', color:'#6B7280', marginBottom:'4px'}}>
                          On: <strong>{c.prayer_title}</strong> — {new Date(c.submitted_at).toLocaleDateString()}
                        </div>
                        <p style={{margin:'0 0 6px', fontSize:'14px', color: c.status === 'deleted' ? '#9CA3AF' : '#555', fontStyle: c.status === 'deleted' ? 'italic' : 'normal'}}>
                    {c.comment_text}
                  </p>
                  {c.status === 'approved' && (
                    <p style={styles.statusApproved}>✅ Visible — your encouragement is showing</p>
                  )}
                  {c.status === 'pending' && (
                    <p style={styles.statusPending}>⏳ Under Review</p>
                  )}
                  {c.status === 'deleted' && (
                    <div>
                      <p style={styles.statusRejected}>🗑️ Removed by admin</p>
                      {c.deleted_reason && <p style={{margin:'4px 0 0', fontSize:'12px', color:'#6B7280'}}>Reason: {c.deleted_reason}</p>}
                    </div>
                  )}
                      </div>
                    ))}
                  </div>
                ))
              )}
            </div>
          )}

          {/* PRAYERS TAB */}
          {activeTab === 'prayers' && (
            <div>
              {prayers.length === 0 ? (
                <p style={{color:'#6B7280'}}>No prayer requests found for <strong>{nameInput}</strong>.</p>
              ) : (
                prayers.map((r, i) => (
                  <div key={i} style={{
                    ...styles.statusCard,
                    background: r.status === 'approved' ? '#F0FDF4' : r.status === 'pending' ? '#FFFBEB' : '#FEF2F2',
                    border: r.status === 'approved' ? '1px solid #BBF7D0' : r.status === 'pending' ? '1px solid #FDE68A' : '1px solid #FECACA'
                  }}>
                    <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px'}}>
                      <span>{r.status === 'approved' ? '✅' : r.status === 'pending' ? '⏳' : '❌'}</span>
                      <strong>{maskName(r.full_name)}</strong>
                      <span style={{fontSize:'12px', color:'#6B7280'}}>{new Date(r.date_added).toLocaleDateString()}</span>
                    </div>
                    <p style={{margin:'0 0 6px', fontSize:'14px'}}>{r.prayer_message?.slice(0,80)}...</p>
                    {r.status === 'approved' && <p style={styles.statusApproved}>✅ Approved — visible on Prayer Wall</p>}
                    {r.status === 'pending' && <p style={styles.statusPending}>⏳ Pending — waiting for admin review</p>}
                    {r.status === 'hidden' && (
                      <div>
                        <p style={styles.statusRejected}>❌ Not approved</p>
                        {r.reject_reason && <p style={{margin:'4px 0 0', fontSize:'12px', color:'#6B7280'}}>Reason: {r.reject_reason}</p>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}

      <footer style={styles.footer}>© 2026 Prayer Wall — All Rights Reserved</footer>
    </div>
  );
}

const styles = {
  page: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  header: { display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' },
  backBtn: { background:'none', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', fontSize:'13px', color:'#1B3A6B' },
  title: { color:'#1B3A6B', margin:0, fontFamily:'Georgia, serif' },
  searchBox: { display:'flex', gap:'8px', marginBottom:'20px' },
  searchInput: { flex:1, padding:'10px', border:'1px solid #ccc', borderRadius:'6px', fontSize:'14px' },
  searchBtn: { background:'#1B3A6B', color:'white', border:'none', padding:'10px 16px', borderRadius:'6px', cursor:'pointer', fontSize:'14px', whiteSpace:'nowrap' },
  tabs: { display:'flex', gap:'8px', marginBottom:'16px' },
  tab: { flex:1, padding:'10px', border:'1px solid #E2E8F0', borderRadius:'6px', background:'#fff', color:'#6B7280', cursor:'pointer', fontSize:'14px' },
  tabActive: { flex:1, padding:'10px', border:'1px solid #1B3A6B', borderRadius:'6px', background:'#1B3A6B', color:'#fff', cursor:'pointer', fontSize:'14px' },
  churchHeader: { background:'#1B3A6B', color:'white', padding:'8px 12px', borderRadius:'6px', fontWeight:'600', fontSize:'14px', marginBottom:'8px' },
  statusCard: { borderRadius:'8px', padding:'12px', marginBottom:'8px' },
  statusApproved: { margin:0, fontSize:'12px', color:'#16A34A', fontWeight:'600' },
  statusPending: { margin:0, fontSize:'12px', color:'#D97706', fontWeight:'600' },
  statusRejected: { margin:0, fontSize:'12px', color:'#DC2626', fontWeight:'600' },
  footer: { textAlign:'center', marginTop:'40px', paddingTop:'20px', borderTop:'1px solid #E2E8F0', color:'#6B7280', fontSize:'13px' }
};