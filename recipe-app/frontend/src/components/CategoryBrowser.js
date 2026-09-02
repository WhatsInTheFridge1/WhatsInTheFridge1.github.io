import React, { useState } from 'react';

function CategoryBrowser({ categories, selected, onToggle }) {
  const [activeCategory, setActiveCategory] = useState(categories[0]?.name);

  const active = categories.find(category => category.name === activeCategory) || categories[0];

  return (
    <div>
      <div style={styles.tabRow}>
        {categories.map(category => {
          const isActive = category.name === activeCategory;
          return (
            <button
              key={category.name}
              onClick={() => setActiveCategory(category.name)}
              style={{
                ...styles.tabButton,
                backgroundColor: isActive ? '#C9622B' : '#FBF1E6',
                color: isActive ? 'white' : '#4A3F35',
              }}
            >
              {category.emoji} {category.name}
            </button>
          );
        })}
      </div>

      <div style={styles.itemList}>
        {active.items.map(item => {
          const isSelected = selected.includes(item);
          return (
            <button
              key={item}
              onClick={() => onToggle(item)}
              style={{
                ...styles.itemButton,
                backgroundColor: isSelected ? '#7A9B76' : '#FBF1E6',
                color: isSelected ? 'white' : '#4A3F35',
                borderColor: isSelected ? '#7A9B76' : '#EAD9C4',
              }}
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const styles = {
  tabRow: {
    display: 'flex',
    gap: '8px',
    overflowX: 'auto',
    paddingBottom: '12px',
    marginBottom: '14px',
    borderBottom: '1px solid #F0E2D0',
  },
  tabButton: {
    flexShrink: 0,
    padding: '8px 14px',
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  },
  itemList: {
    display: 'flex',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
    gap: '10px',
    maxHeight: '220px',
    overflowY: 'auto',
    paddingRight: '4px',
  },
  itemButton: {
    padding: '10px 14px',
    borderRadius: '25px',
    border: '2px solid',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: 'bold',
    transition: 'all 0.2s',
  },
};

export default CategoryBrowser;
