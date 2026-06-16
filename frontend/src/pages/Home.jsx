import { useState, useEffect } from 'react';
import PrayerCard from '../components/PrayerCard';
import { getRequests, submitPrayerRequest, checkMyStatus } from '../api/prayerApi';

const CHURCHES = [
  { id: 'st_michael', name: 'St. Michael Parish', tagline: 'Growing in Faith, United in Prayer', icon: '⛪' },
  { id: 'holy_trinity', name: 'Holy Trinity Chapel', tagline: 'One Faith, One Family', icon: '✝️' },
  { id: 'public', name: 'Public Prayers', tagline: 'Open prayer wall for everyone', icon: '🌍' }
];

const maskName = (name) => {
  if (!name || name.length <= 2) return '**';
  const first = name[0];
  const last = name[name.length - 1];
  const middle = '*'.repeat(Math.min(name.length - 2, 3));
  return `${first}${middle}${last}`;
};

export default function Home() {
  const [church, setChurch] = useState(null);
  const [viewMode, setViewMode] = useState('all');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [submitForm, setSubmitForm] = useState({ prayer_message: '' });
  const [submitStatus, setSubmitStatus] = useState('idle');
  const [myStatuses, setMyStatuses] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [myCommentStatuses, setMyCommentStatuses] = useState([]);
  const visitorName = localStorage.getItem('visitorName') || '';

  const load = async (churchId) => {
    setLoading(true);
    const data = await getRequests(1, churchId);
    setRequests(data.requests);
    setLoading(false);
  };

  useEffect(() => {
    if (church) load(church);
  }, [church]);

  if (!church) {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <h1 style={styles.title}>Prayer Wall</h1>
          <p style={styles.subtitle}>We are stronger together in prayer.</p>
          <p style={styles.subtitle2}>Choose a church to view and pray for their community.</p>
        </header>
        <div style={styles.churchGrid}>
          {CHURCHES.map(c => (
            <button key={c.id} onClick={() => setChurch(c.id)} style={styles.churchCard}>
              <span style={styles.churchIcon}>{c.icon}</span>
              <div style={{textAlign:'left'}}>
                <div style={styles.churchName}>{c.name}</div>
                <div style={styles.churchTagline}>{c.tagline}</div>
              </div>
              <span style={{marginLeft:'auto', fontSize:'20px'}}>›</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const churchInfo = CHURCHES.find(c => c.id === church);

  let displayed = requests;
  if (viewMode === 'name' && nameFilter) {
    displayed = requests.filter(r =>
      r.display_name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }
  if (viewMode === 'date' && dateFilter) {
    displayed = requests.filter(r =>
      new Date(r.date_added).toISOString().slice(0,10) === dateFilter
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Prayer Wall</h1>
        <button onClick={() => setChurch(null)} style={styles.changeChurch}>
          {churchInfo.icon} {churchInfo.name} (change)
        </button>
      </header>

      {church === 'public' && (
        <div style={{textAlign:'right', marginBottom:'12px'}}>
          <button onClick={() => setShowSubmitForm(true)} style={styles.submitBtn}>
            🙏 Submit a Prayer Request
          </button>
        </div>
      )}

      {showSubmitForm && (
        <div style={styles.overlay}>
          <div style={styles.popup}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
              <h3 style={{margin:0, color:'#1B3A6B'}}>🙏 Submit a Prayer Request</h3>
              <button onClick={() => { setShowSubmitForm(false); setSubmitStatus('idle'); }} style={styles.closeBtn}>✕</button>
            </div>
            {submitStatus === 'success' ? (
              <div style={{textAlign:'center', padding:'20px'}}>
                <p style={{fontSize:'24px'}}>🙏</p>
                <p style={{color:'#16A34A', fontWeight:'600'}}>Prayer request submitted!</p>
                <p style={{color:'#6B7280', fontSize:'14px'}}>It will appear after review. God bless you!</p>
                <button onClick={() => { setShowSubmitForm(false); setSubmitStatus('idle'); setSubmitForm({ prayer_message:'' }); }} style={styles.submitBtn}>Close</button>
              </div>
            ) : (
              <>
                <div style={{marginBottom:'12px'}}>
                  <label style={styles.popupLabel}>Your Name</label>
                  <input value={visitorName} readOnly style={{...styles.popupInput, background:'#f5f5f5', color:'#666'}} />
                </div>
                <div style={{marginBottom:'12px'}}>
                  <label style={styles.popupLabel}>Your Prayer Request</label>
                  <textarea
                    placeholder="Share your prayer request..."
                    rows={4}
                    value={submitForm.prayer_message}
                    onChange={e => setSubmitForm({...submitForm, prayer_message: e.target.value})}
                    style={styles.popupInput}
                  />
                </div>
                {submitStatus === 'error' && <p style={{color:'#DC2626', fontSize:'13px'}}>Something went wrong. Try again.</p>}
                <button
                  disabled={submitStatus === 'loading'}
                  onClick={async () => {
                    if (!submitForm.prayer_message.trim()) { alert('Please enter your prayer request.'); return; }
                    setSubmitStatus('loading');
                    try {
                      await submitPrayerRequest({
                        full_name: visitorName || 'Anonymous',
                        prayer_message: submitForm.prayer_message,
                        church: 'public'
                      });
                      setSubmitStatus('success');
                    } catch { setSubmitStatus('error'); }
                  }}
                  style={styles.submitBtn}>
                  {submitStatus === 'loading' ? 'Submitting...' : '🙏 Submit'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={styles.tabs}>
        <button onClick={() => setViewMode('all')} style={viewMode === 'all' ? styles.tabActive : styles.tab}>📋 View All</button>
        <button onClick={() => setViewMode('name')} style={viewMode === 'name' ? styles.tabActive : styles.tab}>👤 View by Name</button>
        <button onClick={() => setViewMode('date')} style={viewMode === 'date' ? styles.tabActive : styles.tab}>📅 View by Date</button>
        <button onClick={() => setViewMode('status')} style={viewMode === 'status' ? styles.tabActive : styles.tab}>🔍 My Status</button>
      </div>

      {viewMode === 'name' && (
        <input placeholder="Type a name..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} style={styles.filterInput} />
      )}

      {viewMode === 'date' && (
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={styles.filterInput} />
      )}

      {viewMode === 'status' && (
        <div style={{marginBottom:'16px'}}>
          <input
            placeholder="Type your name to check status..."
            value={nameFilter}
            onChange={e => { setNameFilter(e.target.value); setStatusChecked(false); setMyStatuses([]); }}
            style={styles.filterInput}
          />
          <button
            onClick={async () => {
              if (!nameFilter.trim()) { alert('Please enter your name.'); return; }
              setStatusLoading(true);
              setStatusChecked(false);
              const data = await checkMyStatus(nameFilter);
              setMyStatuses(data.requests);
              setMyCommentStatuses(data.comments || []);
              setStatusLoading(false);
              setStatusChecked(true);
            }}
            style={styles.submitBtn}>
            🔍 Check Status
          </button>

          {statusLoading && <p style={{marginTop:'12px', color:'#6B7280'}}>Checking...</p>}

          {statusChecked && myStatuses.length === 0 && (
            <div style={{...styles.statusCard, marginTop:'12px', background:'#F9FAFB', border:'1px solid #E2E8F0'}}>
              <p style={{margin:0}}>No prayer requests found for <strong>{nameFilter}</strong>.</p>
            </div>
          )}

          {myStatuses.map((r, i) => (
            <div key={i} style={{
              ...styles.statusCard,
              marginTop:'12px',
              background: r.status === 'approved' ? '#F0FDF4' : r.status === 'pending' ? '#FFFBEB' : '#FEF2F2',
              border: r.status === 'approved' ? '1px solid #BBF7D0' : r.status === 'pending' ? '1px solid #FDE68A' : '1px solid #FECACA'
            }}>
              <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px'}}>
                <span style={{fontSize:'20px'}}>
                  {r.status === 'approved' ? '✅' : r.status === 'pending' ? '⏳' : '❌'}
                </span>
                <strong>{maskName(r.full_name)}</strong>
                <span style={{fontSize:'12px', color:'#6B7280'}}>{new Date(r.date_added).toLocaleDateString()}</span>
              </div>
              <p style={{margin:'0 0 6px', color:'#555', fontSize:'14px'}}>
                {r.prayer_message?.slice(0, 60)}...
              </p>
              {r.status === 'approved' && <p style={{margin:0, fontSize:'12px', color:'#16A34A', fontWeight:'600'}}>✅ Approved — visible on the Prayer Wall</p>}
              {r.status === 'pending' && <p style={{margin:0, fontSize:'12px', color:'#D97706', fontWeight:'600'}}>⏳ Pending — waiting for admin review</p>}
              {r.status === 'hidden' && (
                <div>
                  <p style={{margin:0, fontSize:'12px', color:'#DC2626', fontWeight:'600'}}>❌ Not approved</p>
                  {r.reject_reason && <p style={{margin:'4px 0 0', fontSize:'13px', color:'#6B7280'}}>Reason: {r.reject_reason}</p>}
                </div>
              )}
            </div>
          ))}

          {myCommentStatuses.length > 0 && (
            <div style={{marginTop:'16px'}}>
              <h4 style={{color:'#1B3A6B', marginBottom:'8px'}}>💬 Your Comments/Encouragements</h4>
              {myCommentStatuses.map((c, i) => (
                <div key={i} style={{
                  padding:'12px', borderRadius:'8px', marginBottom:'8px',
                  background: c.status === 'approved' ? '#F0FDF4' : c.status === 'pending' ? '#FFFBEB' : '#FEF2F2',
                  border: c.status === 'approved' ? '1px solid #BBF7D0' : c.status === 'pending' ? '1px solid #FDE68A' : '1px solid #FECACA'
                }}>
                  <div style={{fontSize:'13px', color:'#6B7280', marginBottom:'4px'}}>
                    On: <strong>{c.prayer_title}</strong> — {new Date(c.submitted_at).toLocaleDateString()}
                  </div>
                  <p style={{margin:'0 0 4px', fontSize:'14px'}}>{c.comment_text}</p>
                  {c.status === 'approved' && <p style={{margin:0, fontSize:'12px', color:'#16A34A', fontWeight:'600'}}>✅ Approved — visible</p>}
                  {c.status === 'pending' && <p style={{margin:0, fontSize:'12px', color:'#D97706', fontWeight:'600'}}>⏳ Pending review</p>}
                  {c.status === 'rejected' && (
                    <div>
                      <p style={{margin:0, fontSize:'12px', color:'#DC2626', fontWeight:'600'}}>❌ Not approved</p>
                      {c.reject_reason && <p style={{margin:'4px 0 0', fontSize:'12px', color:'#6B7280'}}>Reason: {c.reject_reason}</p>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          
        </div>
      )}

      {viewMode !== 'status' && (
        loading ? <p>Loading...</p> :
        displayed.length === 0 ? <p>No prayer requests found.</p> :
        displayed.map(r => <PrayerCard key={r.id} request={r} />)
      )}

      
    </div>
  );
}

const styles = {
  page: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  header: { textAlign: 'center', marginBottom: '24px' },
  title: { color: '#1B3A6B', fontFamily: 'Georgia, serif', margin: '0 0 8px' },
  subtitle: { color: '#1B3A6B', fontWeight: '600', margin: '4px 0' },
  subtitle2: { color: '#6B7280', margin: '4px 0' },
  churchGrid: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px', margin: '0 auto' },
  churchCard: {
    display: 'flex', alignItems: 'center', gap: '12px',
    background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px',
    padding: '16px', cursor: 'pointer', textAlign: 'left', fontSize: '16px'
  },
  churchIcon: { fontSize: '28px' },
  churchName: { fontWeight: '700', color: '#1B3A6B', fontSize: '16px' },
  churchTagline: { fontSize: '13px', color: '#6B7280' },
  changeChurch: {
    background: 'none', border: '1px solid #E2E8F0', borderRadius: '6px',
    padding: '6px 12px', color: '#1B3A6B', cursor: 'pointer', fontSize: '13px', marginTop: '8px'
  },
  tabs: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  tab: {
    flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px',
    background: '#fff', color: '#6B7280', cursor: 'pointer', fontSize: '14px'
  },
  tabActive: {
    flex: 1, padding: '10px', border: '1px solid #1B3A6B', borderRadius: '6px',
    background: '#1B3A6B', color: '#fff', cursor: 'pointer', fontSize: '14px'
  },
  filterInput: {
    width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px',
    marginBottom: '8px', boxSizing: 'border-box'
  },
  submitBtn: {
    background:'#1B3A6B', color:'white', border:'none', padding:'10px 16px',
    borderRadius:'6px', cursor:'pointer', fontSize:'14px'
  },
  overlay: {
    position:'fixed', top:0, left:0, width:'100%', height:'100%',
    background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center',
    justifyContent:'center', zIndex:1000
  },
  popup: {
    background:'#fff', borderRadius:'12px', padding:'20px',
    width:'90%', maxWidth:'480px', boxShadow:'0 8px 24px rgba(0,0,0,0.2)'
  },
  closeBtn: {
    background:'none', border:'1px solid #ccc', borderRadius:'6px',
    padding:'4px 10px', cursor:'pointer', fontSize:'14px'
  },
  popupLabel: { display:'block', fontWeight:'600', marginBottom:'4px', fontSize:'14px', color:'#333' },
  popupInput: {
    display:'block', width:'100%', padding:'8px', border:'1px solid #ccc',
    borderRadius:'6px', fontSize:'14px', boxSizing:'border-box'
  },
  statusCard: {
    background:'#F0FDF4', border:'1px solid #BBF7D0', borderRadius:'8px',
    padding:'12px', marginBottom:'8px'
  }
};