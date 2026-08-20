# WTF Fridge Project Context

## Project goal
Build a fridge-first recipe discovery app where users add the ingredients they have and find matching recipe videos. The app centers on ingredient-driven discovery, while still allowing a compact text recipe finder in the header.

## Current product concept
- App name: `WTF Fridge`
- Main experience: “What’s in the fridge?”
- User flow: select ingredients, search, view recipe videos, inspect extracted ingredients for the chosen recipe.
- Secondary feature: general text recipe search from the header corner.

## Architecture
- Frontend: React (Create React App)
- Backend: Flask API
- Search source: YouTube Data API
- Ingredient extraction: OpenAI GPT
- Audio fallback: optional Whisper transcription, only when user opts in
- Cache: simple in-memory cache keyed by YouTube video ID

## Repo structure
- `frontend/` — React app UI
- `backend/` — Flask API and AI logic
- `backend/.env` — contains API keys

## Important files
- `frontend/src/App.js` — main page layout and state
- `frontend/src/components/IngredientSearch.js` — ingredient entry and selection UI
- `frontend/src/components/SearchBar.js` — compact search box
- `frontend/src/components/VideoCard.js` — recipe result card
- `frontend/src/components/RecipeDetail.js` — selected video detail page
- `backend/app.py` — search, ingredient extraction, filtering, cache, and transcription logic

## Current behavior
- The ingredient browser allows multiple ingredients to be selected.
- A “Find recipes with these ingredients” button triggers a YouTube search using the selected ingredients.
- The header still has a compact direct search box for recipe finder use.
- Selecting a video opens a detail view with embedded YouTube content and extracted ingredients.
- Ingredient extraction avoids obviously invalid lines like recipe titles or section names.
- Audio transcription only runs when the user checks the checkbox in the detail view.
- Each video ID is cached to avoid reprocessing it.

## Environment requirements
`backend/.env` should contain:
- `OPENAI_API_KEY=...`
- `YOUTUBE_API_KEY=...`

## Run steps
### Backend
```bash
cd /Users/krishjain/recipe-app/backend
python3 app.py
```

### Frontend
```bash
cd /Users/krishjain/recipe-app/frontend
npm start
```

Open: `http://localhost:3000`

## Current code snapshot

