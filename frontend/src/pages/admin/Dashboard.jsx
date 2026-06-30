import PrayerCard from '../../components/PrayerCard';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  adminGetRequests, adminAddRequest, adminEditRequest, adminDeleteRequest,
  adminGetComments, adminDeleteComment,
 adminGetPendingRequests, adminApproveRequest, adminRejectRequest,
  checkMyStatus, adminGetGames, adminAddGame, adminEditGame, adminDeleteGame
} from '../../api/prayerApi';

const CHURCHES = [
  { id: 'st_michael', name: 'AMC Paudpod', tagline: 'Make Disciple of All Nation', icon: '⛪' },
  { id: 'holy_trinity', name: 'AMC Carael', tagline: 'Make Disciple of All Nation', icon: '✝️' },
  { id: 'public', name: 'Public Prayers', tagline: 'Open prayer wall for everyone', icon: '🌍' }
];

export default function Dashboard() {
  
  const [church, setChurch] = useState(null);
  const [showGames, setShowGames] = useState(false);
  const [games, setGames] = useState([]);
  const [gameForm, setGameForm] = useState({ answer:'', hint1:'', hint2:'', hint3:'', difficulty:'easy' });
  const [editingGameId, setEditingGameId] = useState(null);
  const [adminTab, setAdminTab] = useState('manage');
  const [requests, setRequests] = useState([]);
  const [comments, setComments] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState({ full_name:'', prayer_message:'' });
  const [editingId, setEditingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectCommentReason, setRejectCommentReason] = useState('');
  const [rejectingCommentId, setRejectingCommentId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [publicView, setPublicView] = useState('all');
  const [publicRequests, setPublicRequests] = useState([]);
  const [publicChurch, setPublicChurch] = useState(null);
  const [showPublicView, setShowPublicView] = useState(false);
  const [publicMyStatus, setPublicMyStatus] = useState(false);
  const [publicStatusName, setPublicStatusName] = useState('');
  const [publicStatusResults, setPublicStatusResults] = useState({ requests: [], comments: [] });
  const [publicStatusLoading, setPublicStatusLoading] = useState(false);
  const [publicSearch, setPublicSearch] = useState('');
  const [publicDateFilter, setPublicDateFilter] = useState('');
  const [myStatuses, setMyStatuses] = useState([]);
  const [myComments, setMyComments] = useState([]);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusChecked, setStatusChecked] = useState(false);
  const [showTextLayout, setShowTextLayout] = useState(false);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth()); // 0-indexed
  const [calSelYear, setCalSelYear] = useState(new Date().getFullYear());
  const [calYearPage, setCalYearPage] = useState(0);
  const [calDatePage, setCalDatePage] = useState(0);
  const navigate = useNavigate();

  const load = async () => {
    const data = await adminGetRequests();
    const filtered = data.requests
    
  .filter(r => r.church === church)
  .filter(r => church === 'public' ? true : r.status !== 'pending')
  .map(r => ({
    ...r,
    display_name: r.show_name ? r.full_name : 'Anonymous',
    prayer_message: r.prayer_message || '',
    preview: r.prayer_message?.slice(0, 200)
  }));
    setRequests(filtered);
  };

  const loadComments = async () => {
    const data = await adminGetComments();
    setComments(data.comments.filter(c => c.church === church));
  };

  const loadPendingRequests = async () => {
    const data = await adminGetPendingRequests();
    setPendingRequests(data.requests);
  };

  const loadGames = async () => {
    const data = await adminGetGames();
    console.log('Games loaded:', data);
    setGames(data.games);
  };

  const handleSaveGame = async () => {
    if (!gameForm.answer.trim() || !gameForm.hint1.trim()) {
      alert('Answer and Hint 1 are required.');
      return;
    }
    if (editingGameId) {
      await adminEditGame(editingGameId, { ...gameForm, active: true });
    } else {
      await adminAddGame(gameForm);
    }
    setGameForm({ answer:'', hint1:'', hint2:'', hint3:'', difficulty:'easy' });
    setEditingGameId(null);
    loadGames();
  };

  const handleEditGame = (g) => {
    setGameForm({ answer: g.answer, hint1: g.hint1, hint2: g.hint2 || '', hint3: g.hint3 || '', difficulty: g.difficulty });
    setEditingGameId(g.id);
  };

  const handleDeleteGame = async (id) => {
    if (!confirm('Delete this game?')) return;
    await adminDeleteGame(id);
    loadGames();
  };

  const handleToggleGame = async (g) => {
    await adminEditGame(g.id, { answer: g.answer, hint1: g.hint1, hint2: g.hint2, hint3: g.hint3, difficulty: g.difficulty, active: !g.active });
    loadGames();
  };

  useEffect(() => {
    if (church) { load(); loadComments(); loadPendingRequests(); }
  }, [church]);

  const resetForm = () => {
    setForm({ full_name:'', prayer_message:'' });
    setEditingId(null);
    setSaveStatus('idle');
  };

  const handleSave = async () => {
    if (!selectedDate) { alert('Please select a date first.'); return; }
    if (!form.full_name.trim()) { alert('Please enter a name.'); return; }
    if (!form.prayer_message.trim()) { alert('Please enter a prayer request.'); return; }
    setSaveStatus('loading');
    try {
      const payload = {
        full_name: form.full_name,
        prayer_title: 'Prayer Request',
        prayer_message: form.prayer_message,
        show_name: true,
        church,
        date_override: selectedDate
      };
      if (editingId) {
        await adminEditRequest(editingId, { ...payload, status: 'approved' });
      } else {
        await adminAddRequest(payload);
      }
      setSaveStatus('success');
      setForm({ full_name:'', prayer_message:'' });
      setEditingId(null);
      load();
    } catch {
      setSaveStatus('error');
    }
  };

  const handleEdit = (r) => {
    setForm({ full_name: r.full_name, prayer_message: r.prayer_message });
    setEditingId(r.id);
    setAdminTab('manage');
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this request permanently?')) return;
    await adminDeleteRequest(id);
    load();
  };

  const handleDeleteComment = async (id, reason='') => {
    await adminDeleteComment(id, reason);
    loadComments();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  const handleChangeChurch = () => {
    resetForm();
    setChurch(null);
    setAdminTab('manage');
    setSelectedDate('');
  };

  const toLocalDate = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`; };
  const requestsForDate = selectedDate
    ? requests.filter(r => toLocalDate(r.date_added) === selectedDate)
    : requests;

  // Group comments by the date of their prayer request
  const commentsByDate = {};
  comments.forEach(c => {
    const dateKey = new Date(c.submitted_at).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
    if (!commentsByDate[dateKey]) commentsByDate[dateKey] = [];
    commentsByDate[dateKey].push(c);
  });

  const pubCalSource = publicRequests.filter(r => r.status === 'approved' && r.church === publicChurch);
  const pubCalByYear = {};
  pubCalSource.forEach(r => {
    const d2 = new Date(r.date_added);
    const yr = d2.getFullYear();
    const dateStr = `${yr}-${String(d2.getMonth()+1).padStart(2,'0')}-${String(d2.getDate()).padStart(2,'0')}`;
    if (!pubCalByYear[yr]) pubCalByYear[yr] = {};
    pubCalByYear[yr][dateStr] = (pubCalByYear[yr][dateStr] || 0) + 1;
  });
  const pubCalYears = Object.keys(pubCalByYear).map(Number).sort((a,b) => b-a);
  const PUB_YEARS_PER_PAGE = 4;
  const PUB_DATES_PER_PAGE = 4;
  const pubCalVisYears = pubCalYears.slice(calYearPage * PUB_YEARS_PER_PAGE, (calYearPage + 1) * PUB_YEARS_PER_PAGE);
  const pubCalDates = Object.keys(pubCalByYear[calSelYear] || {}).sort((a,b) => a.localeCompare(b));
  const pubCalVisDates = pubCalDates.slice(calDatePage * PUB_DATES_PER_PAGE, (calDatePage + 1) * PUB_DATES_PER_PAGE);

  if (!church) {
    return (
      <div style={styles.page}>
        <nav style={styles.navBar}>
          <span style={styles.navLogo}>🙏 Prayer Wall <span style={{fontWeight:'normal', fontSize:'13px', color:'#6B7280'}}>Admin</span></span>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </nav>
        <p style={styles.subtitle}>Choose a church to manage</p>
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

        <button onClick={() => { setShowGames(true); loadGames(); }} style={styles.statusBtn}>
          🎮 Manage Entry Gate Games
      </button>

      <button onClick={async () => {
        setShowPublicView(true);
        setPublicChurch(null);
        setPublicView('all');
        const data = await adminGetRequests();
          setPublicRequests(data.requests.map(r => ({
            ...r,
            display_name: r.show_name ? r.full_name : 'Anonymous',
            prayer_message: r.prayer_message || ''
          })));
      }} style={{...styles.statusBtn, marginTop:'10px', background:'#1B3A6B', color:'#fff'}}>
        🌐 Public View
      </button>

        {showGames && (
          <div style={styles.overlay}>
            <div style={{...styles.popup, maxWidth:'600px', maxHeight:'80vh', overflowY:'auto'}}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                <h3 style={{margin:0, color:'#1B3A6B'}}>🎮 Bible Guessing Games</h3>
                <button onClick={() => { setShowGames(false); setEditingGameId(null); setGameForm({ answer:'', hint1:'', hint2:'', hint3:'', difficulty:'easy' }); }} style={styles.closeBtn}>✕ Close</button>
              </div>

              <div style={styles.formBox}>
                <h4 style={{marginTop:0, color:'#1B3A6B'}}>{editingGameId ? 'Edit Game' : '+ Add New Game'}</h4>
                <label style={styles.label}>Answer (Bible Character)</label>
                <input placeholder="e.g. Moses" value={gameForm.answer}
                  onChange={e => setGameForm({...gameForm, answer: e.target.value})} style={styles.input} />
                <label style={styles.label}>Hint 1 (required)</label>
                <input placeholder="First hint..." value={gameForm.hint1}
                  onChange={e => setGameForm({...gameForm, hint1: e.target.value})} style={styles.input} />
                <label style={styles.label}>Hint 2 (optional)</label>
                <input placeholder="Second hint..." value={gameForm.hint2}
                  onChange={e => setGameForm({...gameForm, hint2: e.target.value})} style={styles.input} />
                <label style={styles.label}>Hint 3 (optional)</label>
                <input placeholder="Third hint..." value={gameForm.hint3}
                  onChange={e => setGameForm({...gameForm, hint3: e.target.value})} style={styles.input} />
                <label style={styles.label}>Difficulty</label>
                <select value={gameForm.difficulty} onChange={e => setGameForm({...gameForm, difficulty: e.target.value})} style={styles.input}>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <div style={{display:'flex', gap:'8px'}}>
                  <button onClick={handleSaveGame} style={styles.saveBtn}>{editingGameId ? 'Update' : 'Add'} Game</button>
                  {editingGameId && (
                    <button onClick={() => { setEditingGameId(null); setGameForm({ answer:'', hint1:'', hint2:'', hint3:'', difficulty:'easy' }); }} style={styles.cancelBtn}>Cancel</button>
                  )}
                </div>
              </div>

              <h4 style={{color:'#1B3A6B'}}>Active Games ({games.filter(g => g.active).length})</h4>
              {games.length === 0 ? <p style={{color:'#6B7280'}}>No games yet.</p> :
                games.map(g => (
                  <div key={g.id} style={{...styles.commentCard, opacity: g.active ? 1 : 0.5}}>
                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
                      <strong>{g.answer}</strong>
                      <span style={{fontSize:'11px', background:'#E8F0FE', color:'#1B3A6B', padding:'2px 8px', borderRadius:'10px'}}>{g.difficulty}</span>
                    </div>
                    <p style={{fontSize:'13px', color:'#6B7280', margin:'4px 0'}}>{g.hint1}</p>
                    <div style={{display:'flex', gap:'8px', marginTop:'8px'}}>
                      <button onClick={() => handleEditGame(g)} style={{fontSize:'12px'}}>Edit</button>
                      <button onClick={() => handleToggleGame(g)} style={{fontSize:'12px'}}>{g.active ? 'Deactivate' : 'Activate'}</button>
                      <button onClick={() => handleDeleteGame(g.id)} style={{...styles.rejectBtn, fontSize:'12px'}}>Delete</button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}
        {showPublicView && (
  <div style={styles.overlay}>
    <div style={{...styles.popup, maxWidth:'680px', width:'95%', maxHeight:'90vh', overflowY:'auto'}}>
      
      {/* Header */}
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px', position:'sticky', top:0, background:'#fff', paddingBottom:'12px', borderBottom:'1px solid #E2E8F0'}}>
        <div style={{display:'flex', alignItems:'center', gap:'10px'}}>
          {publicChurch && (
            <button onClick={() => { setPublicChurch(null); setPublicMyStatus(false); }} style={styles.backBtn}>← Back</button>
          )}
          <strong style={{color:'#1B3A6B', fontSize:'16px'}}>
            {!publicChurch ? '🌐 Public View' : `${CHURCHES.find(c=>c.id===publicChurch)?.icon} ${CHURCHES.find(c=>c.id===publicChurch)?.name}`}
          </strong>
        </div>
            <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
      <button onClick={() => { setPublicMyStatus(!publicMyStatus); setPublicStatusName(''); setPublicStatusResults({ requests:[], comments:[] }); }} style={{...styles.backBtn, background: publicMyStatus ? '#1B3A6B' : 'none', color: publicMyStatus ? '#fff' : '#1B3A6B'}}>
        My Status
      </button>
      <button onClick={() => { setShowPublicView(false); setPublicChurch(null); setPublicMyStatus(false); }} style={styles.closeBtn}>✕ Close</button>
    </div>
      </div>

      {/* Church selector */}
{publicMyStatus ? (
  <div>
    <div style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
      <input
        placeholder="Type your name to check status..."
        value={publicStatusName}
        onChange={e => setPublicStatusName(e.target.value)}
        style={{flex:1, padding:'8px 12px', border:'1px solid #ccc', borderRadius:'6px', fontSize:'14px', boxSizing:'border-box'}}
      />
      <button onClick={async () => {
        if (!publicStatusName.trim()) return;
        setPublicStatusLoading(true);
        const data = await checkMyStatus(publicStatusName);
        setPublicStatusResults({ requests: data.requests||[], comments: data.comments||[] });
        setPublicStatusLoading(false);
      }} style={styles.saveBtn}>Search</button>
    </div>
    {publicStatusLoading && <p style={{color:'#6B7280'}}>Searching...</p>}
    {publicStatusResults.requests.length === 0 && publicStatusResults.comments.length === 0 && !publicStatusLoading && publicStatusName && (
      <p style={{color:'#6B7280'}}>No results for <strong>{publicStatusName}</strong>.</p>
    )}
    {publicStatusResults.requests.length > 0 && (
      <>
        <h4 style={{color:'#1B3A6B', margin:'0 0 8px'}}>Prayer Requests</h4>
        {publicStatusResults.requests.map((r, i) => (
          <div key={i} style={{
            padding:'12px', borderRadius:'8px', marginBottom:'8px',
            background: r.status==='approved' ? '#F0FDF4' : r.status==='pending' ? '#FFFBEB' : '#FEF2F2',
            border: r.status==='approved' ? '1px solid #BBF7D0' : r.status==='pending' ? '1px solid #FDE68A' : '1px solid #FECACA'
          }}>
            <div style={{display:'flex', gap:'8px', marginBottom:'4px'}}>
              <strong style={{fontSize:'14px'}}>{r.full_name}</strong>
              <span style={{fontSize:'12px', color:'#6B7280'}}>{new Date(r.date_added).toLocaleDateString()}</span>
            </div>
            <p style={{margin:'0 0 6px', fontSize:'13px', color:'#444'}}>{r.prayer_message?.slice(0,80)}...</p>
            {r.status==='approved' && <span style={{fontSize:'12px', color:'#16A34A', fontWeight:'600'}}>Approved — visible on Prayer Wall</span>}
            {r.status==='pending' && <span style={{fontSize:'12px', color:'#D97706', fontWeight:'600'}}>Pending review</span>}
            {r.status==='hidden' && <div><span style={{fontSize:'12px', color:'#DC2626', fontWeight:'600'}}>Not approved</span>{r.reject_reason && <span style={{fontSize:'12px', color:'#6B7280'}}> — {r.reject_reason}</span>}</div>}
          </div>
        ))}
      </>
    )}
    {publicStatusResults.comments.length > 0 && (
      <>
        <h4 style={{color:'#1B3A6B', margin:'12px 0 8px'}}>Comments</h4>
        {publicStatusResults.comments.map((c, i) => (
          <div key={i} style={{
            padding:'12px', borderRadius:'8px', marginBottom:'8px',
            background: c.status==='approved' ? '#F0FDF4' : c.status==='deleted' ? '#FEF2F2' : '#FFFBEB',
            border: c.status==='approved' ? '1px solid #BBF7D0' : c.status==='deleted' ? '1px solid #FECACA' : '1px solid #FDE68A'
          }}>
            <div style={{fontSize:'12px', color:'#6B7280', marginBottom:'4px'}}>On: <strong>{c.prayer_title}</strong> — {new Date(c.submitted_at).toLocaleDateString()}</div>
            <p style={{margin:'0 0 6px', fontSize:'13px', color: c.status==='deleted' ? '#9CA3AF' : '#444', fontStyle: c.status==='deleted' ? 'italic' : 'normal'}}>{c.comment_text || '***'}</p>
            {c.status==='approved' && <span style={{fontSize:'12px', color:'#16A34A', fontWeight:'600'}}>Visible</span>}
            {c.status==='deleted' && <div><span style={{fontSize:'12px', color:'#DC2626', fontWeight:'600'}}>Deleted — will be permanently removed after 30 days</span>{c.deleted_reason && <p style={{margin:'4px 0 0', fontSize:'12px', color:'#6B7280'}}>Reason: {c.deleted_reason}</p>}</div>}
          </div>
        ))}
      </>
    )}
  </div>
) : !publicChurch ? (
        <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
          <p style={{color:'#6B7280', fontSize:'13px', margin:'0 0 8px'}}>Select a church to preview what visitors see.</p>
          {CHURCHES.map(c => (
            <button key={c.id} onClick={() => { setPublicChurch(c.id); setPublicView('all'); setPublicSearch(''); setPublicDateFilter(''); setPublicMyStatus(false); }} style={styles.churchCard}>
              <span style={styles.churchIcon}>{c.icon}</span>
              <div style={{textAlign:'left'}}>
                <div style={styles.churchName}>{c.name}</div>
                <div style={styles.churchTagline}>{c.tagline}</div>
              </div>
              <span style={{marginLeft:'auto', fontSize:'20px'}}>›</span>
            </button>
          ))}
        </div>

     
      ) : (
        <>
          {publicChurch === 'public' && (
            <div style={{background:'#1B3A6B', color:'#fff', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px', fontSize:'13px', fontWeight:'600'}}>
              Submit Prayer Request — visible to Public Prayers only
            </div>
          )}

          <div style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
            {[['all','View All'],['name','By Name'],['date','By Date']].map(([mode,label]) => (
              <button key={mode} onClick={() => setPublicView(mode)} style={publicView===mode ? styles.tabActive : styles.tab}>{label}</button>
            ))}
          </div>

          {publicView === 'name' && (
            <input placeholder="Type a name..." value={publicSearch} onChange={e => setPublicSearch(e.target.value)}
              style={{display:'block', width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'6px', marginBottom:'16px', boxSizing:'border-box'}} />
          )}
          {publicView === 'date' && (
            <div style={{marginBottom:'16px'}}>
              {!publicDateFilter ? (
                <div style={{border:'1.5px solid #E2E8F0', borderRadius:'12px', overflow:'hidden', marginBottom:'8px'}}>
                  <div style={{background:'#1B3A6B', color:'#fff', padding:'10px 14px', fontWeight:'700', fontSize:'14px'}}>
                    Calendar of {CHURCHES.find(c=>c.id===publicChurch)?.name} Prayer Request
                  </div>
                  {/* Year row */}
                  <div style={{display:'flex', alignItems:'center', gap:'6px', padding:'10px 12px', background:'#F8FAFC', borderBottom:'1px solid #E2E8F0'}}>
                    <span style={{fontSize:'12px', color:'#6B7280', fontWeight:'600', marginRight:'2px'}}>Year:</span>
                    <button onClick={() => setCalYearPage(p => Math.max(0, p-1))} disabled={calYearPage === 0}
                      style={{background:'none', border:'1px solid #D1D5DB', borderRadius:'6px', width:'26px', height:'26px',
                        cursor: calYearPage === 0 ? 'default' : 'pointer',
                        color: calYearPage === 0 ? '#D1D5DB' : '#1B3A6B', fontWeight:'700', fontSize:'14px', flexShrink:0}}>‹</button>
                    <div style={{display:'flex', gap:'6px', flex:1}}>
                      {pubCalVisYears.map(yr => (
                        <button key={yr} onClick={() => { setCalSelYear(yr); setCalDatePage(0); }}
                          style={{padding:'4px 12px', borderRadius:'20px',
                            border: yr === calSelYear ? '2px solid #1B3A6B' : '1px solid #D1D5DB',
                            background: yr === calSelYear ? '#1B3A6B' : '#fff',
                            color: yr === calSelYear ? '#fff' : '#374151',
                            fontWeight:'700', fontSize:'13px', cursor:'pointer', whiteSpace:'nowrap'}}>
                          {yr}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => setCalYearPage(p => p+1)} disabled={(calYearPage+1)*PUB_YEARS_PER_PAGE >= pubCalYears.length}
                      style={{background:'none', border:'1px solid #D1D5DB', borderRadius:'6px', width:'26px', height:'26px',
                        cursor: (calYearPage+1)*PUB_YEARS_PER_PAGE >= pubCalYears.length ? 'default' : 'pointer',
                        color: (calYearPage+1)*PUB_YEARS_PER_PAGE >= pubCalYears.length ? '#D1D5DB' : '#1B3A6B', fontWeight:'700', fontSize:'14px', flexShrink:0}}>›</button>
                  </div>
                  {/* Date row */}
                  <div style={{display:'flex', alignItems:'center', gap:'6px', padding:'10px 12px', background:'#fff'}}>
                    <button onClick={() => setCalDatePage(p => Math.max(0, p-1))} disabled={calDatePage === 0}
                      style={{background:'none', border:'1px solid #D1D5DB', borderRadius:'6px', width:'26px', height:'26px',
                        cursor: calDatePage === 0 ? 'default' : 'pointer',
                        color: calDatePage === 0 ? '#D1D5DB' : '#1B3A6B', fontWeight:'700', fontSize:'14px', flexShrink:0}}>‹</button>
                    <div style={{display:'flex', gap:'6px', flex:1}}>
                      {pubCalDates.length === 0
                        ? <span style={{color:'#9CA3AF', fontSize:'13px'}}>No entries for {calSelYear}</span>
                        : pubCalVisDates.map(dateStr => (
                          <button key={dateStr} onClick={() => setPublicDateFilter(dateStr)}
                            style={{background:'#1B3A6B', color:'#fff', border:'none', borderRadius:'8px',
                              padding:'7px 12px', cursor:'pointer', fontSize:'13px', fontWeight:'600',
                              fontFamily:'inherit', whiteSpace:'nowrap', flex:1}}>
                            {new Date(dateStr+'T00:00:00').toLocaleDateString('en-US',{month:'short', day:'numeric'})}
                          </button>
                        ))
                      }
                    </div>
                    <button onClick={() => setCalDatePage(p => p+1)} disabled={(calDatePage+1)*PUB_DATES_PER_PAGE >= pubCalDates.length}
                      style={{background:'none', border:'1px solid #D1D5DB', borderRadius:'6px', width:'26px', height:'26px',
                        cursor: (calDatePage+1)*PUB_DATES_PER_PAGE >= pubCalDates.length ? 'default' : 'pointer',
                        color: (calDatePage+1)*PUB_DATES_PER_PAGE >= pubCalDates.length ? '#D1D5DB' : '#1B3A6B', fontWeight:'700', fontSize:'14px', flexShrink:0}}>›</button>
                  </div>
                </div>
              ) : (
                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px'}}>
                  <button onClick={() => setPublicDateFilter('')}
                    style={{background:'none', border:'1px solid #1B3A6B', borderRadius:'6px', padding:'6px 12px', color:'#1B3A6B', cursor:'pointer', fontSize:'13px'}}>
                    Back to Calendar
                  </button>
                  <span style={{fontWeight:'700', color:'#1B3A6B', fontSize:'14px'}}>
                    {new Date(publicDateFilter+'T00:00:00').toLocaleDateString('en-US',{month:'long', day:'numeric', year:'numeric'})}
                  </span>
                </div>
              )}
            </div>
          )}

          {(() => {
            let displayed = publicRequests
                      .filter(r => r.status === 'approved')
                      .filter(r => r.church === publicChurch)
                      .map(r => ({
                ...r,
                prayer_message: r.prayer_message || r.preview || '',
                display_name: r.display_name || (r.show_name ? r.full_name : 'Anonymous'),
              }));
            if (publicView==='name' && publicSearch)
              displayed = displayed.filter(r => r.display_name.toLowerCase().includes(publicSearch.toLowerCase()));
            if (publicView==='date' && publicDateFilter)
              displayed = displayed.filter(r => toLocalDate(r.date_added) === publicDateFilter);
            if (publicView==='name') {
              displayed = [...displayed].sort((a,b) => a.display_name.localeCompare(b.display_name));
              return displayed.length === 0
                ? <p style={{color:'#6B7280'}}>No prayer requests found.</p>
                : displayed.map(r => <PrayerCard key={r.id} request={r} />);
            }
            const groups = {};
            displayed.forEach(r => {
              const dateKey = new Date(r.date_added).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
              if (!groups[dateKey]) groups[dateKey] = [];
              groups[dateKey].push(r);
            });
            const sortedGroups = Object.entries(groups).sort((a,b) => new Date(b[0]) - new Date(a[0]));
            return sortedGroups.length === 0
              ? <p style={{color:'#6B7280'}}>No prayer requests found.</p>
              : sortedGroups.map(([date, entries]) => (
                <div key={date} style={{marginBottom:'24px'}}>
                  <div style={{background:'#1B3A6B', color:'white', padding:'8px 14px', borderRadius:'8px', fontWeight:'600', fontSize:'14px', marginBottom:'10px'}}>
                    {date}
                  </div>
                  {entries.map(r => <PrayerCard key={r.id} request={r} />)}
                </div>
              ));
          })()}
        </>
      )}
    </div>
  </div>
)}
      </div>
    );
  }

  const churchInfo = CHURCHES.find(c => c.id === church);

  return (
    <div style={styles.page}>
      <nav style={styles.navBar}>
        <span style={styles.navLogo}>🙏 Prayer Wall <span style={{fontWeight:'normal', fontSize:'13px', color:'#6B7280'}}>Admin</span></span>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </nav>

      <button onClick={handleChangeChurch} style={styles.changeChurch}>
        {churchInfo.icon} {churchInfo.name} (change)
      </button>

      <div style={{display:'flex', gap:'8px', margin:'16px 0'}}>
      <button onClick={() => setAdminTab('manage')} style={adminTab === 'manage' ? styles.tabActive : styles.tab}>⚙️ Manage</button>
    </div>

      {/* MANAGE TAB */}
      {adminTab === 'manage' && (
        <>
          {/* Date selection */}
          {!selectedDate ? (
            <div>
              <h3 style={{color:'#1B3A6B', margin:'0 0 12px'}}>Select a Date</h3>

              {/* Custom Calendar */}
              {(() => {
                const existingDates = {};
                requests.forEach(r => {
                 const dk = toLocalDate(r.date_added);
                  existingDates[dk] = (existingDates[dk] || 0) + 1;
                });

                const allYears = [...new Set(Object.keys(existingDates).map(d => parseInt(d.slice(0,4))))].sort((a,b) => a-b);
                const today = new Date();
                const curYear = calYear;
                const curMonth = calMonth;

                // Days in selected month
                const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
                const firstDayOfWeek = new Date(curYear, curMonth, 1).getDay(); // 0=Sun
                const MONTHS = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
                const MONTH_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December'];

                return (
                  <div style={{border:'2px solid #1B3A6B', borderRadius:'10px', overflow:'hidden', maxWidth:'520px', marginBottom:'20px', fontFamily:'sans-serif'}}>
                    
                    {/* Year row */}
                    <div style={{display:'flex', alignItems:'center', background:'#fff', borderBottom:'1px solid #D1D5DB', padding:'8px 10px', gap:'6px'}}>
                      <button onClick={() => setCalYear(y => y - 1)}
                        style={{background:'none', border:'1px solid #D1D5DB', borderRadius:'6px', width:'28px', height:'28px', cursor:'pointer', color:'#1B3A6B', fontWeight:'700', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>‹</button>
                      <div style={{display:'flex', gap:'6px', flex:1, flexWrap:'wrap'}}>
                        {(allYears.length > 0 ? allYears : [today.getFullYear()]).map(yr => (
                          <button key={yr} onClick={() => setCalYear(yr)}
                            style={{padding:'4px 12px', borderRadius:'20px', border: yr === curYear ? '2px solid #1B3A6B' : '1px solid #D1D5DB',
                              background: yr === curYear ? '#1B3A6B' : '#F9FAFB', color: yr === curYear ? '#fff' : '#374151',
                              fontWeight:'600', fontSize:'13px', cursor:'pointer'}}>
                            {yr}
                          </button>
                        ))}
                        {/* Also show current year if not in existing dates */}
                        {!allYears.includes(today.getFullYear()) && (
                          <button onClick={() => setCalYear(today.getFullYear())}
                            style={{padding:'4px 12px', borderRadius:'20px', border: today.getFullYear() === curYear ? '2px solid #1B3A6B' : '1px solid #D1D5DB',
                              background: today.getFullYear() === curYear ? '#1B3A6B' : '#F9FAFB', color: today.getFullYear() === curYear ? '#fff' : '#374151',
                              fontWeight:'600', fontSize:'13px', cursor:'pointer'}}>
                            {today.getFullYear()}
                          </button>
                        )}
                      </div>
                      <button onClick={() => setCalYear(y => y + 1)}
                        style={{background:'none', border:'1px solid #D1D5DB', borderRadius:'6px', width:'28px', height:'28px', cursor:'pointer', color:'#1B3A6B', fontWeight:'700', fontSize:'16px', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0}}>›</button>
                    </div>

                    {/* Body: months column + days grid */}
                    <div style={{display:'flex'}}>

                      {/* Month column */}
                      <div style={{display:'flex', flexDirection:'column', borderRight:'1px solid #D1D5DB', background:'#F9FAFB', minWidth:'52px'}}>
                        <button onClick={() => setCalMonth(m => m > 0 ? m - 1 : 11)}
                          style={{background:'none', border:'none', padding:'4px', cursor:'pointer', color:'#1B3A6B', fontWeight:'700', fontSize:'14px'}}>▲</button>
                        {MONTHS.map((m, idx) => {
                          const hasData = Object.keys(existingDates).some(d => d.startsWith(`${curYear}-${String(idx+1).padStart(2,'0')}`));
                          return (
                            <button key={m} onClick={() => setCalMonth(idx)}
                              style={{padding:'5px 6px', border:'none', borderBottom:'1px solid #E5E7EB', cursor:'pointer', fontSize:'11px', fontWeight: idx === curMonth ? '700' : '500',
                                background: idx === curMonth ? '#1B3A6B' : 'transparent',
                                color: idx === curMonth ? '#fff' : hasData ? '#1B3A6B' : '#9CA3AF',
                                textAlign:'center', position:'relative'}}>
                              {m}
                              {hasData && idx !== curMonth && <span style={{display:'block', width:'5px', height:'5px', borderRadius:'50%', background:'#C9A84C', margin:'1px auto 0'}}></span>}
                            </button>
                          );
                        })}
                        <button onClick={() => setCalMonth(m => m < 11 ? m + 1 : 0)}
                          style={{background:'none', border:'none', padding:'4px', cursor:'pointer', color:'#1B3A6B', fontWeight:'700', fontSize:'14px'}}>▼</button>
                      </div>

                      {/* Days grid */}
                      <div style={{flex:1, padding:'10px'}}>
                        <div style={{textAlign:'center', fontWeight:'700', color:'#1B3A6B', marginBottom:'8px', fontSize:'14px'}}>
                          {MONTH_FULL[curMonth]} {curYear}
                        </div>
                        {/* Day headers */}
                        <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px', marginBottom:'4px'}}>
                          {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                            <div key={d} style={{textAlign:'center', fontSize:'11px', color:'#6B7280', fontWeight:'600', padding:'2px 0'}}>{d}</div>
                          ))}
                        </div>
                        {/* Day cells */}
                        <div style={{display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:'2px'}}>
                          {Array.from({length: firstDayOfWeek}).map((_,i) => <div key={`e${i}`} />)}
                          {Array.from({length: daysInMonth}).map((_,i) => {
                            const day = i + 1;
                            const dateStr = `${curYear}-${String(curMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                            const count = existingDates[dateStr] || 0;
                            const isToday = dateStr === toLocalDate(today);
                            return (
                              <button key={day} onClick={() => { setSelectedDate(dateStr); resetForm(); }}
                                title={count > 0 ? `${count} entr${count===1?'y':'ies'}` : 'No entries — click to add'}
                                style={{
                                  padding:'0', height:'34px', borderRadius:'6px', border:'none', cursor:'pointer', fontSize:'13px', fontWeight: count > 0 ? '700' : '400',
                                  background: count > 0 ? '#1B3A6B' : isToday ? '#EFF6FF' : '#F3F4F6',
                                  color: count > 0 ? '#fff' : isToday ? '#1B3A6B' : '#374151',
                                  outline: isToday ? '2px solid #C9A84C' : 'none',
                                  position:'relative', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'1px'
                                }}>
                                {day}
                                {count > 0 && <span style={{fontSize:'9px', fontWeight:'400', opacity:0.85}}>{count}</span>}
                              </button>
                            );
                          })}
                        </div>
                        <div style={{marginTop:'10px', display:'flex', gap:'12px', fontSize:'11px', color:'#6B7280'}}>
                          <span><span style={{display:'inline-block', width:'10px', height:'10px', borderRadius:'2px', background:'#1B3A6B', marginRight:'4px', verticalAlign:'middle'}}></span>Has entries</span>
                          <span><span style={{display:'inline-block', width:'10px', height:'10px', borderRadius:'2px', background:'#EFF6FF', border:'2px solid #C9A84C', marginRight:'4px', verticalAlign:'middle'}}></span>Today</span>
                          <span>Click any day to open or add entries</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Existing date pills below calendar */}
              {(() => {
                const groups = {};
                requests.forEach(r => {
                  const dateKey = toLocalDate(r.date_added);
                  if (!groups[dateKey]) groups[dateKey] = 0;
                  groups[dateKey]++;
                });
                const sortedDates = Object.entries(groups).sort((a,b) => b[0].localeCompare(a[0]));
                return sortedDates.length === 0
                  ? <p style={{color:'#6B7280'}}>No entries yet. Click any day on the calendar to start adding.</p>
                  : (
                    <>
                      <p style={{color:'#6B7280', fontSize:'13px', margin:'0 0 8px'}}>Or click a date below:</p>
                      {sortedDates.map(([dateKey, count]) => (
                        <button key={dateKey} onClick={() => { setSelectedDate(dateKey); resetForm(); }} style={styles.datePill}>
                          {new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}
                          <span style={styles.datePillCount}>{count} {count === 1 ? 'entry' : 'entries'}</span>
                        </button>
                      ))}
                    </>
                  );
              })()}
            </div>
          ) : (
            <div style={{marginBottom:'12px'}}>
              <button onClick={() => { setSelectedDate(''); resetForm(); }} style={styles.backBtn}>← Back to Dates</button>
              <span style={{marginLeft:'12px', fontWeight:'600', color:'#1B3A6B'}}>
                📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}
              </span>
            </div>
          )}

          {/* Add/Edit form */}
          {selectedDate && (editingId || church !== 'public') && (
            <div style={styles.formBox}>
              <h3 style={{marginTop:0, color:'#1B3A6B'}}>
                {editingId ? 'Edit Prayer Request' : '+ Add Prayer Request'}
                <span style={{fontWeight:'normal', fontSize:'14px', color:'#6B7280', marginLeft:'8px'}}>
                  for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}
                </span>
              </h3>
              <label style={styles.label}>Name</label>
              <input placeholder="Enter name" value={form.full_name}
                onChange={e => setForm({...form, full_name: e.target.value})} style={styles.input} />
              <label style={styles.label}>Prayer Request</label>
              <textarea placeholder="Enter the prayer request..." rows={4} value={form.prayer_message}
                onChange={e => setForm({...form, prayer_message: e.target.value})} style={styles.input} />
              {saveStatus === 'success' && <p style={{color:'#16A34A', marginBottom:'8px'}}>✅ Saved successfully!</p>}
              {saveStatus === 'error' && <p style={{color:'#DC2626', marginBottom:'8px'}}>❌ Something went wrong.</p>}
              <div style={{display:'flex', gap:'8px'}}>
                <button onClick={handleSave} disabled={saveStatus==='loading'} style={styles.saveBtn}>
                  {saveStatus === 'loading' ? 'Saving...' : 'Save'}
                </button>
                {editingId && <button onClick={resetForm} style={styles.cancelBtn}>Cancel Edit</button>}
              </div>
            </div>
          )}

          {/* Prayer Requests Table */}
          {selectedDate && (
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:'24px'}}>
              <h3 style={{color:'#1B3A6B', margin:0}}>
                Prayer Requests — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}
              </h3>
              <button onClick={() => setShowTextLayout(true)} style={styles.textLayoutBtn}>📄 Text Layout</button>
            </div>
          )}

          {/* Text Layout Popup */}
          {showTextLayout && (
            <div style={styles.overlay}>
              <div style={styles.popup}>
                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                  <h3 style={{margin:0, color:'#1B3A6B'}}>📄 Text Layout</h3>
                  <button onClick={() => setShowTextLayout(false)} style={styles.closeBtn}>✕ Close</button>
                </div>
                <textarea readOnly
                  value={(() => {
                    const dateStr = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
                    const churchName = churchInfo.name.toUpperCase();
                    let text = `================================\n${churchName}\nPRAYER REQUEST\n${dateStr}\n================================\n\n`;
                    requestsForDate.filter(r => r.status === 'approved').forEach((r, i) => {
                      text += `${i + 1}. ${r.full_name} — ${r.prayer_message}\n`;
                    });
                    text += `\n================================\nTotal Prayers: ${requestsForDate.filter(r => r.status === 'approved').length}\n================================`;
                    return text;
                  })()}
                  style={{width:'100%', height:'300px', padding:'12px', fontFamily:'monospace', fontSize:'14px', border:'1px solid #ccc', borderRadius:'6px', resize:'none', boxSizing:'border-box'}}
                />
                <button onClick={() => {
                  const dateStr = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
                  const churchName = churchInfo.name.toUpperCase();
                  let text = `================================\n${churchName}\nPRAYER REQUEST\n${dateStr}\n================================\n\n`;
                  requestsForDate.filter(r => r.status === 'approved').forEach((r, i) => {
                    text += `${i + 1}. ${r.full_name} — ${r.prayer_message}\n`;
                  });
                  text += `\n================================\nTotal Prayers: ${requestsForDate.filter(r => r.status === 'approved').length}\n================================`;
                  navigator.clipboard.writeText(text);
                  alert('Copied to clipboard!');
                }} style={styles.copyBtn}>📋 Copy All</button>
              </div>
            </div>
          )}

          {/* Prayer Requests grouped by approved/rejected */}
          {selectedDate && (requestsForDate.length === 0
            ? <p style={{color:'#6B7280'}}>No entries for this date.</p>
            : (() => {
                const groups = {};
                requestsForDate.forEach(r => {
                  const dateKey = new Date(r.date_added).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
                  if (!groups[dateKey]) groups[dateKey] = [];
                  groups[dateKey].push(r);
                });
                return Object.entries(groups).map(([date, entries]) => {
                  const approved = entries.filter(r => r.status === 'approved');
                  const rejected = church === 'public' ? entries.filter(r => r.status === 'hidden') : [];
                  return (
                    <div key={date} style={{marginBottom:'20px'}}>
                      <div style={{background:'#1B3A6B', color:'white', padding:'8px 12px', borderRadius:'6px 6px 0 0', fontWeight:'600', fontSize:'14px'}}>
                        📅 {date} — {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                      </div>
                      <div style={{marginBottom:'8px'}}>
                        <div style={{background:'#16A34A', color:'white', padding:'6px 12px', fontSize:'13px', fontWeight:'600'}}>✅ Approved ({approved.length})</div>
                        {approved.length === 0
                          ? <p style={{padding:'8px', color:'#6B7280', fontSize:'13px', margin:0}}>No approved entries.</p>
                          : <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #E2E8F0'}}>
                              <thead><tr style={{background:'#F0FDF4'}}>
                                <th style={styles.th}>Name</th><th style={styles.th}>Prayer</th><th style={styles.th}>Actions</th>
                              </tr></thead>
                              <tbody>
                                {approved.map(r => (
                                  <tr key={r.id} style={{borderBottom:'1px solid #E2E8F0'}}>
                                    <td style={styles.td}>{r.full_name}</td>
                                    <td style={styles.td}>{r.prayer_message?.slice(0, 60)}...</td>
                                    <td style={styles.td}>
                                      <button onClick={() => handleEdit(r)} style={{marginRight:'6px'}}>Edit</button>
                                      <button onClick={() => handleDelete(r.id)} style={{color:'#DC2626'}}>Delete</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                        }
                      </div>
                      {church === 'public' && (
                        <div>
                          <div style={{background:'#DC2626', color:'white', padding:'6px 12px', fontSize:'13px', fontWeight:'600'}}>❌ Rejected ({rejected.length})</div>
                          {rejected.length === 0
                            ? <p style={{padding:'8px', color:'#6B7280', fontSize:'13px', margin:0}}>No rejected entries.</p>
                            : <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #E2E8F0'}}>
                                <thead><tr style={{background:'#FEF2F2'}}>
                                  <th style={styles.th}>Name</th><th style={styles.th}>Prayer</th><th style={styles.th}>Reason</th><th style={styles.th}>Actions</th>
                                </tr></thead>
                                <tbody>
                                  {rejected.map(r => (
                                    <tr key={r.id} style={{borderBottom:'1px solid #E2E8F0'}}>
                                      <td style={styles.td}>{r.full_name}</td>
                                      <td style={styles.td}>{r.prayer_message?.slice(0, 60)}...</td>
                                      <td style={styles.td}>{r.reject_reason || '—'}</td>
                                      <td style={styles.td}>
                                        <button onClick={() => handleEdit(r)} style={{marginRight:'6px'}}>Edit</button>
                                        <button onClick={() => handleDelete(r.id)} style={{color:'#DC2626'}}>Delete</button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                          }
                        </div>
                      )}
                    </div>
                  );
                });
              })()
          )}

          {/* Pending Prayer Requests - Public only */}
          {church === 'public' && (
            <>
              <h3 style={{color:'#1B3A6B', marginTop:'32px'}}>
                Pending Prayer Requests
                {pendingRequests.length > 0 && <span style={{background:'#DC2626', color:'white', borderRadius:'12px', padding:'2px 8px', fontSize:'12px', marginLeft:'8px'}}>{pendingRequests.length}</span>}
              </h3>
              {pendingRequests.length === 0
                ? <p style={{color:'#6B7280'}}>No pending prayer requests.</p>
                : pendingRequests.map(r => (
                  <div key={r.id} style={styles.commentCard}>
                    <div style={{fontSize:'13px', color:'#6B7280', marginBottom:'4px'}}>
                      <strong>{r.full_name}</strong> — {new Date(r.date_added).toLocaleDateString()}
                    </div>
                    <div style={{marginBottom:'8px'}}>{r.prayer_message}</div>
                    {rejectingId === r.id ? (
                      <div>
                        <input placeholder="Reason for rejection (optional)..." value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)} style={{...styles.input, marginBottom:'8px'}} />
                        <button onClick={async () => {
                          await adminRejectRequest(r.id, rejectReason);
                          setRejectingId(null); setRejectReason(''); loadPendingRequests();
                        }} style={styles.rejectBtn}>Confirm Reject</button>
                        <button onClick={() => { setRejectingId(null); setRejectReason(''); }}
                          style={{...styles.cancelBtn, marginLeft:'8px'}}>Cancel</button>
                      </div>
                    ) : (
                      <div>
                        <button onClick={async () => { await adminApproveRequest(r.id); loadPendingRequests(); load(); }} style={styles.approveBtn}>Approve</button>
                        <button onClick={() => setRejectingId(r.id)} style={{...styles.rejectBtn, marginLeft:'8px'}}>Reject</button>
                      </div>
                    )}
                  </div>
                ))
              }
            </>
          )}

          {/* Comments organized by date */}
          <h3 style={{color:'#1B3A6B', marginTop:'32px'}}>
            💬 Comments
            {comments.length > 0 && <span style={{background:'#1B3A6B', color:'white', borderRadius:'12px', padding:'2px 8px', fontSize:'12px', marginLeft:'8px'}}>{comments.length}</span>}
          </h3>
          {comments.length === 0
            ? <p style={{color:'#6B7280'}}>No comments yet.</p>
            : Object.entries(commentsByDate).sort((a,b) => new Date(b[0]) - new Date(a[0])).map(([date, dateComments]) => (
              <div key={date} style={{marginBottom:'16px'}}>
                <div style={{background:'#1B3A6B', color:'white', padding:'6px 12px', borderRadius:'6px', fontWeight:'600', fontSize:'13px', marginBottom:'8px'}}>
                  📅 {date} — {dateComments.length} {dateComments.length === 1 ? 'comment' : 'comments'}
                </div>
                {dateComments.map(c => (
                  <div key={c.id} style={{
                  ...styles.commentCard,
                  background: c.status === 'deleted' ? '#F9FAFB' : '#fff',
                  borderLeft: c.status === 'deleted' ? '4px solid #DC2626' : '1px solid #E2E8F0',
                  opacity: c.status === 'deleted' ? 0.7 : 1
                }}>
                    <div style={{fontSize:'13px', color:'#6B7280', marginBottom:'4px'}}>
                      On: <strong>{c.prayer_title}</strong> — by {c.visitor_name}
                    </div>
                    <div style={{
                  marginBottom:'8px',
                  textDecoration: c.status === 'deleted' ? 'line-through' : 'none',
                  color: c.status === 'deleted' ? '#9CA3AF' : '#333'
                }}>
                  {c.status === 'deleted' ? '***' : c.comment_text}
                </div>
                    {rejectingCommentId === c.id ? (
                      <div>
                        <input placeholder="Reason for deletion (optional)..." value={rejectCommentReason}
                          onChange={e => setRejectCommentReason(e.target.value)} style={{...styles.input, marginBottom:'8px'}} />
                        <button onClick={async () => {
                          await handleDeleteComment(c.id, rejectCommentReason);
                          setRejectingCommentId(null); setRejectCommentReason('');
                        }} style={styles.rejectBtn}>Confirm Delete</button>
                        <button onClick={() => { setRejectingCommentId(null); setRejectCommentReason(''); }}
                          style={{...styles.cancelBtn, marginLeft:'8px'}}>Cancel</button>
                      </div>
                    ) : c.status === 'deleted' ? (
                      <div style={{display:'flex', alignItems:'center', gap:'8px'}}>
                        <span style={{fontSize:'12px', color:'#DC2626', fontWeight:'600'}}>🗑️ Deleted</span>
                        {c.deleted_reason && <span style={{fontSize:'12px', color:'#6B7280'}}>— {c.deleted_reason}</span>}
                      </div>
                    ) : (
                      <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
                        <span style={{fontSize:'12px', color:'#16A34A', fontWeight:'600'}}>✅ Visible</span>
                        <button onClick={() => setRejectingCommentId(c.id)} style={styles.rejectBtn}>🗑️ Delete</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))
          }
        </>
      )}

      {/* PUBLIC VIEW TAB */}
{adminTab === 'public' && (
  <>
    {!publicChurch ? (
      <>
        <p style={{color:'#6B7280', fontSize:'13px', marginBottom:'12px'}}>
          Select a church to preview what visitors see.
        </p>
        <div style={{display:'flex', flexDirection:'column', gap:'10px', maxWidth:'500px'}}>
          {CHURCHES.map(c => (
            <button key={c.id} onClick={() => { setPublicChurch(c.id); setPublicView('all'); setPublicSearch(''); setPublicDateFilter(''); }} style={styles.churchCard}>
              <span style={styles.churchIcon}>{c.icon}</span>
              <div style={{textAlign:'left'}}>
                <div style={styles.churchName}>{c.name}</div>
                <div style={styles.churchTagline}>{c.tagline}</div>
              </div>
              <span style={{marginLeft:'auto', fontSize:'20px'}}>›</span>
            </button>
          ))}
        </div>
      </>
    ) : (
      <>
        <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'12px'}}>
          <button onClick={() => setPublicChurch(null)} style={styles.backBtn}>← Back</button>
          <span style={{fontWeight:'700', color:'#1B3A6B', fontSize:'15px'}}>
            {CHURCHES.find(c => c.id === publicChurch)?.icon} {CHURCHES.find(c => c.id === publicChurch)?.name} — Public View
          </span>
        </div>

        {publicChurch === 'public' && (
          <div style={{background:'#1B3A6B', color:'#fff', borderRadius:'8px', padding:'10px 14px', marginBottom:'12px', fontSize:'13px', fontWeight:'600'}}>
            Submit Prayer Request — visible to Public only
          </div>
        )}

        <div style={{display:'flex', gap:'8px', marginBottom:'16px'}}>
          <button onClick={() => setPublicView('all')} style={publicView === 'all' ? styles.tabActive : styles.tab}>View All</button>
          <button onClick={() => setPublicView('name')} style={publicView === 'name' ? styles.tabActive : styles.tab}>By Name</button>
          <button onClick={() => setPublicView('date')} style={publicView === 'date' ? styles.tabActive : styles.tab}>By Date</button>
        </div>

        {publicView === 'name' && (
          <input placeholder="Type a name..." value={publicSearch} onChange={e => setPublicSearch(e.target.value)}
            style={{display:'block', width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'6px', marginBottom:'16px', boxSizing:'border-box'}} />
        )}
        {publicView === 'date' && (
          <select
            value={publicDateFilter}
            onChange={e => setPublicDateFilter(e.target.value)}
            style={{display:'block', width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'6px', marginBottom:'16px', boxSizing:'border-box'}}
          >
            <option value="">-- Select a date --</option>
            {[...new Set(publicRequests
              .filter(r => r.status === 'approved' && r.church === publicChurch)
              .map(r => toLocalDate(r.date_added)))]
              .sort((a,b) => b.localeCompare(a))
              .map(date => (
                <option key={date} value={date}>
                  {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}
                </option>
              ))
            }
          </select>
        )}
        {publicView === 'status' ? (
          <div>
            <input placeholder="Type a name to check status..." value={publicSearch} onChange={e => setPublicSearch(e.target.value)}
              style={{display:'block', width:'100%', padding:'8px', border:'1px solid #ccc', borderRadius:'6px', marginBottom:'8px', boxSizing:'border-box'}} />
            <button onClick={async () => {
              if (!publicSearch.trim()) return;
              setStatusLoading(true);
              const data = await checkMyStatus(publicSearch);
              setMyStatuses(data.requests || []);
              setMyComments(data.comments || []);
              setStatusLoading(false);
              setStatusChecked(true);
            }} style={styles.saveBtn}>Search</button>
            {statusLoading && <p style={{color:'#6B7280', marginTop:'8px'}}>Checking...</p>}
            {statusChecked && myStatuses.length === 0 && (
              <p style={{color:'#6B7280', marginTop:'8px'}}>No results for <strong>{publicSearch}</strong>.</p>
            )}
            {myStatuses.map((r, i) => (
              <div key={i} style={{
                padding:'12px', borderRadius:'8px', marginTop:'8px',
                background: r.status === 'approved' ? '#F0FDF4' : r.status === 'pending' ? '#FFFBEB' : '#FEF2F2',
                border: r.status === 'approved' ? '1px solid #BBF7D0' : r.status === 'pending' ? '1px solid #FDE68A' : '1px solid #FECACA'
              }}>
                <div style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px'}}>
                  <strong>{r.full_name}</strong>
                  <span style={{fontSize:'12px', color:'#6B7280'}}>{new Date(r.date_added).toLocaleDateString()}</span>
                </div>
                <p style={{margin:'0 0 4px', fontSize:'14px'}}>{r.prayer_message?.slice(0,60)}...</p>
                {r.status === 'approved' && <p style={{margin:0, fontSize:'12px', color:'#16A34A', fontWeight:'600'}}>Approved</p>}
                {r.status === 'pending' && <p style={{margin:0, fontSize:'12px', color:'#D97706', fontWeight:'600'}}>Pending review</p>}
                {r.status === 'hidden' && (
                  <div>
                    <p style={{margin:0, fontSize:'12px', color:'#DC2626', fontWeight:'600'}}>Not approved</p>
                    {r.reject_reason && <p style={{margin:'4px 0 0', fontSize:'12px', color:'#6B7280'}}>Reason: {r.reject_reason}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          (() => {
            let displayed = publicRequests
              .filter(r => r.status === 'approved')
              .filter(r => r.church === publicChurch)
              .map(r => ({
                ...r,
                prayer_message: r.prayer_message || r.preview || '',
                display_name: r.display_name || (r.show_name ? r.full_name : 'Anonymous'),
              }));
            if (publicView === 'name' && publicSearch)
              displayed = displayed.filter(r => r.display_name.toLowerCase().includes(publicSearch.toLowerCase()));
            if (publicView === 'date' && publicDateFilter)
              displayed = displayed.filter(r => new Date(r.date_added).toISOString().slice(0,10) === publicDateFilter);
            if (publicView === 'name') {
              displayed = [...displayed].sort((a,b) => a.display_name.localeCompare(b.display_name));
              return displayed.length === 0
                ? <p style={{color:'#6B7280'}}>No prayer requests found.</p>
                : displayed.map(r => <PrayerCard key={r.id} request={r} />);
            }
            const groups = {};
            displayed.forEach(r => {
              const dateKey = new Date(r.date_added).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
              if (!groups[dateKey]) groups[dateKey] = [];
              groups[dateKey].push(r);
            });
            const sortedGroups = Object.entries(groups).sort((a,b) => new Date(b[0]) - new Date(a[0]));
            return sortedGroups.length === 0
              ? <p style={{color:'#6B7280'}}>No prayer requests found.</p>
              : sortedGroups.map(([date, entries]) => (
                <div key={date} style={{marginBottom:'24px'}}>
                  <div style={{background:'#1B3A6B', color:'white', padding:'8px 14px', borderRadius:'8px', fontWeight:'600', fontSize:'14px', marginBottom:'10px'}}>
                    {date}
                  </div>
                  {entries.map(r => <PrayerCard key={r.id} request={r} />)}
                </div>
              ));
          })()
        )}
      </>
    )}
  </>
)}
      <footer style={{textAlign:'center', marginTop:'40px', paddingTop:'20px', borderTop:'1px solid #E2E8F0', color:'#6B7280', fontSize:'13px'}}>
        © 2026 Prayer Wall — All Rights Reserved
      </footer>
    </div>
  );
}

const styles = {
  page: { maxWidth: '800px', margin: '0 auto', padding: '0 20px 20px', fontFamily: 'sans-serif' },
  navBar: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    padding:'16px 0', borderBottom:'1px solid #E2E8F0', marginBottom:'16px'
  },
  navLogo: { fontWeight:'700', color:'#1B3A6B', fontSize:'18px' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  title: { color: '#1B3A6B', margin: 0 },
  subtitle: { color: '#6B7280', marginTop: '8px' },
  logoutBtn: { background:'#DC2626', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer' },
  churchGrid: { display:'flex', flexDirection:'column', gap:'12px', maxWidth:'500px', marginTop:'12px' },
  churchCard: { display:'flex', alignItems:'center', gap:'12px', background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px', padding:'16px', cursor:'pointer', textAlign:'left', fontSize:'16px' },
  churchIcon: { fontSize:'28px' },
  churchName: { fontWeight:'700', color:'#1B3A6B', fontSize:'16px' },
  churchTagline: { fontSize:'13px', color:'#6B7280' },
  changeChurch: { background:'none', border:'1px solid #E2E8F0', borderRadius:'6px', padding:'6px 12px', color:'#1B3A6B', cursor:'pointer', fontSize:'13px' },
  tab: { flex:1, padding:'10px', border:'1px solid #E2E8F0', borderRadius:'6px', background:'#fff', color:'#6B7280', cursor:'pointer', fontSize:'14px' },
  tabActive: { flex:1, padding:'10px', border:'1px solid #1B3A6B', borderRadius:'6px', background:'#1B3A6B', color:'#fff', cursor:'pointer', fontSize:'14px' },
  dateBox: { background:'#F4F7FB', padding:'12px', borderRadius:'8px', marginBottom:'12px' },
  formBox: { background:'#F4F7FB', padding:'16px', borderRadius:'8px', marginBottom:'16px' },
  label: { display:'block', fontWeight:'600', marginBottom:'4px', fontSize:'14px', color:'#333' },
  input: { display:'block', width:'100%', padding:'8px', marginBottom:'12px', border:'1px solid #ccc', borderRadius:'6px', boxSizing:'border-box' },
  saveBtn: { background:'#1B3A6B', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer', marginRight:'8px' },
  cancelBtn: { background:'#6B7280', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer' },
  th: { padding:'8px', textAlign:'left' },
  td: { padding:'8px' },
  commentCard: { background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px', padding:'12px', marginBottom:'8px' },
  approveBtn: { background:'#16A34A', color:'white', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer', marginRight:'8px' },
  rejectBtn: { background:'#DC2626', color:'white', border:'none', padding:'6px 12px', borderRadius:'4px', cursor:'pointer' },
  backBtn: { background:'none', border:'1px solid #1B3A6B', borderRadius:'6px', padding:'6px 12px', color:'#1B3A6B', cursor:'pointer', fontSize:'13px' },
  datePill: { display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', padding:'12px 16px', marginBottom:'8px', background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px', cursor:'pointer', fontSize:'14px', color:'#1B3A6B', fontWeight:'600' },
  datePillCount: { background:'#E8F0FE', color:'#1B3A6B', borderRadius:'12px', padding:'2px 10px', fontSize:'12px', fontWeight:'normal' },
  statusBtn: {
    display: 'block', width: '100%', maxWidth: '500px', margin: '20px auto 0',
    background: 'none', border: '1px solid #1B3A6B', borderRadius: '10px',
    padding: '14px 16px', cursor: 'pointer', fontSize: '15px', color: '#1B3A6B', fontWeight: '600'
  },
  textLayoutBtn: { background:'#1B3A6B', color:'white', border:'none', padding:'8px 14px', borderRadius:'6px', cursor:'pointer', fontSize:'13px' },
  overlay: { position:'fixed', top:0, left:0, width:'100%', height:'100%', background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 },
  popup: { background:'#fff', borderRadius:'12px', padding:'20px', width:'90%', maxWidth:'500px', boxShadow:'0 8px 24px rgba(0,0,0,0.2)' },
  closeBtn: { background:'none', border:'1px solid #ccc', borderRadius:'6px', padding:'6px 12px', cursor:'pointer', fontSize:'13px' },
  copyBtn: { background:'#16A34A', color:'white', border:'none', padding:'10px 16px', borderRadius:'6px', cursor:'pointer', fontSize:'14px', marginTop:'10px', width:'100%' }
};
