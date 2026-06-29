import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PrayerCard from '../components/PrayerCard';
import { getRequests, submitPrayerRequest } from '../api/prayerApi';

const CHURCHES = [
  { id: 'st_michael', name: 'AMC Paudpod', tagline: 'Make Disciple of All Nation', icon: '⛪' },
  { id: 'holy_trinity', name: 'AMC Carael', tagline: 'Make Disciple of All Nation', icon: '⛪︎' },
  { id: 'public', name: 'Public Prayers', tagline: 'Open prayer wall for everyone', icon: '🌍' },
];

export default function Home() {
  const [church, setChurch] = useState(null);
  const [viewMode, setViewMode] = useState('all');
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showSubmit, setShowSubmit] = useState(false);
  const [prayerMsg, setPrayerMsg] = useState('');
  const [submitStatus, setSubmitStatus] = useState('idle');
  const visitorName = localStorage.getItem('visitorName') || '';
  const [useAnon, setUseAnon] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showMenuSubmit, setShowMenuSubmit] = useState(false);
  const [menuSubmitChurch, setMenuSubmitChurch] = useState(null);
  const navigate = useNavigate();

  const load = async (id) => {
    setLoading(true);
    try {
      const data = await getRequests(1, id);
      setRequests(data.requests || []);
    } catch { setRequests([]); }
    setLoading(false);
  };

  useEffect(() => { if (church) load(church); }, [church]);

  const churchInfo = CHURCHES.find(c => c.id === church);

  let displayed = [...requests];
  if (viewMode === 'name' && nameFilter)
    displayed = displayed.filter(r => r.display_name?.toLowerCase().includes(nameFilter.toLowerCase()));
  if (viewMode === 'date' && dateFilter)
    displayed = displayed.filter(r => new Date(r.date_added).toISOString().slice(0, 10) === dateFilter);
  if (viewMode === 'name')
    displayed.sort((a, b) => (a.display_name || '').localeCompare(b.display_name || ''));

  const grouped = {};
  if (viewMode !== 'name') {
    displayed.forEach(r => {
      const key = new Date(r.date_added).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(r);
    });
  }
 return (
    <div style={S.pageBg}>

      {/* Hamburger drawer */}
      {showMenu && (
        <div onClick={() => setShowMenu(false)} style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.45)',zIndex:300}}>
          <div onClick={e => e.stopPropagation()} style={{position:'fixed',top:0,left:0,width:'220px',height:'100%',background:'#1B3A6B',display:'flex',flexDirection:'column'}}>
            <div style={{padding:'20px',borderBottom:'1px solid rgba(255,255,255,0.15)',marginBottom:'4px'}}>
              <span style={{color:'#C9A84C',fontWeight:'800',fontSize:'16px'}}>Prayer Wall</span>
            </div>
            {[
              {label:'Pray', action:() => { setChurch(null); setShowMenu(false); }},
              {label:'Submit Prayer', action:() => { setShowMenuSubmit(true); setMenuSubmitChurch('public'); setShowMenu(false); }},
              {label:'My Status', action:() => { navigate('/my-status'); setShowMenu(false); }},
            ].map(item => (
              <button key={item.label} onClick={item.action} style={{background:'none',border:'none',borderBottom:'1px solid rgba(255,255,255,0.08)',color:'#fff',textAlign:'left',padding:'16px 20px',fontSize:'15px',cursor:'pointer',fontFamily:'inherit'}}>
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Submit Prayer from menu */}
      {showMenuSubmit && (
        <div style={{position:'fixed',top:0,left:0,width:'100%',height:'100%',background:'rgba(0,0,0,0.5)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:300,padding:'16px',boxSizing:'border-box'}}>
          <div style={{background:'#fff',borderRadius:'16px',padding:'24px',width:'100%',maxWidth:'420px',boxShadow:'0 16px 48px rgba(0,0,0,0.2)'}}>
            {!menuSubmitChurch ? (
              <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <strong style={{color:'#1B3A6B',fontSize:'15px'}}>Submit a Prayer Request</strong>
                  <button onClick={() => setShowMenuSubmit(false)} style={S.closeBtn}>X</button>
                </div>
                <p style={{color:'#6B7280',fontSize:'13px',margin:'0 0 12px'}}>Choose a church:</p>
                {CHURCHES.map(c => (
                  <button key={c.id} onClick={() => setMenuSubmitChurch(c.id)}
                    style={{display:'block',width:'100%',textAlign:'left',background:'#F8FAFC',border:'1.5px solid #E2E8F0',borderRadius:'10px',padding:'13px 16px',marginBottom:'8px',cursor:'pointer',fontSize:'14px',fontWeight:'600',color:'#1B3A6B',fontFamily:'inherit'}}>
                    {c.name}
                  </button>
                ))}
              </>
            ) : menuSubmitChurch !== 'public' ? (
              <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <strong style={{color:'#1B3A6B',fontSize:'15px'}}>Submit Prayer</strong>
                  <button onClick={() => setShowMenuSubmit(false)} style={S.closeBtn}>X</button>
                </div>
                <div style={{background:'#FEF9EC',border:'1px solid #F6D86B',borderRadius:'8px',padding:'14px',fontSize:'13px',color:'#92620A',marginBottom:'12px'}}>
                  Submit Prayer Request is only available for <strong>Public Prayers</strong>. AMC churches are managed by admin only.
                </div>
                <button onClick={() => setMenuSubmitChurch(null)} style={{background:'none',border:'1.5px solid #1B3A6B',color:'#1B3A6B',borderRadius:'8px',padding:'9px 18px',cursor:'pointer',fontSize:'13px',fontFamily:'inherit'}}>Back</button>
              </>
            ) : submitStatus === 'success' ? (
              <div style={{textAlign:'center',padding:'16px 0'}}>
                <p style={{color:'#16A34A',fontWeight:'700',fontSize:'15px',marginBottom:'6px'}}>Prayer submitted!</p>
                <p style={{color:'#666',fontSize:'13px',marginBottom:'20px'}}>It will appear after review. God bless you!</p>
                <button onClick={() => { setShowMenuSubmit(false); setSubmitStatus('idle'); setPrayerMsg(''); }} style={S.navyBtn}>Close</button>
              </div>
            ) : (
              <>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'16px'}}>
                  <strong style={{color:'#1B3A6B',fontSize:'15px'}}>Submit to Public Prayers</strong>
                  <button onClick={() => { setShowMenuSubmit(false); setSubmitStatus('idle'); setPrayerMsg(''); }} style={S.closeBtn}>X</button>
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.fieldLabel}>Your Name</label>
                  <div style={{display:'flex',gap:'8px',marginBottom:'8px'}}>
                    <button onClick={() => setUseAnon(false)}
                      style={{flex:1,padding:'8px',borderRadius:'8px',border:'1.5px solid',borderColor:!useAnon?'#1B3A6B':'#D1D5DB',background:!useAnon?'#1B3A6B':'#fff',color:!useAnon?'#fff':'#666',cursor:'pointer',fontSize:'13px',fontFamily:'inherit',fontWeight:'600'}}>
                      My Name
                    </button>
                    <button onClick={() => setUseAnon(true)}
                      style={{flex:1,padding:'8px',borderRadius:'8px',border:'1.5px solid',borderColor:useAnon?'#1B3A6B':'#D1D5DB',background:useAnon?'#1B3A6B':'#fff',color:useAnon?'#fff':'#666',cursor:'pointer',fontSize:'13px',fontFamily:'inherit',fontWeight:'600'}}>
                      Anonymous
                    </button>
                  </div>
                  <input value={useAnon ? 'Anonymous' : visitorName} readOnly style={{...S.fieldInput,background:'#F5F5F5',color:'#999'}} />
                </div>
                <div style={S.fieldGroup}>
                  <label style={S.fieldLabel}>Prayer Request</label>
                  <textarea rows={4} placeholder="Share your prayer request..." value={prayerMsg} onChange={e => setPrayerMsg(e.target.value)} style={{...S.fieldInput,resize:'vertical'}} />
                </div>
                {submitStatus === 'error' && <p style={{color:'#DC2626',fontSize:'12px',marginBottom:'8px'}}>Something went wrong. Try again.</p>}
                <button disabled={submitStatus==='loading'} onClick={async () => {
                  if (!prayerMsg.trim()) return;
                  setSubmitStatus('loading');
                  try {
                    full_name: useAnon ? 'Anonymous' : (visitorName||'Anonymous')
                    setSubmitStatus('success');
                  } catch { setSubmitStatus('error'); }
                }} style={S.navyBtn}>{submitStatus==='loading' ? 'Submitting...' : 'Submit'}</button>
              </>
            )}
          </div>
        </div>
      )}

      <div style={S.container}>
        {!church ? (
          <>
            <nav style={S.nav}>
              <span style={S.navBrand}>Prayer Wall</span>
              <button onClick={() => setShowMenu(true)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'22px',color:navy,padding:'4px 8px',lineHeight:1}}>&#9776;</button>
            </nav>
            <div style={S.hero}>
              <h1 style={S.heroTitle}>Prayer Wall</h1>
              <p style={S.heroSub}>We are stronger together in prayer.</p>
              <p style={S.heroDesc}>Choose a church to view and pray for their community.</p>
            </div>
            <div style={S.churchList}>
              {CHURCHES.map(c => (
                <button key={c.id} onClick={() => setChurch(c.id)} style={S.churchCard}>
                  <span style={S.churchIcon}>{c.icon}</span>
                  <div style={S.churchMeta}>
                    <div style={S.churchName}>{c.name}</div>
                    <div style={S.churchTagline}>{c.tagline}</div>
                  </div>
                  <span style={S.chevron}>&#8250;</span>
                </button>
              ))}
            </div>
            <div style={S.footer}>© 2026 Prayer Wall — All Rights Reserved</div>
          </>
        ) : (
          <>
            <nav style={S.nav}>
              <span style={S.navBrand}>Prayer Wall</span>
              <button onClick={() => setShowMenu(true)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'22px',color:navy,padding:'4px 8px',lineHeight:1}}>&#9776;</button>
            </nav>

            <div style={S.hero}>
              <h1 style={S.heroTitle}>Prayer Wall</h1>
              <p style={S.heroSub}>We are stronger together in prayer.</p>
              <button onClick={() => setChurch(null)} style={S.changeBtn}>
                {churchInfo?.icon} {churchInfo?.name} (change)
              </button>
            </div>

            {/* Submit modal (existing) */}
            {showSubmit && (
              <div style={S.overlay}>
                <div style={S.modal}>
                  <div style={S.modalHeader}>
                    <strong style={{ color: '#1B3A6B', fontSize: '15px' }}>Submit a Prayer Request</strong>
                    <button onClick={() => { setShowSubmit(false); setSubmitStatus('idle'); setPrayerMsg(''); }} style={S.closeBtn}>X</button>
                  </div>
                  {submitStatus === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '20px 0' }}>
                      <p style={{ fontSize: '15px', fontWeight: '700', color: '#16A34A', marginBottom: '6px' }}>Prayer submitted!</p>
                      <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>It will appear after review. God bless you!</p>
                      <button onClick={() => { setShowSubmit(false); setSubmitStatus('idle'); setPrayerMsg(''); }} style={S.navyBtn}>Close</button>
                    </div>
                  ) : (
                    <>
                      <div style={S.fieldGroup}>
                        <label style={S.fieldLabel}>Your Name</label>
                        <input value={visitorName} readOnly style={{ ...S.fieldInput, background: '#F5F5F5', color: '#999' }} />
                      </div>
                      <div style={S.fieldGroup}>
                        <label style={S.fieldLabel}>Your Prayer Request</label>
                        <textarea rows={4} placeholder="Share your prayer request..." value={prayerMsg} onChange={e => setPrayerMsg(e.target.value)} style={{ ...S.fieldInput, resize: 'vertical' }} />
                      </div>
                      {submitStatus === 'error' && <p style={{ color: '#DC2626', fontSize: '12px', marginBottom: '8px' }}>Something went wrong. Try again.</p>}
                      <button disabled={submitStatus === 'loading'} onClick={async () => {
                        if (!prayerMsg.trim()) return;
                        setSubmitStatus('loading');
                        try {
                          await submitPrayerRequest({ full_name: visitorName || 'Anonymous', prayer_message: prayerMsg, church: church || 'public' });
                          setSubmitStatus('success');
                        } catch { setSubmitStatus('error'); }
                      }} style={S.navyBtn}>
                        {submitStatus === 'loading' ? 'Submitting...' : 'Submit'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Tabs */}
            <div style={S.tabs}>
              {[['all', 'View All'], ['name', 'By Name'], ['date', 'By Date']].map(([mode, label]) => (
                <button key={mode} onClick={() => setViewMode(mode)} style={viewMode === mode ? S.tabActive : S.tab}>
                  {label}
                </button>
              ))}
            </div>

            {viewMode === 'name' && (
              <input placeholder="Type a name to search..." value={nameFilter} onChange={e => setNameFilter(e.target.value)} style={S.filterInput} />
            )}
            {viewMode === 'date' && (
              <div style={{marginBottom:'12px'}}>
                <select value={dateFilter} onChange={e => setDateFilter(e.target.value)} style={S.filterInput}>
                  <option value="">-- Select a date --</option>
                  {[...new Set(requests.map(r => new Date(r.date_added).toISOString().slice(0,10)))]
                    .sort((a,b) => b.localeCompare(a))
                    .map(date => (
                      <option key={date} value={date}>
                        {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}
                      </option>
                    ))
                  }
                </select>
              </div>
            )}

            {loading ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>Loading prayers...</p>
            ) : displayed.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#888', padding: '40px 0' }}>No prayer requests found.</p>
            ) : viewMode === 'name' ? (
              displayed.map(r => <PrayerCard key={r.id} request={r} />)
            ) : (
              Object.entries(grouped)
                .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                .map(([date, items]) => (
                  <div key={date}>
                    <div style={S.dateHeader}>{date}</div>
                    {items.map(r => <PrayerCard key={r.id} request={r} />)}
                  </div>
                ))
            )}

            <div style={S.footer}>© 2026 Prayer Wall — All Rights Reserved</div>
          </>
        )}
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
    padding: '14px 0', borderBottom: '1px solid #DDE3ED', marginBottom: '24px',
    position: 'sticky', top: 0, background: '#F0F4F9', zIndex: 10,
  },
  navBrand: { fontWeight: '800', color: navy, fontSize: '17px' },
  navBtn: {
    background: 'transparent', border: `1.5px solid ${navy}`, borderRadius: '8px',
    padding: '7px 14px', color: navy, cursor: 'pointer', fontSize: '13px', fontWeight: '600',
    fontFamily: 'inherit',
  },
  hero: { textAlign: 'center', marginBottom: '20px' },
  heroTitle: { fontSize: '30px', color: navy, margin: '0 0 6px', fontFamily: "'Segoe UI', Arial, sans-serif", fontWeight: '800' },
  heroSub: { color: navy, fontWeight: '600', fontSize: '14px', margin: '0 0 10px' },
  heroDesc: { color: '#666', fontSize: '14px', margin: 0 },
  churchList: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px', margin: '0 auto 32px' },
  churchCard: {
    display: 'flex', alignItems: 'center', gap: '14px',
    background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '14px',
    padding: '16px 18px', cursor: 'pointer', textAlign: 'left',
    boxShadow: '0 2px 8px rgba(27,58,107,0.07)', width: '100%', fontFamily: 'inherit',
  },
  churchIcon: { fontSize: '26px', flexShrink: 0 },
  churchMeta: { flex: 1 },
  churchName: { fontWeight: '700', color: navy, fontSize: '15px', marginBottom: '2px' },
  churchTagline: { fontSize: '13px', color: '#777' },
  chevron: { fontSize: '24px', color: '#AAB', fontWeight: '300' },
  changeBtn: {
    background: 'transparent', border: '1.5px solid #CBD5E1', borderRadius: '8px',
    padding: '7px 14px', color: navy, cursor: 'pointer', fontSize: '13px', fontFamily: 'inherit',
  },
  submitBtn: {
    display: 'block', width: '100%', background: navy, color: '#fff',
    border: 'none', borderRadius: '10px', padding: '13px',
    cursor: 'pointer', fontSize: '15px', fontWeight: '700',
    marginBottom: '14px', fontFamily: 'inherit',
    boxShadow: '0 3px 10px rgba(27,58,107,0.25)',
  },
  tabs: { display: 'flex', gap: '8px', marginBottom: '12px' },
  tab: {
    flex: 1, padding: '10px 6px', border: '1.5px solid #DDE3ED',
    borderRadius: '8px', background: '#fff', color: '#666',
    cursor: 'pointer', fontSize: '13px', fontWeight: '500', fontFamily: 'inherit',
  },
  tabActive: {
    flex: 1, padding: '10px 6px', border: `1.5px solid ${navy}`,
    borderRadius: '8px', background: navy, color: '#fff',
    cursor: 'pointer', fontSize: '13px', fontWeight: '700', fontFamily: 'inherit',
  },
  filterInput: {
    width: '100%', padding: '11px 14px', border: '1.5px solid #DDE3ED',
    borderRadius: '8px', fontSize: '14px', fontFamily: 'inherit',
    outline: 'none', marginBottom: '12px', boxSizing: 'border-box', background: '#fff',
  },
  dateHeader: {
    background: navy, color: '#fff', padding: '9px 14px',
    borderRadius: '8px', fontWeight: '700', fontSize: '13px',
    marginBottom: '10px', marginTop: '4px',
  },
  overlay: {
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0,0,0,0.5)', display: 'flex',
    alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '16px',
  },
  modal: {
    background: '#fff', borderRadius: '16px', padding: '24px',
    width: '100%', maxWidth: '460px', boxShadow: '0 16px 48px rgba(0,0,0,0.2)',
  },
  modalHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' },
  closeBtn: {
    background: 'none', border: '1px solid #DDE3ED', borderRadius: '6px',
    width: '28px', height: '28px', cursor: 'pointer', fontSize: '13px', color: '#888', fontFamily: 'inherit',
  },
  fieldGroup: { marginBottom: '14px' },
  fieldLabel: { display: 'block', fontWeight: '600', fontSize: '13px', color: '#333', marginBottom: '6px' },
  fieldInput: {
    display: 'block', width: '100%', padding: '10px 12px',
    border: '1.5px solid #D1D5DB', borderRadius: '8px',
    fontSize: '14px', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box',
  },
  navyBtn: {
    background: navy, color: '#fff', border: 'none', borderRadius: '8px',
    padding: '11px', width: '100%', cursor: 'pointer',
    fontSize: '14px', fontWeight: '700', fontFamily: 'inherit',
  },
  footer: {
    textAlign: 'center', marginTop: '48px', paddingTop: '20px',
    borderTop: '1px solid #DDE3ED', color: '#AAA', fontSize: '12px',
  },
};
