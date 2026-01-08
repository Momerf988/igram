import React, { useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import './Auth.css';

const API_URL = 'http://localhost:5000/api';

const CreatorLogin = () => {
  const [formData, setFormData] = useState({
    name: 'Omer',
    email: '',
    password: ''
  });

  // Ensure name is always "Omer" and cannot be changed
  useEffect(() => {
    setFormData(prev => ({ ...prev, name: 'Omer' }));
  }, []);

  // Ensure name is always "Omer" and cannot be changed
  useEffect(() => {
    setFormData(prev => ({ ...prev, name: 'Omer' }));
  }, []);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/auth/login`, formData);
      
      // Check if user is creator
      if (response.data.user.role !== 'creator') {
        setError('Only creators can login here. Please use the consumer view.');
        setLoading(false);
        return;
      }

      login(response.data.token, response.data.user);
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1>igram</h1>
        <h2>Creator Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            value={formData.name}
            readOnly
            style={{ backgroundColor: '#f5f5f5', cursor: 'not-allowed' }}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="auth-link">
          <button 
            type="button" 
            onClick={() => navigate('/')}
            style={{ background: 'none', border: 'none', color: '#667eea', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Back to Consumer View
          </button>
        </p>
        <div className="demo-credentials">
          <p><strong>Demo Credentials:</strong></p>
          <p>Creator: creator@igram.com / creator123</p>
        </div>
      </div>
    </div>
  );
};

export default CreatorLogin;
