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
  const [requests, setRequests] = useState([]);
  const [pendingComments, setPendingComments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ full_name:'', prayer_message:'' });
  const navigate = useNavigate();

  const load = async () => {
    const data = await adminGetRequests();
    setRequests(data.requests.filter(r => r.church === church));
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
    setShowForm(false);
  };   
  const handleSave = async () => {
    console.log('Saving with church:', church);
    const payload = {
      full_name: form.full_name,
      prayer_title: 'Prayer Request',
      prayer_message: form.prayer_message,
      show_name: true,
      church
    };
    if (editingId) {
      await adminEditRequest(editingId, { ...payload, status: 'approved' });
    } else {
      await adminAddRequest(payload);
    }
    resetForm();
    load();
  };

  const handleEdit = (r) => {
    setForm({ full_name: r.full_name, prayer_message: r.prayer_message });
    setEditingId(r.id);
    setShowForm(true);
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
  };

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

      <button onClick={() => window.open('/', '_blank')} style={styles.viewPublicBtn}>
        🌐 View Public Site
      </button>

      <div style={{display:'flex', gap:'8px', margin:'16px 0'}}>
        <button onClick={() => { resetForm(); setShowForm(v => !v); }} style={styles.addBtn}>
          + Add Prayer Request
        </button>
      </div>

      {showForm && (
        <div style={styles.formBox}>
          <h3 style={{marginTop:0}}>{editingId ? 'Edit Request' : 'Add Prayer Request'}</h3>
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
          <div style={{marginTop:'8px'}}>
            <button onClick={handleSave} style={styles.saveBtn}>Save</button>
            <button onClick={resetForm} style={styles.cancelBtn}>Cancel</button>
          </div>
        </div>
      )}

      <h3 style={{color:'#1B3A6B', marginTop:'24px'}}>Prayer Requests</h3>
      <table style={{width:'100%', borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#1B3A6B', color:'white'}}>
            <th style={styles.th}>Name</th>
            <th style={styles.th}>Prayer</th>
            <th style={styles.th}>Date</th>
            <th style={styles.th}>Status</th>
            <th style={styles.th}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(r => (
            <tr key={r.id} style={{borderBottom:'1px solid #ddd'}}>
              <td style={styles.td}>{r.full_name}</td>
              <td style={styles.td}>{r.prayer_message?.slice(0, 60)}...</td>
              <td style={styles.td}>{new Date(r.date_added).toLocaleDateString()}</td>
              <td style={styles.td}>{r.status}</td>
              <td style={styles.td}>
                <button onClick={() => handleEdit(r)} style={{marginRight:'6px'}}>Edit</button>
                <button onClick={() => handleDelete(r.id)} style={{color:'#DC2626'}}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 style={{color:'#1B3A6B', marginTop:'32px'}}>Pending Comments</h3>
      {pendingComments.length === 0 ? <p style={{color:'#6B7280'}}>No pending comments.</p> :
        pendingComments.map(c => (
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
    </div>
  );
}

const styles = {
  page: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  header: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  title: { color: '#1B3A6B', margin: 0 },
  subtitle: { color: '#6B7280', marginTop: '8px' },
  logoutBtn: { background:'#DC2626', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer' },
  churchGrid: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px', marginTop:'12px' },
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
    padding: '6px 12px', color: '#1B3A6B', cursor: 'pointer', fontSize: '13px'
  },
  addBtn: { background:'#16A34A', color:'white', border:'none', padding:'10px 16px', borderRadius:'6px', cursor:'pointer' },
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
  viewPublicBtn: {
    background:'none', border:'1px solid #1B3A6B', borderRadius:'6px',
    padding:'6px 12px', color:'#1B3A6B', cursor:'pointer', fontSize:'13px', marginLeft:'8px'
  }
};