import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';
import PostCard from '../components/PostCard';
import './ConsumerView.css';

const ConsumerView = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [consumerName, setConsumerName] = useState('');

  useEffect(() => {
    fetchPosts();
    // Check if name is stored in localStorage
    const storedName = localStorage.getItem('consumerName');
    if (storedName && storedName.trim()) {
      setConsumerName(storedName);
    }
  }, []);

  const fetchPosts = async (query = '') => {
    try {
      const url = query ? `/api/posts/public?q=${encodeURIComponent(query)}` : '/api/posts/public';
      const response = await api.get(url);
      setPosts(response.data);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleLikeToggle = async (postId) => {
    if (!consumerName.trim()) {
      return;
    }

    try {
      await api.post(`/api/likes/public/${postId}`, {
        consumerName: consumerName.trim()
      });
      fetchPosts(lastSearchQuery);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleCommentAdded = () => {
    fetchPosts(lastSearchQuery);
  };

  const handleComment = async (postId, commentText) => {
    if (!consumerName.trim()) {
      return;
    }

    try {
      await api.post('/api/comments/public', {
        postId,
        text: commentText,
        consumerName: consumerName.trim()
      });
      fetchPosts(lastSearchQuery);
    } catch (err) {
      console.error('Failed to add comment:', err);
    }
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  return (
    <div className="consumer-view">
      <header className="consumer-header">
        <h1>igram</h1>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by title, caption, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setLastSearchQuery(searchQuery);
                  fetchPosts(searchQuery);
                }
              }}
            />
          </div>
          {!consumerName && (
            <button className="interact-btn" onClick={() => navigate('/consumer-signup')}>
              Login to Interact
            </button>
          )}
          {consumerName && (
            <>
              <span className="user-info">
                {consumerName}
              </span>
              <button className="logout-btn" onClick={() => {
                localStorage.removeItem('consumerName');
                setConsumerName('');
                // Immediate redirect to prevent any UI flicker
                setTimeout(() => window.location.href = '/', 0);
              }}>
                Logout
              </button>
            </>
          )}
          {user && user.role === 'creator' ? (
            <button className="logout-btn" onClick={() => navigate('/home')}>
              Creator View
            </button>
          ) : (
            <button className="creator-login-btn" onClick={() => navigate('/creator-login')}>
              Login for Creator
            </button>
          )}
        </div>
      </header>


      {error && <div className="error-message">{error}</div>}

      <div className="posts-container">
        {posts.length === 0 ? (
          <div className="no-posts">
            {searchQuery ? 'No posts found matching your search.' : 'No posts yet.'}
          </div>
        ) : (
          posts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={{ id: consumerName, name: consumerName, role: 'consumer' }}
              onLikeToggle={handleLikeToggle}
              onCommentAdded={handleCommentAdded}
              onComment={handleComment}
              isConsumerView={true}
              consumerName={consumerName}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default ConsumerView;
