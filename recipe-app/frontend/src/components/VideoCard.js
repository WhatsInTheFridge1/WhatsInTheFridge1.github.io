import React from 'react';

function VideoCard({ video, onClick }) {
  return (
    <div style={styles.card} onClick={onClick}>
      <img src={video.thumbnail} alt={video.title} style={styles.thumbnail} />
      <div style={styles.info}>
        <h3 style={styles.title}>{video.title}</h3>
        <p style={styles.channel}>📺 {video.channel}</p>
      </div>
    </div>
  );
}

const styles = {
  card: { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.2s' },
  thumbnail: { width: '100%', height: '180px', objectFit: 'cover' },
  info: { padding: '12px' },
  title: { fontSize: '0.95rem', margin: '0 0 8px 0', color: '#333', lineHeight: '1.4' },
  channel: { fontSize: '0.85rem', color: '#888', margin: 0 }
};

export default VideoCard;