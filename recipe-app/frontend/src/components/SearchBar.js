import React, { useState } from 'react';

function SearchBar({ onSearch }) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <input
        type="text"
        placeholder="Search for a recipe... (e.g. pasta, tacos, cake)"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={styles.input}
      />
      <button type="submit" style={styles.button}>Search 🔍</button>
    </form>
  );
}

const styles = {
  form: { display: 'flex', gap: '10px', marginTop: '20px', justifyContent: 'center', flexWrap: 'wrap' },
  input: { padding: '12px 20px', fontSize: '1rem', borderRadius: '25px', border: 'none', width: '100%', maxWidth: '400px', minWidth: 0, flex: '1 1 200px', outline: 'none', boxSizing: 'border-box' },
  button: { padding: '12px 25px', fontSize: '1rem', borderRadius: '25px', border: 'none', backgroundColor: '#4A3F35', color: 'white', cursor: 'pointer', fontWeight: 'bold' }
};

export default SearchBar;