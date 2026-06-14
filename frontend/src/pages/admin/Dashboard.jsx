import PrayerCard from '../../components/PrayerCard';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  adminGetRequests, adminAddRequest, adminEditRequest, adminDeleteRequest,
  adminGetComments, adminApproveComment, adminRejectComment
} from '../../api/prayerApi';

const CHURCHES = [
  { id: 'st_michael', name: 'St. Michael Parish', tagline: 'Growing in Faith, United in Prayer', icon: '⛪' },
  { id: 'holy_trinity', name: 'Holy Trinity Chapel', tagline: 'One Faith, One Family', icon: '✝️' }
];

export default function Dashboard() {
  const [church, setChurch] = useState(null);
  const [adminTab, setAdminTab] = useState('manage');
  const [requests, setRequests] = useState([]);
  const [pendingComments, setPendingComments] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [form, setForm] = useState({ full_name:'', prayer_message:'' });
  const [editingId, setEditingId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('idle');
  const navigate = useNavigate();

  const load = async () => {
    const data = await adminGetRequests();
    const filtered = data.requests
      .filter(r => r.church === church)
      .map(r => ({
        ...r,
        display_name: r.show_name ? r.full_name : 'Anonymous',
        preview: r.prayer_message?.slice(0, 200)
      }));
    setRequests(filtered);
  };

  const loadComments = async () => {
    const data = await adminGetComments('pending');
    setPendingComments(data.comments);
  };

  useEffect(() => {
    if (church) { load(); loadComments(); }
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
      resetForm();
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

  const handleApprove = async (id) => {
    await adminApproveComment(id);
    loadComments();
  };

  const handleReject = async (id) => {
    await adminRejectComment(id);
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
  };

  // Filter requests by selected date
  const requestsForDate = selectedDate
    ? requests.filter(r =>
        new Date(r.date_added).toISOString().slice(0,10) === selectedDate
      )
    : requests;

  // Church selection screen
  if (!church) {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
        </header>
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
      </div>
    );
  }

  const churchInfo = CHURCHES.find(c => c.id === church);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Admin Dashboard</h1>
        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
      </header>

      <button onClick={handleChangeChurch} style={styles.changeChurch}>
        {churchInfo.icon} {churchInfo.name} (change)
      </button>

      {/* Tabs */}
      <div style={{display:'flex', gap:'8px', margin:'16px 0'}}>
        <button onClick={() => setAdminTab('manage')}
          style={adminTab === 'manage' ? styles.tabActive : styles.tab}>
          ⚙️ Manage
        </button>
        <button onClick={() => setAdminTab('public')}
          style={adminTab === 'public' ? styles.tabActive : styles.tab}>
          🌐 Public View
        </button>
      </div>

      {/* MANAGE TAB */}
      {adminTab === 'manage' && (
        <>
          {/* Date selection */}
          {!selectedDate ? (
            <div>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px'}}>
                <h3 style={{color:'#1B3A6B', margin:0}}>📅 Select a Date</h3>
                <input
                  type="date"
                  onChange={e => { if(e.target.value) { setSelectedDate(e.target.value); resetForm(); }}}
                  style={{padding:'6px', border:'1px solid #ccc', borderRadius:'6px', fontSize:'13px'}}
                  title="Pick a new date"
                />
              </div>
              {(() => {
                const groups = {};
                requests.forEach(r => {
                  const dateKey = new Date(r.date_added).toISOString().slice(0,10);
                  if (!groups[dateKey]) groups[dateKey] = 0;
                  groups[dateKey]++;
                });
                const sortedDates = Object.entries(groups).sort((a,b) => b[0].localeCompare(a[0]));
                return sortedDates.length === 0
                  ? <p style={{color:'#6B7280'}}>No entries yet. Pick a date above to start adding.</p>
                  : sortedDates.map(([dateKey, count]) => (
                    <button key={dateKey}
                      onClick={() => { setSelectedDate(dateKey); resetForm(); }}
                      style={styles.datePill}>
                      📅 {new Date(dateKey + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}
                      <span style={styles.datePillCount}>{count} {count === 1 ? 'entry' : 'entries'}</span>
                    </button>
                  ));
              })()}
            </div>
          ) : (
            <div style={{marginBottom:'12px'}}>
              <button onClick={() => { setSelectedDate(''); resetForm(); }} style={styles.backBtn}>
                ← Back to Dates
              </button>
              <span style={{marginLeft:'12px', fontWeight:'600', color:'#1B3A6B'}}>
                📅 {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}
              </span>
            </div>
          )}

          {/* Add / Edit form */}
          {selectedDate && (
            <div style={styles.formBox}>
              <h3 style={{marginTop:0, color:'#1B3A6B'}}>
                {editingId ? 'Edit Prayer Request' : '+ Add Prayer Request'}
                <span style={{fontWeight:'normal', fontSize:'14px', color:'#6B7280', marginLeft:'8px'}}>
                  for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}
                </span>
              </h3>
              <label style={styles.label}>Name</label>
              <input
                placeholder="Enter name"
                value={form.full_name}
                onChange={e => setForm({...form, full_name: e.target.value})}
                style={styles.input}
              />
              <label style={styles.label}>Prayer Request</label>
              <textarea
                placeholder="Enter the prayer request..."
                rows={4}
                value={form.prayer_message}
                onChange={e => setForm({...form, prayer_message: e.target.value})}
                style={styles.input}
              />
              {saveStatus === 'success' && (
                <p style={{color:'#16A34A', marginBottom:'8px'}}>✅ Saved successfully!</p>
              )}
              {saveStatus === 'error' && (
                <p style={{color:'#DC2626', marginBottom:'8px'}}>❌ Something went wrong. Try again.</p>
              )}
              <div style={{display:'flex', gap:'8px'}}>
                <button onClick={handleSave} disabled={saveStatus==='loading'} style={styles.saveBtn}>
                  {saveStatus === 'loading' ? 'Saving...' : 'Save'}
                </button>
                {editingId && (
                  <button onClick={resetForm} style={styles.cancelBtn}>Cancel Edit</button>
                )}
              </div>
            </div>
          )}

          {/* Prayer Requests Table */}
          {selectedDate && <h3 style={{color:'#1B3A6B', marginTop:'24px'}}>
            Prayer Requests — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'})}
          </h3>}
          {selectedDate && (requestsForDate.length === 0
            ? <p style={{color:'#6B7280'}}>No entries for this date.</p>
            : (() => {
                // Group by date
                const groups = {};
                requestsForDate.forEach(r => {
                  const dateKey = new Date(r.date_added).toLocaleDateString('en-US', {month:'long', day:'numeric', year:'numeric'});
                  if (!groups[dateKey]) groups[dateKey] = [];
                  groups[dateKey].push(r);
                });
                return Object.entries(groups).map(([date, entries]) => (
                  <div key={date} style={{marginBottom:'20px'}}>
                    <div style={{background:'#1B3A6B', color:'white', padding:'8px 12px', borderRadius:'6px 6px 0 0', fontWeight:'600', fontSize:'14px'}}>
                      📅 {date} — {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                    </div>
                    <table style={{width:'100%', borderCollapse:'collapse', border:'1px solid #E2E8F0'}}>
                      <thead>
                        <tr style={{background:'#F4F7FB'}}>
                          <th style={styles.th}>Name</th>
                          <th style={styles.th}>Prayer</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entries.map(r => (
                          <tr key={r.id} style={{borderBottom:'1px solid #E2E8F0'}}>
                            <td style={styles.td}>{r.full_name}</td>
                            <td style={styles.td}>{r.prayer_message?.slice(0, 60)}...</td>
                            <td style={styles.td}>{r.status}</td>
                            <td style={styles.td}>
                              <button onClick={() => handleEdit(r)} style={{marginRight:'6px'}}>Edit</button>
                              <button onClick={() => handleDelete(r.id)} style={{color:'#DC2626'}}>Delete</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ));
              })()
          )}
          
          {/* Pending Comments */}
          <h3 style={{color:'#1B3A6B', marginTop:'32px'}}>Pending Comments</h3>
          {pendingComments.length === 0
            ? <p style={{color:'#6B7280'}}>No pending comments.</p>
            : pendingComments.map(c => (
              <div key={c.id} style={styles.commentCard}>
                <div style={{fontSize:'13px', color:'#6B7280', marginBottom:'4px'}}>
                  On: <strong>{c.prayer_title}</strong> — by {c.visitor_name}
                </div>
                <div style={{marginBottom:'8px'}}>{c.comment_text}</div>
                <button onClick={() => handleApprove(c.id)} style={styles.approveBtn}>Approve</button>
                <button onClick={() => handleReject(c.id)} style={styles.rejectBtn}>Reject</button>
              </div>
            ))
          }
        </>
      )}

      {/* PUBLIC VIEW TAB */}
      {adminTab === 'public' && (
        <>
          <p style={{color:'#6B7280', fontSize:'13px', marginBottom:'12px'}}>
            This is how visitors see the prayer wall. You can pray and leave encouragements too.
          </p>
          {requests.length === 0
            ? <p style={{color:'#6B7280'}}>No prayer requests for this church yet.</p>
            : requests.map(r => <PrayerCard key={r.id} request={r} />)
          }
        </>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  title: { color: '#1B3A6B', margin: 0 },
  subtitle: { color: '#6B7280', marginTop: '8px' },
  logoutBtn: { background:'#DC2626', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer' },
  churchGrid: { display:'flex', flexDirection:'column', gap:'12px', maxWidth:'500px', marginTop:'12px' },
  churchCard: {
    display:'flex', alignItems:'center', gap:'12px',
    background:'#fff', border:'1px solid #E2E8F0', borderRadius:'10px',
    padding:'16px', cursor:'pointer', textAlign:'left', fontSize:'16px'
  },
  churchIcon: { fontSize:'28px' },
  churchName: { fontWeight:'700', color:'#1B3A6B', fontSize:'16px' },
  churchTagline: { fontSize:'13px', color:'#6B7280' },
  changeChurch: {
    background:'none', border:'1px solid #E2E8F0', borderRadius:'6px',
    padding:'6px 12px', color:'#1B3A6B', cursor:'pointer', fontSize:'13px'
  },
  tab: {
    flex:1, padding:'10px', border:'1px solid #E2E8F0', borderRadius:'6px',
    background:'#fff', color:'#6B7280', cursor:'pointer', fontSize:'14px'
  },
  tabActive: {
    flex:1, padding:'10px', border:'1px solid #1B3A6B', borderRadius:'6px',
    background:'#1B3A6B', color:'#fff', cursor:'pointer', fontSize:'14px'
  },
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
  datePill: {
    display:'flex', justifyContent:'space-between', alignItems:'center',
    width:'100%', padding:'12px 16px', marginBottom:'8px',
    background:'#fff', border:'1px solid #E2E8F0', borderRadius:'8px',
    cursor:'pointer', fontSize:'14px', color:'#1B3A6B', fontWeight:'600'
  },
  datePillCount: {
    background:'#E8F0FE', color:'#1B3A6B', borderRadius:'12px',
    padding:'2px 10px', fontSize:'12px', fontWeight:'normal'
  }
};