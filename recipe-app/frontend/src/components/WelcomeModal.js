import React, { useState } from 'react';

function WelcomeModal({ onClose }) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleClose = () => {
    if (dontShowAgain) {
      try {
        localStorage.setItem('wtf_hide_welcome', 'true');
      } catch (e) {
        // localStorage unavailable (private browsing, etc.) - just close for now
      }
    }
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h2 style={styles.title}>👋 Welcome to What's In The Fridge!</h2>
        <p style={styles.intro}>Here's a quick rundown of how it works:</p>

        <ul style={styles.steps}>
          <li>
            <strong>Tell us what you have.</strong> Type ingredients into
            "What's in your fridge?" or tap them from the category list.
          </li>
          <li>
            <strong>Find recipes.</strong> Hit "Find Recipes" and we'll look
            for real cooking videos that actually use what you listed.
          </li>
          <li>
            <strong>Fine-tune with Strict Mode.</strong> Turn it on for
            recipes that use most of what you have without a lot of extras.
          </li>
          <li>
            <strong>Check off what you've got.</strong> Open any recipe and
            its ingredient list becomes a checklist — anything already in
            your fridge gets checked off automatically.
          </li>
        </ul>

        <label style={styles.checkboxRow}>
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            style={styles.checkbox}
          />
          Don't show this again
        </label>

        <button onClick={handleClose} style={styles.closeButton}>
          Got it, let's cook! 🍳
        </button>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(74,63,53,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2000,
    padding: '20px',
  },
  card: {
    backgroundColor: '#FFF8F0',
    borderRadius: '20px',
    padding: '32px',
    maxWidth: '480px',
    width: '100%',
    boxSizing: 'border-box',
    boxShadow: '0 20px 50px rgba(74,63,53,0.3)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  title: {
    fontSize: '1.5rem',
    color: '#C9622B',
    margin: '0 0 8px',
  },
  intro: {
    color: '#6B5D4F',
    margin: '0 0 16px',
  },
  steps: {
    margin: '0 0 20px',
    paddingLeft: '20px',
    color: '#4A3F35',
    lineHeight: '1.7',
  },
  checkboxRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#6B5D4F',
    fontSize: '0.9rem',
    marginBottom: '20px',
    cursor: 'pointer',
  },
  checkbox: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    accentColor: '#7A9B76',
  },
  closeButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '25px',
    border: 'none',
    backgroundColor: '#C9622B',
    color: 'white',
    fontSize: '1.05rem',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
};

export default WelcomeModal;