### `frontend/src/App.js`
```javascript
import React, { useState } from 'react';
import SearchBar from './components/SearchBar';
import VideoCard from './components/VideoCard';
import RecipeDetail from './components/RecipeDetail';
import IngredientSearch from './components/IngredientSearch';

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
    const response = await fetch(`http://localhost:5000/search?q=${query}`);
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
            <div style={styles.brandIcon}>🥕</div>
            <div>
             <div style={styles.logoRow}>
  <img src="/WTF.png" alt="WTF Fridge Logo" style={styles.logo} />
  <h1 style={styles.title}>WTF Fridge</h1>
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
                    backgroundColor: isSelected ? '#e8472a' : '#fff6f3',
                    color: isSelected ? 'white' : '#333',
                    borderColor: isSelected ? '#e8472a' : '#f6d7cf',
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
    background: 'linear-gradient(180deg, #fff7f3 0%, #f9f5f0 100%)',
    color: '#333',
  },
  header: {
    backgroundColor: '#e8472a',
    padding: '28px 22px 24px',
    boxShadow: '0 4px 16px rgba(232, 71, 42, 0.2)',
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
  brandIcon: {
    width: '58px',
    height: '58px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255,255,255,0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '2rem',
  },
  title: {
    color: 'white',
    fontSize: '2.4rem',
    margin: 0,
    lineHeight: 1.2,
  },
  subtitle: {
    color: '#ffe6df',
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
    color: '#ffe6df',
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
    border: '1px solid #f2e5df',
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
    backgroundColor: '#e8472a',
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
};

export default App;
```

### `frontend/src/components/IngredientSearch.js`
```javascript
import React, { useState } from 'react';

function IngredientSearch({ onSearch, onClose, inline = false }) {
  const [input, setInput] = useState('');
  const [ingredients, setIngredients] = useState([]);
  const [strictMode, setStrictMode] = useState(false);

  const addIngredient = () => {
    if (input.trim() && !ingredients.includes(input.trim())) {
      setIngredients([...ingredients, input.trim()]);
      setInput('');
    }
  };

  const removeIngredient = (item) => {
    setIngredients(ingredients.filter(i => i !== item));
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') addIngredient();
  };

  const handleSearch = () => {
    if (ingredients.length > 0) {
      const query = strictMode
        ? `recipe using only ${ingredients.join(' and ')} no other ingredients`
        : ingredients.join(' ');
      onSearch(query);
      if (onClose) onClose();
    }
  };

  const panel = (
    <div style={inline ? styles.inlinePanel : styles.modal}>
      {onClose && <button onClick={onClose} style={styles.closeButton}>✕</button>}
      <h2 style={styles.title}>🥕 What's in your fridge?</h2>
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
            backgroundColor: strictMode ? '#e8472a' : '#ccc',
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
    border: '1px solid #f2e5df',
    boxShadow: '0 10px 28px rgba(0,0,0,0.05)',
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
    color: '#888',
  },
  title: {
    fontSize: '1.7rem',
    color: '#333',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: '#888',
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
    border: '2px solid #e8472a',
    outline: 'none',
    fontSize: '1rem',
  },
  addButton: {
    padding: '12px 20px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#e8472a',
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
    backgroundColor: '#fff0ee',
    color: '#e8472a',
    border: '1px solid #e8472a',
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
    color: '#bbb',
    fontStyle: 'italic',
    fontSize: '0.9rem',
    marginBottom: '15px',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f5f0',
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
    color: '#333',
  },
  toggleDescription: {
    margin: '4px 0 0 0',
    fontSize: '0.8rem',
    color: '#888',
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
    backgroundColor: '#e8472a',
    color: 'white',
    fontSize: '1.1rem',
    fontWeight: 'bold',
  },
};

export default IngredientSearch;
```

### `frontend/src/components/RecipeDetail.js`
```javascript
import React, { useState, useEffect } from 'react';

function RecipeDetail({ video, onBack }) {
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(true);
  const [useAudio, setUseAudio] = useState(false);

  useEffect(() => {
    const fetchIngredients = async () => {
      setLoading(true);
      const url = new URL('http://localhost:5000/ingredients');
      url.searchParams.set('id', video.id);
      if (useAudio) {
        url.searchParams.set('transcribe_audio', 'true');
      }

      const response = await fetch(url.toString());
      const data = await response.json();
      setIngredients(data.ingredients);
      setLoading(false);
    };

    fetchIngredients();
  }, [video.id, useAudio]);

  return (
    <div style={styles.container}>
      <button onClick={onBack} style={styles.backButton}>← Back to Results</button>
      <h2 style={styles.title}>{video.title}</h2>
      <p style={styles.channel}>📺 {video.channel}</p>

      <label style={styles.audioToggle}>
        <input
          type="checkbox"
          checked={useAudio}
          onChange={(e) => setUseAudio(e.target.checked)}
        />
        Use audio transcription if needed
      </label>

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
  backButton: { backgroundColor: '#e8472a', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '20px', cursor: 'pointer', fontSize: '1rem', marginBottom: '20px' },
  title: { fontSize: '1.5rem', color: '#333', marginBottom: '5px' },
  channel: { color: '#888', marginBottom: '20px' },
  audioToggle: { display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '20px', fontSize: '0.95rem', color: '#333', cursor: 'pointer' },
  content: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' },
  videoSection: { borderRadius: '12px', overflow: 'hidden' },
  iframe: { borderRadius: '12px' },
  ingredientsSection: { backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
  ingredientsTitle: { color: '#e8472a', marginTop: 0 },
  loadingText: { color: '#888', fontStyle: 'italic' },
  ingredients: { whiteSpace: 'pre-wrap', fontFamily: 'Arial', lineHeight: '1.8', color: '#333' }
};

export default RecipeDetail;
```

### `backend/app.py`
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import re
import requests
import yt_dlp
from openai import OpenAI

load_dotenv()

app = Flask(__name__)
CORS(app)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")
RESULT_CACHE = {}

MEASUREMENT_WORDS = (
    "cup", "cups", "tablespoon", "tablespoons", "tbsp", "teaspoon", "teaspoons",
    "tsp", "gram", "grams", "g", "oz", "ounce", "ounces", "lb", "lbs", "pound",
    "pounds", "pinch", "clove", "cloves", "slice", "slices", "piece", "pieces",
    "can", "cans", "bottle", "bottles", "packet", "packets", "sprig", "sprigs",
    "dash", "dashes", "ml", "l", "milliliter", "milliliters", "liter", "liters"
)

INGREDIENT_HINTS = (
    "salt", "pepper", "flour", "sugar", "oil", "butter", "milk", "egg", "eggs",
    "garlic", "onion", "tomato", "tomatoes", "chicken", "beef", "pasta", "rice",
    "beans", "cheese", "broccoli", "spinach", "mushroom", "mushrooms", "lemon",
    "avocado", "tofu", "shrimp", "salmon", "turkey", "pepperoni", "cumin", "paprika",
    "parsley", "basil", "cilantro", "oregano", "thyme", "yogurt", "cream", "bread",
    "tortilla", "tortillas", "curry", "coconut", "potato", "potatoes"
)


def sanitize_ingredients(raw_text):
    if not raw_text:
        return "No ingredients could be confidently extracted from this video."

    cleaned = raw_text.strip()
    if cleaned.upper().startswith("NO_INGREDIENTS_FOUND"):
        return "No ingredients could be confidently extracted from this video."

    lines = []
    for raw_line in cleaned.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        line = re.sub(r'^[\-\*\d\.\)\(\s]+', '', line)
        line = re.sub(r'\s+', ' ', line).strip()
        if not line:
            continue
        if line.lower().startswith("no_ingredients_found"):
            continue

        lower = line.lower()
        has_measurement = any(word in lower for word in MEASUREMENT_WORDS)
        has_digit = any(ch.isdigit() for ch in line)
        has_ingredient_hint = any(word in lower for word in INGREDIENT_HINTS)

        if not (has_measurement or has_digit or has_ingredient_hint):
            continue

        lines.append(line)

    if not lines:
        return "No ingredients could be confidently extracted from this video."

    return "\n".join(lines)


# Search for recipe videos on YouTube
@app.route("/search", methods=["GET"])
def search_recipes():
    query = request.args.get("q", "")
    url = f"https://www.googleapis.com/youtube/v3/search"
    params = {
        "part": "snippet",
        "q": f"{query} recipe",
        "type": "video",
        "maxResults": 12,
        "key": YOUTUBE_API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()
    
    videos = []
    for item in data.get("items", []):
        videos.append({
            "id": item["id"]["videoId"],
            "title": item["snippet"]["title"],
            "thumbnail": item["snippet"]["thumbnails"]["high"]["url"],
            "channel": item["snippet"]["channelTitle"],
            "description": item["snippet"]["description"]
        })
    
    return jsonify(videos)


@app.route("/ingredients", methods=["GET"])
def get_ingredients():
    video_id = request.args.get("id", "")
    transcribe_audio = request.args.get("transcribe_audio", "false").lower() in {"1", "true", "yes"}

    if not video_id:
        return jsonify({"ingredients": "No video was provided."})

    if video_id in RESULT_CACHE:
        return jsonify({"ingredients": RESULT_CACHE[video_id]})

    url = "https://www.googleapis.com/youtube/v3/videos"
    params = {
        "part": "snippet",
        "id": video_id,
        "key": YOUTUBE_API_KEY
    }
    response = requests.get(url, params=params)
    data = response.json()

    if not data.get("items"):
        return jsonify({"ingredients": "No ingredients could be confidently extracted from this video."})

    description = data["items"][0]["snippet"]["description"]

    prompt = f"""
    Look at this YouTube video description and extract any ingredients listed.
    If you find ingredients, return them as a clean numbered list with the full amount/quantity.
    Format: "1. 2 cups flour", "2. 1/2 teaspoon salt", etc.
    Include units (cups, tablespoons, grams, etc.) and amounts for each ingredient.
    If there are no ingredients in the description, just say "NO_INGREDIENTS_FOUND".
    Do NOT include recipe names, categories, or section titles unless they are actual ingredients.

    Description:
    {description}
    """

    ai_response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": prompt}]
    )

    result = sanitize_ingredients(ai_response.choices[0].message.content)

    if "No ingredients could be confidently extracted" in result and transcribe_audio:
        try:
            ydl_opts = {
                "format": "bestaudio/best",
                "outtmpl": "audio.%(ext)s",
                "postprocessors": [{
                    "key": "FFmpegExtractAudio",
                    "preferredcodec": "mp3",
                }],
                "quiet": True
            }
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                ydl.download([f"https://youtube.com/watch?v={video_id}"])

            with open("audio.mp3", "rb") as audio_file:
                transcript = client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file
                )

            prompt2 = f"""
            This is a transcript from a cooking video. Extract all ingredients mentioned with their amounts.
            Return as a clean numbered list in the format: "1. 2 cups flour", "2. 1/2 teaspoon salt", etc.
            Include quantities and units (cups, tablespoons, grams, pinch, etc.) for each ingredient.
            Be as specific as possible with measurements even if approximate.
            Do NOT include recipe names, section titles, or non-ingredient items.

            Transcript:
            {transcript.text[:4000]}
            """

            ai_response2 = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt2}]
            )
            result = sanitize_ingredients(ai_response2.choices[0].message.content)

            if os.path.exists("audio.mp3"):
                os.remove("audio.mp3")

        except Exception:
            result = "No ingredients could be confidently extracted from this video."

    RESULT_CACHE[video_id] = result
    return jsonify({"ingredients": result})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
```

## Current status and notes
- Frontend code compiles successfully.
- Backend code parses successfully.
- The app is designed around a fridge-first UX, but it still depends on YouTube recipe metadata and OpenAI extraction quality.
- Some videos will return `No ingredients could be confidently extracted from this video.` because the description/transcript is not suitable for ingredient extraction.
- The app intentionally only transcribes audio when the user opts in.
- The app intentionally caches each video result to avoid duplicate processing.

## Final handoff text for Claude
Use this project as a React + Flask app for ingredient-driven recipe discovery. The app is a fridge-first interface that lets a user select ingredients and search YouTube recipe videos. The backend fetches video metadata, extracts ingredients with OpenAI from the description, and optionally falls back to audio transcription only when the user enables it. The app also caches results by video ID to avoid reprocessing.
