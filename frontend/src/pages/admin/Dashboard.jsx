import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  adminGetRequests, adminAddRequest, adminEditRequest, adminDeleteRequest
} from '../../api/prayerApi';

export default function Dashboard() {
  const [requests, setRequests] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ full_name:'', prayer_title:'', prayer_message:'', show_name:true });
  const navigate = useNavigate();

  const load = async () => {
    const data = await adminGetRequests();
    setRequests(data.requests);
  };

  useEffect(() => { load(); }, []);

  const resetForm = () => {
    setForm({ full_name:'', prayer_title:'', prayer_message:'', show_name:true });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSave = async () => {
    if (editingId) {
      await adminEditRequest(editingId, { ...form, status: 'approved' });
    } else {
      await adminAddRequest(form);
    }
    resetForm();
    load();
  };

  const handleEdit = (r) => {
    setForm({ full_name: r.full_name, prayer_title: r.prayer_title, prayer_message: r.prayer_message, show_name: r.show_name });
    setEditingId(r.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this request permanently?')) return;
    await adminDeleteRequest(id);
    load();
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/admin/login');
  };

  return (
    <div style={{maxWidth:'800px', margin:'0 auto', padding:'20px', fontFamily:'sans-serif'}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
        <h2 style={{color:'#1B3A6B'}}>Prayer Requests</h2>
        <div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            style={{background:'#16A34A', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer', marginRight:'8px'}}>
            + Add New
          </button>
          <a href="/admin/comments" style={{marginRight:'8px'}}>Comments</a>
          <button onClick={handleLogout}
            style={{background:'#DC2626', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer'}}>
            Logout
          </button>
        </div>
      </div>

      {showForm && (
        <div style={{background:'#F4F7FB', padding:'16px', borderRadius:'6px', marginTop:'16px'}}>
          <h3>{editingId ? 'Edit Request' : 'Add New Request'}</h3>
          <input placeholder="Full Name" value={form.full_name}
            onChange={e => setForm({...form, full_name: e.target.value})}
            style={{display:'block', width:'100%', padding:'8px', marginBottom:'6px'}} />
          <input placeholder="Prayer Title" value={form.prayer_title}
            onChange={e => setForm({...form, prayer_title: e.target.value})}
            style={{display:'block', width:'100%', padding:'8px', marginBottom:'6px'}} />
          <textarea placeholder="Prayer Message" rows={4} value={form.prayer_message}
            onChange={e => setForm({...form, prayer_message: e.target.value})}
            style={{display:'block', width:'100%', padding:'8px', marginBottom:'6px'}} />
          <label>
            <input type="checkbox" checked={form.show_name}
              onChange={e => setForm({...form, show_name: e.target.checked})} />
            {' '}Show name publicly
          </label>
          <div style={{marginTop:'8px'}}>
            <button onClick={handleSave}
              style={{background:'#1B3A6B', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer', marginRight:'8px'}}>
              Save
            </button>
            <button onClick={resetForm}
              style={{background:'#6B7280', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer'}}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <table style={{width:'100%', marginTop:'20px', borderCollapse:'collapse'}}>
        <thead>
          <tr style={{background:'#1B3A6B', color:'white'}}>
            <th style={{padding:'8px', textAlign:'left'}}>Name</th>
            <th style={{padding:'8px', textAlign:'left'}}>Title</th>
            <th style={{padding:'8px', textAlign:'left'}}>Date</th>
            <th style={{padding:'8px', textAlign:'left'}}>Status</th>
            <th style={{padding:'8px', textAlign:'left'}}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map(r => (
            <tr key={r.id} style={{borderBottom:'1px solid #ddd'}}>
              <td style={{padding:'8px'}}>{r.full_name}</td>
              <td style={{padding:'8px'}}>{r.prayer_title}</td>
              <td style={{padding:'8px'}}>{new Date(r.date_added).toLocaleDateString()}</td>
              <td style={{padding:'8px'}}>{r.status}</td>
              <td style={{padding:'8px'}}>
                <button onClick={() => handleEdit(r)} style={{marginRight:'6px'}}>Edit</button>
                <button onClick={() => handleDelete(r.id)} style={{color:'#DC2626'}}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}