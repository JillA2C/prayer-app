import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrayerCard from '../components/PrayerCard';
import { getRequests, submitPrayerRequest } from '../api/prayerApi';

const CHURCHES = [
  { id: 'st_michael', name: 'AMC Paudpod', tagline: 'Growing in Faith, United in Prayer', icon: '鉀�', color: '#1B3A6B' },
  { id: 'holy_trinity', name: 'AMC Carael', tagline: 'One Faith, One Family', icon: '鉁濓笍', color: '#6B21A8' },
  { id: 'public', name: 'Public Prayers', tagline: 'Open prayer wall for everyone', icon: '馃實', color: '#0F766E' },
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

  useEffect(() => { if (church) load(church); }, [church]);

  // Church selection screen
  if (!church) {
    return (
      <div style={S.page}>
        <nav style={S.nav}>
          <span style={S.navLogo}>馃檹 Prayer Wall</span>
          <button onClick={() => navigate('/my-status')} style={S.navBtn}>馃攳 My Status</button>
        </nav>
        <div style={S.heroSection}>
          <h1 style={S.heroTitle}>Prayer Wall</h1>
          <p style={S.heroSub}>We are stronger together in prayer.</p>
          <p style={S.heroDesc}>Choose a church to view and pray for their community.</p>
        </div>
        <div style={S.churchList}>
          {CHURCHES.map(c => (
            <button key={c.id} onClick={() => setChurch(c.id)} style={S.churchCard}>
              <div style={{ ...S.churchIconBox, background: c.color }}>
                <span style={{ fontSize: '22px' }}>{c.icon}</span>
              </div>
              <div style={S.churchText}>
                <div style={S.churchName}>{c.name}</div>
                <div style={S.churchTagline}>{c.tagline}</div>
              </div>
              <span style={S.chevron}>鈥�</span>
            </button>
          ))}
        </div>
        <footer style={S.footer}>漏 2026 Prayer Wall 鈥� All Rights Reserved</footer>
      </div>
    );
  }

  const churchInfo = CHURCHES.find(c => c.id === church);
  let displayed = requests;
  if (viewMode === 'name' && nameFilter)
    displayed = requests.filter(r => r.display_name.toLowerCase().includes(nameFilter.toLowerCase()));
  if (viewMode === 'date' && dateFilter)
    displayed = requests.filter(r => new Date(r.date_added).toISOString().slice(0,10) === dateFilter);

  return (
    <div style={S.page}>
      <nav style={S.nav}>
        <span style={S.navLogo}>馃檹 Prayer Wall</span>
        <button onClick={() => navigate('/my-status')} style={S.navBtn}>馃攳 My Status</button>
      </nav>

      <div style={S.heroSection}>
        <h1 style={S.heroTitle}>Prayer Wall</h1>
        <button onClick={() => setChurch(null)} style={S.changeChurchBtn}>
          {churchInfo.icon} {churchInfo.name} (change)
        </button>
      </div>

      {church === 'public' && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
          <button onClick={() => setShowSubmitForm(true)} style={S.submitPrayerBtn}>
            馃檹 Submit a Prayer Request
          </button>
        </div>
      )}

      {showSubmitForm && (
        <div style={S.overlay}>
          <div style={S.popup}>
            <div style={S.popupHeader}>
              <h3 style={{ margin: 0, color: '#1B3A6B', fontSize: '16px' }}>馃檹 Submit a Prayer Request</h3>
              <button onClick={() => { setShowSubmitForm(false); setSubmitStatus('idle'); }} style={S.closeBtn}>鉁�</button>
            </div>
            {submitStatus === 'success' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ fontSize: '36px', marginBottom: '12px' }}>馃檹</p>
                <p style={{ color: '#16A34A', fontWeight: '700', fontSize: '16px', marginBottom: '6px' }}>Prayer request submitted!</p>
                <p style={{ color: '#6B7280', fontSize: '13px', marginBottom: '20px' }}>It will appear after review. God bless you!</p>
                <button onClick={() => { setShowSubmitForm(false); setSubmitStatus('idle'); setSubmitForm({ prayer_message: '' }); }} style={S.submitPrayerBtn}>Close</button>
              </div>
            ) : (
              <>
                <div style={S.popupField}>
                  <label style={S.popupLabel}>Your Name</label>
                  <input value={visitorName} readOnly style={{ ...S.popupInput, background: '#F9FAFB', color: '#9CA3AF' }} />
                </div>
                <div style={S.popupField}>
                  <label style={S.popupLabel}>Your Prayer Request</label>
                  <textarea
                    placeholder="Share your prayer request..."
                    rows={4}
                    value={submitForm.prayer_message}
                    onChange={e => setSubmitForm({ ...submitForm, prayer_message: e.target.value })}
                    style={{ ...S.popupInput, resize: 'vertical' }}
                  />
                </div>
                {submitStatus === 'error' && <p style={{ color: '#DC2626', fontSize: '13px', marginBottom: '10px' }}>Something went wrong. Try again.</p>}
                <button
                  disabled={submitStatus === 'loading'}
                  onClick={async () => {
                    if (!submitForm.prayer_message.trim()) { alert('Please enter your prayer request.'); return; }
                    setSubmitStatus('loading');
                    try {
                      await submitPrayerRequest({ full_name: visitorName || 'Anonymous', prayer_message: submitForm.prayer_message, church: 'public' });
                      setSubmitStatus('success');
                    } catch { setSubmitStatus('error'); }
                  }}
                  style={S.submitPrayerBtn}>
                  {submitStatus === 'loading' ? 'Submitting...' : '馃檹 Submit'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={S.tabs}>
        {[['all','馃搵 View All'],['name','馃懁 By Name'],['date','馃搮 By Date']].map(([mode,label]) => (
          <button key={mode} onClick={() => setViewMode(mode)} style={viewMode === mode ? S.tabActive : S.tab}>{label}</button>
        ))}
      </div>

      {viewMode === 'name' && (
        <input placeholder="Type a name..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} style={S.filterInput} />
      )}
      {viewMode === 'date' && (
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={S.filterInput} />
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>Loading prayers...</div>
      ) : displayed.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#6B7280' }}>No prayer requests found.</div>
      ) : viewMode === 'name' ? (
        [...displayed].sort((a,b) => a.display_name.localeCompare(b.display_name)).map(r => <PrayerCard key={r.id} request={r} />)
      ) : (
        (() => {
          const groups = {};
          displayed.forEach(r => {
            const key = new Date(r.date_added).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(r);
          });
          return Object.entries(groups).sort((a,b) => new Date(b[0]) - new Date(a[0])).map(([date, entries]) => (
            <div key={date} style={{ marginBottom: '24px' }}>
              <div style={S.dateHeader}>馃搮 {date}</div>
              {entries.map(r => <PrayerCard key={r.id} request={r} />)}
            </div>
          ));
        })()
      )}

      <footer style={S.footer}>漏 2026 Prayer Wall 鈥� All Rights Reserved</footer>
    </div>
  );
}

