import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../api/prayerApi';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async () => {
    try {
      const data = await adminLogin(form);
      localStorage.setItem('adminToken', data.token);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div style={{maxWidth:'320px', margin:'80px auto', fontFamily:'sans-serif'}}>
      <h2 style={{color:'#1B3A6B', textAlign:'center'}}>Admin Login</h2>
      <input
        placeholder="Username"
        value={form.username}
        onChange={e => setForm({...form, username: e.target.value})}
        style={{display:'block', width:'100%', padding:'8px', marginBottom:'8px'}}
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={e => setForm({...form, password: e.target.value})}
        style={{display:'block', width:'100%', padding:'8px', marginBottom:'8px'}}
      />
      {error && <p style={{color:'#DC2626'}}>{error}</p>}
      <button onClick={handleSubmit}
        style={{width:'100%', background:'#1B3A6B', color:'white', border:'none', padding:'10px', borderRadius:'4px', cursor:'pointer'}}>
        Log In
      </button>
    </div>
  );
}