import { useState, useEffect } from 'react';
import { getRandomGame } from '../api/prayerApi';

export default function EntryGate() {
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
    if (!guess.trim()) return;
    if (guess.trim().toLowerCase() === game.answer.toLowerCase()) {
      setSolved(true); setError('');
    } else {
      setError('Not quite — try again!');
      if (hintIndex < game.hints.length - 1) setHintIndex(i => i + 1);
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
        <div style={S.iconArea}>
          <img
            src="https://fonts.gstatic.com/s/e/notoemoji/latest/1f64f/512.png"
            alt="praying hands"
            width="56"
            height="56"
            style={{ display: 'block', margin: '0 auto 10px' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
        </div>

        <h1 style={S.title}>Welcome to Prayer Wall</h1>
        <p style={S.subtitle}>We're glad you're here. Please complete the steps below to continue.</p>

        {/* Step 1 */}
        <div style={S.step}>
          <div style={S.stepNum}>1</div>
          <div style={S.stepBody}>
            <div style={S.label}>Enter Your Name</div>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Type your name here..."
              readOnly={isReturning && !unlocked}
              style={isReturning && !unlocked ? { ...S.input, ...S.inputReadonly } : S.input}
            />
            {isReturning && !unlocked && (
              <button onClick={() => setUnlocked(true)} style={S.linkBtn}>
                Not you? Change name
              </button>
            )}
          </div>
        </div>

        {/* Step 2 */}
        <div style={S.step}>
          <div style={S.stepNum}>2</div>
          <div style={S.stepBody}>
            <div style={S.label}>Answer this to continue:</div>
            {loadingGame ? (
              <p style={S.muted}>Loading game...</p>
            ) : !game ? (
              <p style={S.errText}>Could not load game. Please refresh.</p>
            ) : (
              <div style={S.gameBox}>
                <div style={S.gameTitle}>Guess the Bible Character</div>
                {game.hints.slice(0, hintIndex + 1).map((hint, i) => (
                  <div key={i} style={S.hint}>Hint {i + 1}: {hint}</div>
                ))}
                {!solved ? (
                  <>
                    <input
                      type="text"
                      value={guess}
                      onChange={e => setGuess(e.target.value)}
                      placeholder="Your answer..."
                      style={{ ...S.input, marginTop: '10px' }}
                      onKeyDown={e => e.key === 'Enter' && handleGuess()}
                    />
                    {error && <p style={S.errText}>{error}</p>}
                    <button onClick={handleGuess} style={S.navyBtn}>Submit</button>
                  </>
                ) : (
                  <p style={S.correctText}>Correct! You may now enter.</p>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={handleEnter}
          disabled={!solved}
          style={solved ? S.enterBtn : S.enterBtnDisabled}
        >
          {solved ? 'Enter' : 'Enter'}
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
    background: 'linear-gradient(180deg, #b8d4ed 0%, #d6e9f8 50%, #eaf4fb 100%)',
    padding: '24px 16px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  card: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '36px 28px',
    maxWidth: '440px',
    width: '100%',
    boxShadow: '0 10px 40px rgba(0,0,0,0.14)',
    textAlign: 'center',
  },
  iconArea: { marginBottom: '4px' },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#1B3A6B',
    margin: '0 0 8px',
    fontFamily: "'Segoe UI', Arial, sans-serif",
  },
  subtitle: {
    color: '#888',
    fontSize: '14px',
    lineHeight: '1.55',
    marginBottom: '28px',
  },
  step: {
    display: 'flex',
    gap: '12px',
    marginBottom: '22px',
    textAlign: 'left',
  },
  stepNum: {
    background: '#1B3A6B',
    color: '#fff',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    minWidth: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '700',
    marginTop: '2px',
  },
  stepBody: { flex: 1 },
  label: {
    fontWeight: '700',
    color: '#1a1a1a',
    fontSize: '14px',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    padding: '11px 13px',
    border: '1.5px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '14px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    color: '#333',
    background: '#fff',
    display: 'block',
  },
  inputReadonly: {
    background: '#F5F5F5',
    color: '#999',
    cursor: 'default',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#1B3A6B',
    fontSize: '12px',
    textDecoration: 'underline',
    cursor: 'pointer',
    padding: '4px 0',
    fontFamily: 'inherit',
  },
  gameBox: {
    background: '#EEF4FB',
    border: '1px solid #C8DDF0',
    borderRadius: '10px',
    padding: '14px',
  },
  gameTitle: {
    fontWeight: '700',
    color: '#1B3A6B',
    fontSize: '14px',
    marginBottom: '8px',
  },
  hint: {
    fontSize: '13px',
    color: '#555',
    marginBottom: '4px',
    lineHeight: '1.4',
  },
  navyBtn: {
    background: '#1B3A6B',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px',
    width: '100%',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    marginTop: '8px',
    fontFamily: 'inherit',
  },
  correctText: {
    color: '#16A34A',
    fontWeight: '700',
    fontSize: '14px',
    marginTop: '10px',
  },
  errText: {
    color: '#DC2626',
    fontSize: '12px',
    margin: '6px 0 0',
  },
  muted: {
    color: '#999',
    fontSize: '13px',
  },
  enterBtn: {
    background: '#1B3A6B',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    width: '100%',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '700',
    marginTop: '6px',
    fontFamily: 'inherit',
    boxShadow: '0 4px 14px rgba(27,58,107,0.35)',
    letterSpacing: '0.3px',
  },
  enterBtnDisabled: {
    background: '#C8C8C8',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '14px',
    width: '100%',
    cursor: 'not-allowed',
    fontSize: '16px',
    fontWeight: '700',
    marginTop: '6px',
    fontFamily: 'inherit',
  },
};

