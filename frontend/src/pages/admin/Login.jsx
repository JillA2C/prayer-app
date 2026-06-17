import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../api/prayerApi';

export default function Login() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await adminLogin(form);
      if (rememberMe) {
        localStorage.setItem('adminToken', data.token);
      } else {
        sessionStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminToken', data.token);
      }
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight:'100vh', display:'flex', alignItems:'center',
      justifyContent:'center', background:'#F4F7FB', fontFamily:'sans-serif'
    }}>
      <div style={{
        background:'#fff', borderRadius:'12px', padding:'32px',
        width:'100%', maxWidth:'360px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)'
      }}>
        <div style={{textAlign:'center', marginBottom:'24px'}}>
          <div style={{fontSize:'36px', marginBottom:'8px'}}>🙏</div>
          <h2 style={{color:'#1B3A6B', margin:'0 0 4px'}}>Prayer Wall</h2>
          <p style={{color:'#6B7280', fontSize:'13px', margin:0}}>Admin — Sign in to continue</p>
        </div>

        <label style={{display:'block', fontWeight:'600', fontSize:'13px', color:'#333', marginBottom:'4px'}}>Username</label>
        <input
          placeholder="Enter username"
          value={form.username}
          onChange={e => setForm({...form, username: e.target.value})}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{display:'block', width:'100%', padding:'10px', marginBottom:'12px', border:'1px solid #ccc', borderRadius:'6px', fontSize:'14px', boxSizing:'border-box'}}
        />

        <label style={{display:'block', fontWeight:'600', fontSize:'13px', color:'#333', marginBottom:'4px'}}>Password</label>
        <input
          type="password"
          placeholder="Enter password"
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          style={{display:'block', width:'100%', padding:'10px', marginBottom:'12px', border:'1px solid #ccc', borderRadius:'6px', fontSize:'14px', boxSizing:'border-box'}}
        />

        <label style={{display:'flex', alignItems:'center', gap:'8px', marginBottom:'16px', fontSize:'13px', color:'#555', cursor:'pointer'}}>
          <input
            type="checkbox"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
          />
          Remember me
        </label>

        {error && <p style={{color:'#DC2626', fontSize:'13px', marginBottom:'12px'}}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{width:'100%', background:'#1B3A6B', color:'white', border:'none', padding:'12px', borderRadius:'6px', cursor:'pointer', fontSize:'15px', fontWeight:'600'}}>
          {loading ? 'Signing in...' : 'Log In'}
        </button>

        <p style={{textAlign:'center', color:'#6B7280', fontSize:'12px', marginTop:'20px', marginBottom:0}}>
          © 2026 Prayer Wall Admin
        </p>
      </div>
    </div>
  );
}