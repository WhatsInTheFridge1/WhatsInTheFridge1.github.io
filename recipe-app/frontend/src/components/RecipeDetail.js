import React, { useState, useEffect } from 'react';

const GENERIC_SPICE_TERMS = ['spice', 'spices', 'seasoning', 'seasonings', 'herb', 'herbs'];

const SPICE_KEYWORDS = [
  'salt', 'pepper', 'cumin', 'paprika', 'turmeric', 'cinnamon', 'nutmeg', 'clove',
  'allspice', 'cardamom', 'coriander', 'chili powder', 'chilli powder', 'chili flakes',
  'red pepper flakes', 'cayenne', 'garlic powder', 'onion powder', 'basil', 'oregano',
  'thyme', 'rosemary', 'parsley', 'cilantro', 'dill', 'bay leaf', 'bay leaves', 'sage',
  'curry powder', 'curry', 'ginger', 'vanilla extract', 'seasoning', 'spice blend',
  'italian seasoning', 'taco seasoning', 'five spice', 'garam masala', 'saffron', 'mustard seed',
];

function RecipeDetail({ video, onBack, fridgeIngredients = [] }) {
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(true);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    const fetchIngredients = async () => {
      setLoading(true);
      const url = new URL('https://whatsinthefridge2-github-io.onrender.com/ingredients');
      url.searchParams.set('id', video.id);

      const response = await fetch(url.toString());
      const data = await response.json();
      setIngredients(data.ingredients);
      setLoading(false);
    };

    fetchIngredients();
  }, [video.id]);

  const ingredientLines = ingredients
    ? ingredients.split('\n').map(line => line.trim()).filter(Boolean)
    : [];

  useEffect(() => {
    if (ingredientLines.length === 0) return;
    const initialChecked = {};
    const hasGenericSpices = fridgeIngredients.some(item =>
      GENERIC_SPICE_TERMS.includes(item.trim().toLowerCase())
    );
    ingredientLines.forEach((line, index) => {
      const lower = line.toLowerCase();
      const directMatch = fridgeIngredients.some(item => lower.includes(item.toLowerCase()));
      const spiceMatch = hasGenericSpices && SPICE_KEYWORDS.some(keyword => lower.includes(keyword));
      initialChecked[index] = directMatch || spiceMatch;
    });
    setChecked(initialChecked);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredients]);

  const toggleChecked = (index) => {
    setChecked(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const needCount = ingredientLines.filter((_, index) => !checked[index]).length;

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>← Back to Results</button>
      <h2 style={styles.title}>{video.title}</h2>
      <p style={styles.channel}>📺 {video.channel}</p>

      <div style={styles.content}>
        <div style={styles.videoSection}>
          <iframe
            width="100%"
            height="400"
            src={`https://www.youtube.com/embed/${video.id}`}
            title={video.title}
            frameBorder="0"
            allowFullScreen
            style={styles.iframe}
          />
        </div>

        <div style={styles.ingredientsSection}>
          <h3 style={styles.ingredientsTitle}>🛒 Ingredients</h3>
          {loading ? (
            <p style={styles.loadingText}>🤖 Extracting ingredients...</p>
          ) : ingredientLines.length === 0 ? (
            <pre style={styles.ingredients}>{ingredients}</pre>
          ) : (
            <>
              <p style={styles.needSummary}>
                {needCount === 0
                  ? "You've got everything!"
                  : `Check off what you already have — ${needCount} ${needCount === 1 ? 'item' : 'items'} still needed.`}
              </p>
              <ul style={styles.checklist}>
                {ingredientLines.map((line, index) => (
                  <li key={index} style={styles.checklistItem}>
                    <label style={styles.checklistLabel}>
                      <input
                        type="checkbox"
                        checked={!!checked[index]}
                        onChange={() => toggleChecked(index)}
                        style={styles.checkbox}
                      />
                      <span style={checked[index] ? styles.haveText : styles.needText}>
                        {line}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { maxWidth: '1200px', margin: '0 auto', padding: '20px' },
  backButton: { backgroundColor: '#111111', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontSize: '1rem', marginBottom: '20px' },
  title: { fontSize: '1.5rem', color: '#333', marginBottom: '5px' },
  channel: { color: '#888', marginBottom: '20px' },
  content: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
  videoSection: { borderRadius: '12px', overflow: 'hidden' },
  iframe: { borderRadius: '12px' },
  ingredientsSection: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  ingredientsTitle: { color: '#111111', marginTop: 0 },
  loadingText: { color: '#888', fontStyle: 'italic' },
  ingredients: { whiteSpace: 'pre-wrap', fontFamily: 'Arial', lineHeight: '1.8', color: '#333' },
  needSummary: { color: '#666', fontSize: '0.9rem', marginTop: 0, marginBottom: '14px' },
  checklist: { listStyle: 'none', margin: 0, padding: 0 },
  checklistItem: { borderBottom: '1px solid #f0f0f0', padding: '10px 0' },
  checklistLabel: { display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' },
  checkbox: { marginTop: '3px', width: '17px', height: '17px', cursor: 'pointer', flexShrink: 0 },
  needText: { color: '#333', fontWeight: 'bold' },
  haveText: { color: '#aaa', textDecoration: 'line-through' },
};

export default RecipeDetail;