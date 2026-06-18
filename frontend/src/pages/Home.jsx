import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrayerCard from '../components/PrayerCard';
import { getRequests, submitPrayerRequest } from '../api/prayerApi';

const CHURCHES = [
  { id: 'st_michael', name: 'AMC Paudpod', tagline: 'Growing in Faith, United in Prayer', icon: '⛪' },
  { id: 'holy_trinity', name: 'AMC Carael', tagline: 'One Faith, One Family', icon: '✝️' },
  { id: 'public', name: 'Public Prayers', tagline: 'Open prayer wall for everyone', icon: '🌍' }
];

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
  const visitorName = localStorage.getItem('visitorName') || '';
  const navigate = useNavigate();

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
        <button onClick={() => navigate('/my-status')} style={styles.statusBtn}>
          🔍 Check My Status
        </button>
        <footer style={styles.footer}>© 2026 Prayer Wall — All Rights Reserved</footer>
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
        <button onClick={() => setViewMode('name')} style={viewMode === 'name' ? styles.tabActive : styles.tab}>👤 By Name</button>
        <button onClick={() => setViewMode('date')} style={viewMode === 'date' ? styles.tabActive : styles.tab}>📅 By Date</button>
      </div>

      {viewMode === 'name' && (
        <input placeholder="Type a name..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} style={styles.filterInput} />
      )}
      {viewMode === 'date' && (
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={styles.filterInput} />
      )}

      {loading ? <p>Loading...</p> :
        displayed.length === 0 ? <p>No prayer requests found.</p> :
        viewMode === 'name' ? (
          [...displayed]
            .sort((a,b) => a.display_name.localeCompare(b.display_name))
            .map(r => <PrayerCard key={r.id} request={r} />)
        ) : (
          (() => {
            const groups = {};
            displayed.forEach(r => {
              const dateKey = new Date(r.date_added).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
              if (!groups[dateKey]) groups[dateKey] = [];
              groups[dateKey].push(r);
            });
            return Object.entries(groups)
              .sort((a,b) => new Date(b[0]) - new Date(a[0]))
              .map(([date, entries]) => (
                <div key={date} style={{marginBottom:'24px'}}>
                  <div style={{background:'#1B3A6B', color:'white', padding:'8px 14px', borderRadius:'8px', fontWeight:'600', fontSize:'14px', marginBottom:'10px'}}>
                    📅 {date}
                  </div>
                  {entries.map(r => <PrayerCard key={r.id} request={r} />)}
                </div>
              ));
          })()
        )
      }

      <footer style={styles.footer}>© 2026 Prayer Wall — All Rights Reserved</footer>
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
  statusBtn: {
    display: 'block', width: '100%', maxWidth: '500px', margin: '12px auto 0',
    background: 'none', border: '1px solid #1B3A6B', borderRadius: '10px',
    padding: '14px 16px', cursor: 'pointer', fontSize: '15px', color: '#1B3A6B', fontWeight: '600'
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
  footer: {
    textAlign:'center', marginTop:'40px', paddingTop:'20px',
    borderTop:'1px solid #E2E8F0', color:'#6B7280', fontSize:'13px'
  }
};