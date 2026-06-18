import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BIBLE_GAMES = [
  {
    answer: 'Moses',
    hints: [
      'I led the Israelites out of Egypt.',
      'I parted the Red Sea.',
      'I received the Ten Commandments on Mount Sinai.'
    ]
  },
  {
    answer: 'David',
    hints: [
      'I was a shepherd before I became king.',
      'I defeated a giant named Goliath.',
      'I wrote many of the Psalms.'
    ]
  },
  {
    answer: 'Noah',
    hints: [
      'God told me to build something huge.',
      'My family and many animals survived a great flood with me.',
      'A rainbow was a sign of God\'s promise after my story.'
    ]
  },
  {
    answer: 'Esther',
    hints: [
      'I became queen of Persia.',
      'I risked my life to save my people.',
      'A whole book of the Bible is named after me.'
    ]
  },
  {
    answer: 'Daniel',
    hints: [
      'I was thrown into a den of lions.',
      'I interpreted dreams for a king.',
      'I remained faithful even when it was illegal to pray.'
    ]
  },
  {
    answer: 'Jonah',
    hints: [
      'I tried to run away from God\'s command.',
      'I was swallowed by a great fish.',
      'God sent me to preach to Nineveh.'
    ]
  },
  {
    answer: 'Mary',
    hints: [
      'I was visited by an angel named Gabriel.',
      'I gave birth in Bethlehem.',
      'My son is Jesus.'
    ]
  },
  {
    answer: 'Peter',
    hints: [
      'I was a fisherman before becoming a disciple.',
      'I once denied knowing Jesus three times.',
      'Jesus called me a "rock."'
    ]
  }
];

export default function EntryGate() {
  const navigate = useNavigate();
  const [game] = useState(() => BIBLE_GAMES[Math.floor(Math.random() * BIBLE_GAMES.length)]);
  const [hintIndex, setHintIndex] = useState(0);
  const [name, setName] = useState(localStorage.getItem('visitorName') || '');
  const [guess, setGuess] = useState('');
  const [error, setError] = useState('');
  const [solved, setSolved] = useState(false);

  const handleGuess = () => {
    if (guess.trim().toLowerCase() === game.answer.toLowerCase()) {
      setSolved(true);
      setError('');
    } else {
      setError('Not quite — try again!');
      if (hintIndex < game.hints.length - 1) {
        setHintIndex(hintIndex + 1);
      }
    }
  };

  const handleEnter = () => {
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    localStorage.setItem('visitorName', name.trim());
    sessionStorage.setItem('entered', 'true');
    window.location.href = '/';
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>🙏</div>
        <h1 style={styles.title}>Welcome to Prayer Wall</h1>
        <p style={styles.subtitle}>
          We're glad you're here. Please complete the steps below to continue.
        </p>

        <div style={styles.step}>
          <span style={styles.stepNumber}>1</span>
          <div style={styles.stepContent}>
            <label style={styles.label}>Enter Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Type your name here..."
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.step}>
          <span style={styles.stepNumber}>2</span>
          <div style={styles.stepContent}>
            <label style={styles.label}>Answer this to continue:</label>
            <div style={styles.gameBox}>
              <p style={styles.gameTitle}>Guess the Bible Character</p>
              {game.hints.slice(0, hintIndex + 1).map((hint, i) => (
                <p key={i} style={styles.hint}>
                  💡 Hint {i + 1}: {hint}
                </p>
              ))}
              {!solved ? (
                <>
                  <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Type your answer..."
                    style={styles.input}
                    onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                  />
                  <button onClick={handleGuess} style={styles.submitBtn}>
                    Submit
                  </button>
                </>
              ) : (
                <p style={styles.correct}>✅ Correct! You may now enter.</p>
              )}
            </div>
          </div>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button
          onClick={handleEnter}
          disabled={!solved}
          style={solved ? styles.enterBtn : styles.enterBtnDisabled}
        >
          🔒 Enter
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(to bottom, #87ceeb, #f0f4f8)',
    padding: '20px',
    fontFamily: 'sans-serif'
  },
  card: {
    background: '#fff',
    borderRadius: '16px',
    padding: '32px',
    maxWidth: '420px',
    width: '100%',
    boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
    textAlign: 'center'
  },
  icon: { fontSize: '40px', marginBottom: '8px' },
  title: { fontSize: '24px', fontWeight: 'bold', color: '#1e3a5f', margin: '8px 0' },
  subtitle: { color: '#666', fontSize: '14px', marginBottom: '24px' },
  step: { display: 'flex', gap: '12px', marginBottom: '20px', textAlign: 'left' },
  stepNumber: {
    background: '#1e3a5f',
    color: '#fff',
    borderRadius: '50%',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    flexShrink: 0
  },
  stepContent: { flex: 1 },
  label: { display: 'block', fontWeight: '600', marginBottom: '8px', color: '#333', fontSize: '14px' },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    fontSize: '14px',
    marginBottom: '8px',
    boxSizing: 'border-box'
  },
  gameBox: {
    background: '#f0f4f8',
    borderRadius: '8px',
    padding: '12px'
  },
  gameTitle: { fontWeight: '600', marginBottom: '8px', fontSize: '14px', color: '#1e3a5f' },
  hint: { fontSize: '13px', color: '#555', margin: '4px 0' },
  submitBtn: {
    background: '#1e3a5f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 20px',
    width: '100%',
    cursor: 'pointer',
    fontSize: '14px'
  },
  correct: { color: '#22c55e', fontWeight: '600', fontSize: '14px' },
  error: { color: '#ef4444', fontSize: '13px', marginBottom: '12px' },
  enterBtn: {
    background: '#1e3a5f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    width: '100%',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600'
  },
  enterBtnDisabled: {
    background: '#aaa',
    color: '#eee',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    width: '100%',
    cursor: 'not-allowed',
    fontSize: '16px',
    fontWeight: '600'
  }
};