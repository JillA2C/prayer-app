import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRandomGame } from '../api/prayerApi';

export default function EntryGate() {
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [loadingGame, setLoadingGame] = useState(true);
  const [hintIndex, setHintIndex] = useState(0);
  const savedName = localStorage.getItem('visitorName') || '';
  const isReturning = !!savedName;
  const [name, setName] = useState(savedName);
  const [unlocked, setUnlocked] = useState(false);
  const [guess, setGuess] = useState('');
  const [error, setError] = useState('');
  const [solved, setSolved] = useState(false);

  useEffect(() => {
    getRandomGame()
      .then(data => {
        setGame({ answer: data.answer, hints: [data.hint1, data.hint2, data.hint3].filter(Boolean) });
        setLoadingGame(false);
      })
      .catch(() => setLoadingGame(false));
  }, []);

  const handleGuess = () => {
    if (guess.trim().toLowerCase() === game.answer.toLowerCase()) {
      setSolved(true); setError('');
    } else {
      setError('Not quite 鈥� try again!');
      if (hintIndex < game.hints.length - 1) setHintIndex(hintIndex + 1);
    }
  };

  const handleEnter = () => {
    if (!name.trim()) { setError('Please enter your name.'); return; }
    localStorage.setItem('visitorName', name.trim());
    sessionStorage.setItem('entered', 'true');
    window.location.href = '/';
  };

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.iconWrap}>馃檹</div>
        <h1 style={S.title}>Welcome to Prayer Wall</h1>
        <p style={S.subtitle}>We're glad you're here. Please complete the steps below to continue.</p>

        {/* Step 1 */}
        <div style={S.step}>
          <span style={S.stepNum}>1</span>
          <div style={S.stepBody}>
            <label style={S.label}>Enter Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Type your name here..."
              readOnly={isReturning && !unlocked}
              style={{ ...S.input, ...(isReturning && !unlocked ? S.inputReadonly : {}) }}
            />
            {isReturning && !unlocked && (
              <button onClick={() => setUnlocked(true)} style={S.changeLink}>Not you? Change name</button>
            )}
          </div>
        </div>

        {/* Step 2 */}
        <div style={S.step}>
          <span style={S.stepNum}>2</span>
          <div style={S.stepBody}>
            <label style={S.label}>Answer this to continue:</label>
            {loadingGame ? (
              <p style={S.hint}>Loading game...</p>
            ) : !game ? (
              <p style={{ color: '#DC2626', fontSize: '13px' }}>Could not load game. Refresh to try again.</p>
            ) : (
              <div style={S.gameBox}>
                <p style={S.gameTitle}>鉁� Guess the Bible Character</p>
                {game.hints.slice(0, hintIndex + 1).map((hint, i) => (
                  <p key={i} style={S.hint}>馃挕 Hint {i + 1}: {hint}</p>
                ))}
                {!solved ? (
                  <>
                    <input
                      type="text"
                      value={guess}
                      onChange={e => setGuess(e.target.value)}
                      placeholder="Type your answer..."
                      style={S.input}
                      onKeyDown={e => e.key === 'Enter' && handleGuess()}
                    />
                    <button onClick={handleGuess} style={S.submitBtn}>Submit</button>
                  </>
                ) : (
                  <p style={S.correct}>鉁� Correct! You may now enter.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {error && <p style={S.error}>{error}</p>}

        <button onClick={handleEnter} disabled={!solved} style={solved ? S.enterBtn : S.enterBtnDisabled}>
          {solved ? '馃檹 Enter' : '馃敀 Enter'}
        </button>
      </div>
    </div>
  );
}

const S = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(160deg, #1B3A6B 0%, #2A5298 50%, #87CEEB 100%)',
    padding: '20px',
  },
  card: {
    background: '#fff',
    borderRadius: '20px',
    padding: '36px 28px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
    textAlign: 'center',
  },
  iconWrap: { fontSize: '44px', marginBottom: '10px', lineHeight: 1 },
  title: { fontSize: '22px', fontWeight: '700', color: '#1B3A6B', margin: '8px 0 6px', fontFamily: 'Georgia, serif' },
  subtitle: { color: '#6B7280', fontSize: '14px', marginBottom: '28px', lineHeight: '1.5' },
  step: { display: 'flex', gap: '14px', marginBottom: '22px', textAlign: 'left' },
  stepNum: {
    background: '#1B3A6B', color: '#fff', borderRadius: '50%',
    width: '28px', height: '28px', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: '13px', fontWeight: '700', flexShrink: 0, marginTop: '2px',
  },
  stepBody: { flex: 1 },
  label: { display: 'block', fontWeight: '600', marginBottom: '8px', color: '#1B3A6B', fontSize: '14px' },
  input: {
    width: '100%', padding: '11px 14px', border: '1.5px solid #D1D5DB',
    borderRadius: '8px', fontSize: '14px', marginBottom: '8px',
    outline: 'none', transition: 'border-color 0.2s', fontFamily: 'inherit',
  },
  inputReadonly: { background: '#F9FAFB', color: '#9CA3AF', cursor: 'default' },
  gameBox: { background: '#EEF3FB', borderRadius: '10px', padding: '14px', border: '1px solid #C7D8F0' },
  gameTitle: { fontWeight: '700', marginBottom: '10px', fontSize: '14px', color: '#1B3A6B' },
  hint: { fontSize: '13px', color: '#4B5563', margin: '4px 0', lineHeight: '1.4' },
  submitBtn: {
    background: '#1B3A6B', color: '#fff', border: 'none', borderRadius: '8px',
    padding: '11px', width: '100%', cursor: 'pointer', fontSize: '14px',
    fontWeight: '600', marginTop: '4px', transition: 'background 0.2s',
  },
  correct: { color: '#16A34A', fontWeight: '700', fontSize: '14px', marginTop: '8px' },
  error: { color: '#DC2626', fontSize: '13px', marginBottom: '12px' },
  enterBtn: {
    background: 'linear-gradient(135deg, #C9A84C, #B8943E)', color: '#fff',
    border: 'none', borderRadius: '10px', padding: '14px', width: '100%',
    cursor: 'pointer', fontSize: '16px', fontWeight: '700', marginTop: '8px',
    boxShadow: '0 4px 12px rgba(201,168,76,0.4)', transition: 'transform 0.1s',
  },
  enterBtnDisabled: {
    background: '#E5E7EB', color: '#9CA3AF', border: 'none',
    borderRadius: '10px', padding: '14px', width: '100%',
    cursor: 'not-allowed', fontSize: '16px', fontWeight: '700', marginTop: '8px',
  },
  changeLink: {
    background: 'none', border: 'none', color: '#1B3A6B', fontSize: '12px',
    textDecoration: 'underline', cursor: 'pointer', padding: '2px 0',
  },
};