const S = {
  page: { maxWidth: '680px', margin: '0 auto', padding: '0 16px 32px', fontFamily: 'inherit' },
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '16px 0', borderBottom: '1px solid #E2E8F0', marginBottom: '24px',
    position: 'sticky', top: 0, background: '#F0F4F9', zIndex: 10,
  },
  navLogo: { fontWeight: '700', color: '#1B3A6B', fontSize: '17px', letterSpacing: '-0.3px' },
  navBtn: {
    background: 'transparent', border: '1.5px solid #1B3A6B', borderRadius: '8px',
    padding: '7px 14px', color: '#1B3A6B', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
  },
  heroSection: { textAlign: 'center', marginBottom: '28px' },
  heroTitle: { fontSize: '32px', color: '#1B3A6B', marginBottom: '10px' },
  heroSub: { color: '#1B3A6B', fontWeight: '600', fontSize: '15px', marginBottom: '4px' },
  heroDesc: { color: '#6B7280', fontSize: '14px' },
  churchList: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '480px', margin: '0 auto 32px' },
  churchCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '14px',
    padding: '16px', cursor: 'pointer', textAlign: 'left',
    boxShadow: '0 2px 8px rgba(27,58,107,0.08)', transition: 'box-shadow 0.2s, transform 0.1s',
    width: '100%',
  },
  churchIconBox: {
    width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  churchText: { flex: 1 },
  churchName: { fontWeight: '700', color: '#1B3A6B', fontSize: '15px', marginBottom: '2px' },
  churchTagline: { fontSize: '13px', color: '#6B7280' },
  chevron: { fontSize: '22px', color: '#9CA3AF' },
  changeChurchBtn: {
    background: 'transparent', border: '1.5px solid #CBD5E1', borderRadius: '8px',
    padding: '7px 14px', color: '#1B3A6B', cursor: 'pointer', fontSize: '13px', marginTop: '10px',
  },
  submitPrayerBtn: {
    background: '#1B3A6B', color: '#fff', border: 'none',
    padding: '11px 20px', borderRadius: '9px', cursor: 'pointer',
    fontSize: '14px', fontWeight: '600', boxShadow: '0 2px 8px rgba(27,58,107,0.25)',
  },
  overlay: {
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', zIndex: 1000, padding: '16px',
  },
  popup: {
    background: '#fff', borderRadius: '16px', padding: '24px',
    width: '100%', maxWidth: '480px', boxShadow: '0 16px 48px rgba(0,0,0,0.25)',
  },
  popupHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
  closeBtn: {
    background: 'transparent', border: '1px solid #E2E8F0', borderRadius: '6px',
    width: '30px', height: '30px', cursor: 'pointer', fontSize: '14px', color: '#6B7280',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  popupField: { marginBottom: '14px' },
  popupLabel: { display: 'block', fontWeight: '600', marginBottom: '6px', fontSize: '13px', color: '#374151' },
  popupInput: {
    display: 'block', width: '100%', padding: '10px 12px', border: '1.5px solid #D1D5DB',
    borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
  },
  tabs: { display: 'flex', gap: '8px', marginBottom: '14px' },
  tab: {
    flex: 1, padding: '10px 6px', border: '1.5px solid #E2E8F0', borderRadius: '8px',
    background: '#fff', color: '#6B7280', cursor: 'pointer', fontSize: '13px', fontWeight: '500',
  },
  tabActive: {
    flex: 1, padding: '10px 6px', border: '1.5px solid #1B3A6B', borderRadius: '8px',
    background: '#1B3A6B', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '600',
  },
  filterInput: {
    width: '100%', padding: '11px 14px', border: '1.5px solid #D1D5DB',
    borderRadius: '8px', marginBottom: '14px', fontSize: '14px', fontFamily: 'inherit', outline: 'none',
  },
  dateHeader: {
    background: '#1B3A6B', color: '#fff', padding: '9px 14px',
    borderRadius: '8px', fontWeight: '600', fontSize: '13px', marginBottom: '10px',
  },
  footer: { textAlign: 'center', marginTop: '48px', paddingTop: '20px', borderTop: '1px solid #E2E8F0', color: '#9CA3AF', fontSize: '12px' },
};
