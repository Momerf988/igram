import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import './Auth.css';

const ConsumerSignup = () => {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    let value = e.target.value;
    // Only allow letters and spaces
    value = value.replace(/[^a-zA-Z\s]/g, '');
    setName(value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      // Check if name is available and register (or sign in if exists)
      const response = await api.post('/api/consumers/register', {
        name: name.trim()
      });
      
      // Save name to localStorage (works for both new and existing consumers)
      localStorage.setItem('consumerName', name.trim());
      if (response.data.consumerId) {
        localStorage.setItem('consumerId', response.data.consumerId);
      }
      
      // Redirect back to consumer view
      window.location.href = '/';
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register. Name may already be taken.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>igram</h1>
        <h2>Enter Your Name</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
          Enter a unique name to like and comment on posts
        </p>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Your name (letters only)"
            value={name}
            onChange={handleChange}
            required
            maxLength={50}
            autoFocus
          />
          <button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'Registering...' : 'Continue'}
          </button>
        </form>
        <p className="auth-link">
          <button 
            type="button" 
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Back to View Posts
          </button>
        </p>
      </div>
    </div>
  );
};

export default ConsumerSignup;
