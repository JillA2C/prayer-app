import { useState, useEffect } from 'react';
import PrayerCard from '../components/PrayerCard';
import { getRequests } from '../api/prayerApi';

const CHURCHES = [
  { id: 'st_michael', name: 'St. Michael Parish', tagline: 'Growing in Faith, United in Prayer', icon: '⛪' },
  { id: 'holy_trinity', name: 'Holy Trinity Chapel', tagline: 'One Faith, One Family', icon: '✝️' }
];

export default function Home() {
  const [church, setChurch] = useState(null);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'name' | 'date'
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nameFilter, setNameFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const load = async (churchId) => {
    setLoading(true);
    const data = await getRequests(1, churchId);
    setRequests(data.requests);
    setLoading(false);
  };

  useEffect(() => {
    if (church) load(church);
  }, [church]);

  // Church selection screen
  if (!church) {
    return (
      <div style={styles.page}>
        <header style={styles.header}>
          <h1 style={styles.title}>Prayer Wall</h1>
          <p style={styles.subtitle}>We are stronger together in prayer.</p>
          <p style={styles.subtitle2}>Choose a church to view and pray for their community.</p>
        </header>
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

  // Filter requests based on view mode
  let displayed = requests;
  if (viewMode === 'name' && nameFilter) {
    displayed = requests.filter(r =>
      r.display_name.toLowerCase().includes(nameFilter.toLowerCase())
    );
  }
  if (viewMode === 'date' && dateFilter) {
    displayed = requests.filter(r =>
      new Date(r.date_added).toISOString().slice(0,10) === dateFilter
    );
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Prayer Wall</h1>
        <button onClick={() => setChurch(null)} style={styles.changeChurch}>
          {churchInfo.icon} {churchInfo.name} (change)
        </button>
      </header>

      <div style={styles.tabs}>
        <button
          onClick={() => setViewMode('all')}
          style={viewMode === 'all' ? styles.tabActive : styles.tab}
        >
          📋 View All
        </button>
        <button
          onClick={() => setViewMode('name')}
          style={viewMode === 'name' ? styles.tabActive : styles.tab}
        >
          👤 View by Name
        </button>
        <button
          onClick={() => setViewMode('date')}
          style={viewMode === 'date' ? styles.tabActive : styles.tab}
        >
          📅 View by Date
        </button>
      </div>

      {viewMode === 'name' && (
        <input
          placeholder="Type a name..."
          value={nameFilter}
          onChange={e => setNameFilter(e.target.value)}
          style={styles.filterInput}
        />
      )}

      {viewMode === 'date' && (
        <input
          type="date"
          value={dateFilter}
          onChange={e => setDateFilter(e.target.value)}
          style={styles.filterInput}
        />
      )}

      {loading ? <p>Loading...</p> :
        displayed.length === 0 ? <p>No prayer requests found.</p> :
        displayed.map(r => <PrayerCard key={r.id} request={r} />)
      }
    </div>
  );
}

const styles = {
  page: { maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' },
  header: { textAlign: 'center', marginBottom: '24px' },
  title: { color: '#1B3A6B', fontFamily: 'Georgia, serif', margin: '0 0 8px' },
  subtitle: { color: '#1B3A6B', fontWeight: '600', margin: '4px 0' },
  subtitle2: { color: '#6B7280', margin: '4px 0' },
  churchGrid: { display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '500px', margin: '0 auto' },
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
    padding: '6px 12px', color: '#1B3A6B', cursor: 'pointer', fontSize: '13px', marginTop: '8px'
  },
  tabs: { display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' },
  tab: {
    flex: 1, padding: '10px', border: '1px solid #E2E8F0', borderRadius: '6px',
    background: '#fff', color: '#6B7280', cursor: 'pointer', fontSize: '14px'
  },
  tabActive: {
    flex: 1, padding: '10px', border: '1px solid #1B3A6B', borderRadius: '6px',
    background: '#1B3A6B', color: '#fff', cursor: 'pointer', fontSize: '14px'
  },
  filterInput: {
    width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '6px',
    marginBottom: '16px', boxSizing: 'border-box'
  }
};