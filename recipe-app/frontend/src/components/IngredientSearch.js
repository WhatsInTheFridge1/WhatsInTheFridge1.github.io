import React, { useState } from 'react';

function IngredientSearch({ ingredients, onAdd, onRemove, onSearch, onClose, inline = false }) {
  const [input, setInput] = useState('');
  const [strictMode, setStrictMode] = useState(false);

  const addIngredient = () => {
    const trimmed = input.trim();
    if (trimmed && !ingredients.includes(trimmed)) {
      onAdd(trimmed);
      setInput('');
    }
  };

  const removeIngredient = (item) => {
    onRemove(item);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addIngredient();
  };

  const handleSearch = () => {
    if (ingredients.length > 0) {
      onSearch(ingredients.join(' '), strictMode);
      if (onClose) onClose();
    }
  };

  const panel = (
    <div style={inline ? styles.inlinePanel : styles.modal}>
      {onClose && <button onClick={onClose} style={styles.closeButton}>✕</button>}
      <h2 style={styles.title}>What's in your fridge?</h2>
      <p style={styles.subtitle}>Add ingredients you have and we'll suggest recipes you can make.</p>

      <div style={styles.inputRow}>
        <input
          type="text"
          placeholder="Type an ingredient (e.g. chicken, garlic...)"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          style={styles.input}
        />
        <button onClick={addIngredient} style={styles.addButton}>Add</button>
      </div>

      <div style={styles.tagContainer}>
        {ingredients.map(item => (
          <div key={item} style={styles.tag}>
            {item}
            <span onClick={() => removeIngredient(item)} style={styles.removeTag}>✕</span>
          </div>
        ))}
      </div>

      {ingredients.length === 0 && (
        <p style={styles.hint}>Try adding chicken, pasta, garlic, tomatoes...</p>
      )}

      <div style={styles.toggleRow}>
        <div style={styles.toggleInfo}>
          <p style={styles.toggleLabel}>
            {strictMode ? '🎯 Strict Mode — Only my ingredients' : '🔓 Loose Mode — Contains my ingredients'}
          </p>
          <p style={styles.toggleDescription}>
            {strictMode
              ? 'Shows recipes that mostly use what you have.'
              : 'Shows recipes that include your ingredients.'}
          </p>
        </div>
        <div
          onClick={() => setStrictMode(!strictMode)}
          style={{
            ...styles.toggle,
            backgroundColor: strictMode ? '#C9622B' : '#E8D5BC',
          }}
        >
          <div style={{
            ...styles.toggleKnob,
            transform: strictMode ? 'translateX(24px)' : 'translateX(2px)',
          }} />
        </div>
      </div>

      <button
        onClick={handleSearch}
        style={{
          ...styles.searchButton,
          opacity: ingredients.length === 0 ? 0.5 : 1,
          cursor: ingredients.length === 0 ? 'not-allowed' : 'pointer',
        }}
        disabled={ingredients.length === 0}
      >
        Find Recipes 🔍
      </button>
    </div>
  );

  if (inline) {
    return panel;
  }

  return (
    <div style={styles.overlay}>
      {panel}
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
    backgroundColor: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  inlinePanel: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '28px',
    border: '1px solid #EAD9C4',
    boxShadow: '0 10px 28px rgba(74,63,53,0.06)',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '16px',
    padding: '30px',
    width: '90%',
    maxWidth: '500px',
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    fontSize: '1.2rem',
    cursor: 'pointer',
    color: '#8A7A6D',
  },
  title: {
    fontSize: '1.7rem',
    color: '#4A3F35',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: '#8A7A6D',
    marginBottom: '20px',
    fontSize: '0.95rem',
  },
  inputRow: {
    display: 'flex',
    gap: '10px',
    marginBottom: '15px',
    flexWrap: 'wrap',
  },
  input: {
    flex: 1,
    minWidth: '180px',
    padding: '12px 15px',
    borderRadius: '20px',
    border: '2px solid #C9622B',
    outline: 'none',
    fontSize: '1rem',
  },
  addButton: {
    padding: '12px 20px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#C9622B',
    color: 'white',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
  },
  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '15px',
    minHeight: '40px',
  },
  tag: {
    backgroundColor: '#EEF3ED',
    color: '#4A3F35',
    border: '1px solid #7A9B76',
    borderRadius: '20px',
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.9rem',
  },
  removeTag: {
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '0.8rem',
  },
  hint: {
    color: '#B5A28E',
    fontStyle: 'italic',
    fontSize: '0.9rem',
    marginBottom: '15px',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FBF1E6',
    borderRadius: '12px',
    padding: '12px 16px',
    marginBottom: '20px',
    gap: '12px',
  },
  toggleInfo: {
    flex: 1,
  },
  toggleLabel: {
    margin: 0,
    fontWeight: 'bold',
    fontSize: '0.95rem',
    color: '#4A3F35',
  },
  toggleDescription: {
    margin: '4px 0 0 0',
    fontSize: '0.8rem',
    color: '#8A7A6D',
  },
  toggle: {
    width: '50px',
    height: '26px',
    borderRadius: '13px',
    cursor: 'pointer',
    position: 'relative',
    transition: 'background-color 0.3s',
    flexShrink: 0,
  },
  toggleKnob: {
    position: 'absolute',
    top: '3px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: 'white',
    transition: 'transform 0.3s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
  },
  searchButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '25px',
    border: 'none',
    backgroundColor: '#C9622B',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: 'bold',
  },
};

export default IngredientSearch;