import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import VideoCard from './components/VideoCard';
import RecipeDetail from './components/RecipeDetail';
import IngredientSearch from './components/IngredientSearch';
import logo from './WTF.png'; // <-- put WTF.png inside src/ (next to App.js) and import it like this

const INGREDIENT_OPTIONS = [
  'Chicken', 'Beef', 'Pasta', 'Rice', 'Eggs', 'Tomato', 'Garlic', 'Onion',
  'Broccoli', 'Spinach', 'Mushrooms', 'Lemon', 'Potato', 'Cheese', 'Beans',
  'Avocado', 'Salmon', 'Shrimp', 'Tofu', 'Peppers', 'Coconut', 'Curry', 'Tortillas'
];

function App() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState([]);

  const toggleIngredient = (ingredient) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(item => item !== ingredient)
        : [...prev, ingredient]
    );
  };

  const searchRecipes = async (query) => {
    setLoading(true);
    setSelectedVideo(null);
    const response = await fetch(`https://whatsinthefridge2-github-io.onrender.com/search?q=${query}`);
    const data = await response.json();
    setVideos(data);
    setLoading(false);
  };

  const searchSelectedIngredients = async () => {
    if (selectedIngredients.length === 0) return;
    const query = selectedIngredients.join(' ');
    await searchRecipes(query);
  };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerTop}>
          <div style={styles.brandWrap}>
            <div>
              <div style={styles.logoRow}>
                <img src={logo} alt="What's In The Fridge? Logo" style={styles.logo} />
                <h1 style={styles.title}>What's In The Fridge?</h1>
              </div>
              <p style={styles.subtitle}>Turn the ingredients you have into a recipe idea.</p>
            </div>
          </div>

          <div style={styles.cornerCard}>
            <span style={styles.cornerLabel}>Recipe Finder</span>
            <SearchBar onSearch={searchRecipes} />
          </div>
        </div>
      </header>

      <main style={styles.mainContent}>
        <div style={styles.primaryPanel}>
          <IngredientSearch onSearch={searchRecipes} inline />
        </div>

        <aside style={styles.sidePanel}>
          <h2 style={styles.exploreTitle}>Browse ingredients</h2>
          <div style={styles.tagGrid}>
            {INGREDIENT_OPTIONS.map(ingredient => {
              const isSelected = selectedIngredients.includes(ingredient);
              return (
                <button
                  key={ingredient}
                  onClick={() => toggleIngredient(ingredient)}
                  style={{
                    ...styles.tagButton,
                    backgroundColor: isSelected ? '#111111' : '#f5f5f5',
                    color: isSelected ? 'white' : '#333',
                    borderColor: isSelected ? '#111111' : '#dddddd',
                  }}
                >
                  {ingredient}
                </button>
              );
            })}
          </div>

          <button
            onClick={searchSelectedIngredients}
            style={{
              ...styles.searchButton,
              opacity: selectedIngredients.length === 0 ? 0.5 : 1,
              cursor: selectedIngredients.length === 0 ? 'not-allowed' : 'pointer',
            }}
            disabled={selectedIngredients.length === 0}
          >
            Find recipes with these ingredients
          </button>
        </aside>
      </main>

      {selectedVideo ? (
        <RecipeDetail video={selectedVideo} onBack={() => setSelectedVideo(null)} />
      ) : (
        <main style={styles.resultsSection}>
          {loading && <p style={styles.loading}>Finding recipes...</p>}
          <div style={styles.grid}>
            {videos.map(video => (
              <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} />
            ))}
          </div>
          {!loading && videos.length === 0 && (
            <div style={styles.empty}>
              <p>Add ingredients above to get recipe ideas.</p>
              <p>Or choose a few ingredients from the list to search faster.</p>
            </div>
          )}
        </main>
      )}
    </div>
  );
}

const styles = {
  app: {
    fontFamily: 'Arial, sans-serif',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #f7f7f7 0%, #ececec 100%)',
    color: '#333',
  },
  header: {
    backgroundColor: '#111111',
    padding: '28px 22px 24px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.2)',
  },
  headerTop: {
    maxWidth: '1280px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '20px',
    flexWrap: 'wrap',
  },
  brandWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap',
  },
  title: {
    color: 'white',
    fontSize: '2.4rem',
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    color: '#dddddd',
    margin: '8px 0 0',
    fontSize: '1.05rem',
  },
  cornerCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: '16px',
    padding: '12px 16px',
    minWidth: '280px',
    backdropFilter: 'blur(6px)',
  },
  cornerLabel: {
    display: 'block',
    color: '#dddddd',
    fontWeight: 'bold',
    fontSize: '0.75rem',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginBottom: '8px',
  },
  mainContent: {
    maxWidth: '1280px',
    margin: '28px auto 0',
    padding: '0 20px',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 2.2fr) minmax(220px, 0.8fr)',
    gap: '24px',
    alignItems: 'start',
  },
  primaryPanel: {
    minWidth: 0,
  },
  sidePanel: {
    backgroundColor: 'white',
    borderRadius: '18px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.05)',
    padding: '20px',
    border: '1px solid #e0e0e0',
  },
  exploreTitle: {
    fontSize: '1.2rem',
    margin: '0 0 18px',
    color: '#333',
  },
  tagGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
    marginBottom: '20px',
  },
  tagButton: {
    padding: '10px 14px',
    borderRadius: '25px',
    border: '2px solid',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
  searchButton: {
    width: '100%',
    padding: '14px',
    borderRadius: '25px',
    border: 'none',
    backgroundColor: '#111111',
    color: 'white',
    fontSize: '0.95rem',
    fontWeight: 'bold',
  },
  resultsSection: {
    maxWidth: '1280px',
    margin: '28px auto',
    padding: '0 20px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '20px',
    marginTop: '20px',
  },
  loading: {
    textAlign: 'center',
    fontSize: '1.2rem',
    color: '#666',
    marginTop: '40px',
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: '60px',
    fontSize: '1.1rem',
    lineHeight: '1.8',
  },
  logoRow: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px' },
  logo: { height: '70px', width: 'auto', objectFit: 'contain' },
};

export default App;