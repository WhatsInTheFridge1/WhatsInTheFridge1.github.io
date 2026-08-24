import React, { useState, useEffect } from 'react';

function RecipeDetail({ video, onBack }) {
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(true);

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
          ) : (
            <pre style={styles.ingredients}>{ingredients}</pre>
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
  ingredients: { whiteSpace: 'pre-wrap', fontFamily: 'Arial', lineHeight: '1.8', color: '#333' }
};

export default RecipeDetail;