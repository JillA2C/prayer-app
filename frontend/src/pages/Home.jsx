import { useState, useEffect } from 'react';
import PrayerCard from '../components/PrayerCard';
import { getRequests, searchRequests } from '../api/prayerApi';

export default function Home() {
  const [requests, setRequests] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const data = search
      ? await searchRequests({ name: search })
      : await getRequests();
    setRequests(data.requests);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <div style={{maxWidth:'800px', margin:'0 auto', padding:'20px', fontFamily:'sans-serif'}}>
      <header style={{textAlign:'center', marginBottom:'24px'}}>
        <h1 style={{color:'#1B3A6B', fontFamily:'Georgia, serif'}}>Prayer Requests</h1>
        <p style={{color:'#6B7280'}}>Praying together in faith</p>
      </header>

      <div style={{display:'flex', gap:'8px', marginBottom:'20px'}}>
        <input
          placeholder="Search by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{flex:1, padding:'8px', border:'1px solid #ccc', borderRadius:'4px'}}
        />
        <button onClick={load}
          style={{background:'#1B3A6B', color:'white', border:'none', padding:'8px 16px', borderRadius:'4px', cursor:'pointer'}}>
          Search
        </button>
      </div>

      {loading ? <p>Loading...</p> :
        requests.length === 0 ? <p>No prayer requests yet.</p> :
        requests.map(r => <PrayerCard key={r.id} request={r} />)
      }
    </div>
  );
}