import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../api';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import './Home.css';

const Home = () => {
  const { user, logout } = useContext(AuthContext);
  const [posts, setPosts] = useState([]);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = posts.filter(post => {
        const titleMatch = post.title?.toLowerCase().includes(query);
        const captionMatch = post.caption?.toLowerCase().includes(query);
        const locationMatch = post.location?.toLowerCase().includes(query);
        return titleMatch || captionMatch || locationMatch;
      });
      setFilteredPosts(filtered);
    } else {
      setFilteredPosts(posts);
    }
  }, [searchQuery, posts]);

  const fetchPosts = async () => {
    try {
      const response = await api.get('/api/posts/public');
      setPosts(response.data);
      setFilteredPosts(response.data);
    } catch (err) {
      setError('Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    console.log('Post created - received from backend:', {
      id: newPost._id,
      title: newPost.title,
      location: newPost.location,
      caption: newPost.caption,
      people: newPost.people
    });
    setPosts([newPost, ...posts]);
    setShowCreateModal(false);
  };

  const handlePostDeleted = (postId) => {
    setPosts(posts.filter(p => p._id !== postId));
  };

  const handleLikeToggle = async (postId) => {
    try {
      await api.post(`/api/likes/${postId}`);
      fetchPosts();
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleCommentAdded = () => {
    fetchPosts();
  };

  if (loading) {
    return <div className="loading">Loading posts...</div>;
  }

  return (
    <div className="home-container">
      <header className="home-header">
        <h1>igram</h1>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              className="search-input"
              placeholder="Search by title, caption, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="user-info">
            {user.name || user.username} (Creator)
          </span>
          <button
            className="create-post-btn"
            onClick={() => setShowCreateModal(true)}
          >
            + Create Post
          </button>
          <button className="logout-btn" onClick={() => {
            logout();
            window.location.href = '/';
          }}>
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="posts-container">
        {filteredPosts.length === 0 ? (
          <div className="no-posts">
            {searchQuery ? 'No posts found matching your search.' : 'No posts yet. Be the first to create one!'}
          </div>
        ) : (
          filteredPosts.map(post => (
            <PostCard
              key={post._id}
              post={post}
              currentUser={user}
              onPostDeleted={handlePostDeleted}
              onLikeToggle={handleLikeToggle}
              onCommentAdded={handleCommentAdded}
            />
          ))
        )}
      </div>

      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onPostCreated={handlePostCreated}
        />
      )}
    </div>
  );
};

export default Home;
