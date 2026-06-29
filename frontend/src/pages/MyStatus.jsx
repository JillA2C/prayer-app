import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkMyStatus } from '../api/prayerApi';

const CHURCH_NAMES = { st_michael: 'AMC Paudpod', holy_trinity: 'AMC Carael', public: 'Public Prayers' };

export default function MyStatus() {
  const [activeTab, setActiveTab] = useState('comments');
  const [prayers, setPrayers] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const visitorName = localStorage.getItem('visitorName') || '';

  useEffect(() => {
    if (!visitorName) { setLoading(false); return; }
    (async () => {
      try {
        const data = await checkMyStatus(visitorName);
        setPrayers(data.requests || []);
        setComments(data.comments || []);
      } catch { setPrayers([]); setComments([]); }
      setLoading(false);
    })();
  }, []);

  const commentsByChurch = {};
  comments.forEach(c => {
    const ch = c.church || 'public';
    if (!commentsByChurch[ch]) commentsByChurch[ch] = [];
    commentsByChurch[ch].push(c);
  });

  return (
    <div style={S.pageBg}>
      <div style={S.container}>
        <nav style={S.nav}>
          <button onClick={() => navigate('/')} style={S.backBtn}>Back</button>
          <h1 style={S.navTitle}>My Status</h1>
          <div style={{ width: '60px' }} />
        </nav>

        {!visitorName ? (
          <p style={S.empty}>No name found. Please go through the entry gate first.</p>
        ) : loading ? (
          <p style={S.empty}>Loading your status...</p>
        ) : (
          <>
            <p style={{color:'#1B3A6B', fontWeight:'600', fontSize:'14px', marginBottom:'16px'}}>
              Showing results for: <strong>{visitorName}</strong>
            </p>

            <div style={S.tabs}>
              <button onClick={() => setActiveTab('comments')} style={activeTab === 'comments' ? S.tabActive : S.tab}>
                Comments
              </button>
              <button onClick={() => setActiveTab('prayers')} style={activeTab === 'prayers' ? S.tabActive : S.tab}>
                Prayer Requests
              </button>
            </div>

            {activeTab === 'comments' && (
              comments.length === 0
                ? <p style={S.empty}>No comments yet for "{visitorName}".</p>
                : Object.entries(commentsByChurch).map(([church, list]) => (
                  <div key={church} style={{ marginBottom: '20px' }}>
                    <div style={S.churchHeader}>{CHURCH_NAMES[church] || church}</div>
                    {list.map((c, i) => (
                      <div key={i} style={c.status === 'deleted' ? S.cardDeleted : c.status === 'approved' ? S.cardApproved : S.cardPending}>
                        <div style={S.cardMeta}>On: <strong>{c.prayer_title}</strong> — {new Date(c.submitted_at).toLocaleDateString()}</div>
                        <p style={{ margin: '0 0 8px', fontSize: '14px', color: c.status === 'deleted' ? '#999' : '#444', fontStyle: c.status === 'deleted' ? 'italic' : 'normal' }}>
                          {c.comment_text || '***'}
                        </p>
                        {c.status === 'approved' && <p style={S.statusGreen}>Visible — your encouragement is showing</p>}
                        {c.status === 'pending' && <p style={S.statusYellow}>Under Review</p>}
                        {c.status === 'deleted' && (
                          <>
                            <p style={S.statusRed}>Deleted — will be permanently removed after 30 days</p>
                            {c.deleted_reason && <p style={S.reason}>Reason: {c.deleted_reason}</p>}
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ))
            )}

            {activeTab === 'prayers' && (
              prayers.length === 0
                ? <p style={S.empty}>No prayer requests yet for "{visitorName}".</p>
                : prayers.map((r, i) => (
                  <div key={i} style={r.status === 'hidden' ? S.cardDeleted : r.status === 'approved' ? S.cardApproved : S.cardPending}>
                    <div style={S.cardMeta}>{new Date(r.date_added).toLocaleDateString()}</div>
                    <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#444' }}>
                      {(r.prayer_message || '').slice(0, 100)}{r.prayer_message?.length > 100 ? '...' : ''}
                    </p>
                    {r.status === 'approved' && <p style={S.statusGreen}>Approved — visible on Prayer Wall</p>}
                    {r.status === 'pending' && <p style={S.statusYellow}>Pending — waiting for admin review</p>}
                    {r.status === 'hidden' && (
                      <>
                        <p style={S.statusRed}>Not approved — will be permanently removed after 30 days</p>
                        {r.reject_reason && <p style={S.reason}>Reason: {r.reject_reason}</p>}
                      </>
                    )}
                  </div>
                ))
            )}
          </>
        )}

        <div style={S.footer}>© 2026 Prayer Wall — All Rights Reserved</div>
      </div>
    </div>
  );
}

const navy = '#1B3A6B';
const S = {
  pageBg: { minHeight: '100vh', background: '#F0F4F9', fontFamily: "'Segoe UI', Arial, sans-serif" },
  container: { maxWidth: '680px', margin: '0 auto', padding: '0 16px 40px' },
  nav: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 0', borderBottom: '1px solid #DDE3ED', marginBottom: '20px',
    position: 'sticky', top: 0, background: '#F0F4F9', zIndex: 10,
  },
  navTitle: { margin: 0, fontSize: '17px', fontWeight: '800', color: navy },
  backBtn: {
    background: 'transparent', border: `1.5px solid ${navy}`, borderRadius: '8px',
    padding: '7px 14px', color: navy, cursor: 'pointer', fontSize: '13px',
    fontWeight: '600', fontFamily: 'inherit',
  },
  tabs: { display: 'flex', gap: '8px', marginBottom: '16px' },
  tab: {
    flex: 1, padding: '10px', border: '1.5px solid #DDE3ED', borderRadius: '8px',
    background: '#fff', color: '#666', cursor: 'pointer', fontSize: '13px',
    fontWeight: '500', fontFamily: 'inherit',
  },
  tabActive: {
    flex: 1, padding: '10px', border: `1.5px solid ${navy}`, borderRadius: '8px',
    background: navy, color: '#fff', cursor: 'pointer', fontSize: '13px',
    fontWeight: '700', fontFamily: 'inherit',
  },
  churchHeader: {
    background: navy, color: '#fff', padding: '9px 14px',
    borderRadius: '8px', fontWeight: '700', fontSize: '13px', marginBottom: '10px',
  },
  cardApproved: { background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '10px', padding: '14px', marginBottom: '10px' },
  cardPending: { background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '14px', marginBottom: '10px' },
  cardDeleted: { background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '10px', padding: '14px', marginBottom: '10px' },
  cardMeta: { fontSize: '12px', color: '#999', marginBottom: '6px' },
  statusGreen: { margin: 0, fontSize: '12px', fontWeight: '700', color: '#16A34A' },
  statusYellow: { margin: 0, fontSize: '12px', fontWeight: '700', color: '#D97706' },
  statusRed: { margin: 0, fontSize: '12px', fontWeight: '700', color: '#DC2626' },
  reason: { margin: '4px 0 0', fontSize: '12px', color: '#666' },
  empty: { textAlign: 'center', color: '#888', padding: '30px 0', fontSize: '14px' },
  footer: {
    textAlign: 'center', marginTop: '48px', paddingTop: '20px',
    borderTop: '1px solid #DDE3ED', color: '#AAA', fontSize: '12px',
  },
};