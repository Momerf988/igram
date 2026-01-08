import React, { useState } from 'react';
import axios from 'axios';
import './Modal.css';

const API_URL = 'http://localhost:5000/api';

const CreatePostModal = ({ onClose, onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [peopleNames, setPeopleNames] = useState([]); // Array of name strings
  const [peopleInput, setPeopleInput] = useState(''); // Current input value
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file || null);
  };

  const handlePeopleInputChange = (e) => {
    let value = e.target.value;
    
    // Remove apostrophes and any characters that aren't letters, spaces, or commas
    value = value.replace(/[^a-zA-Z\s,]/g, '');
    
    // Prevent multiple consecutive commas
    value = value.replace(/,+/g, ',');
    
    // If comma is entered, create a chip from the current input
    if (value.endsWith(',')) {
      const nameToAdd = value.slice(0, -1).trim();
      if (nameToAdd) {
        setPeopleNames([...peopleNames, nameToAdd]);
        setPeopleInput('');
        return;
      } else {
        // Just remove the comma if there's no name before it
        value = value.slice(0, -1);
      }
    }
    
    setPeopleInput(value);
  };

  const handlePeopleKeyDown = (e) => {
    // Remove chip on backspace if input is empty
    if (e.key === 'Backspace' && !peopleInput && peopleNames.length > 0) {
      setPeopleNames(peopleNames.slice(0, -1));
    }
    // Create chip on Enter
    if (e.key === 'Enter' && peopleInput.trim()) {
      e.preventDefault();
      setPeopleNames([...peopleNames, peopleInput.trim()]);
      setPeopleInput('');
    }
  };

  const removePeopleName = (index) => {
    setPeopleNames(peopleNames.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // At least caption or media must be provided
    if (!caption.trim() && !imageFile) {
      setError('Please provide either a caption or media file (or both).');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      if (imageFile) {
        formData.append('image', imageFile);
      }
      formData.append('title', title);
      formData.append('caption', caption);
      formData.append('location', location);
      // Join people names with commas
      const peopleString = peopleNames.join(', ');
      formData.append('people', peopleString);

      const response = await axios.post(`${API_URL}/posts`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onPostCreated(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Post</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Media File (image or video) - Optional</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
            <small style={{ color: '#666', fontSize: '12px' }}>
              You can create a text-only post by leaving this empty
            </small>
          </div>
          <div className="form-group">
            <label>Title</label>
            <input
              type="text"
              name="title"
              placeholder="Enter post title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Caption</label>
            <textarea
              name="caption"
              placeholder="Write a caption... (required if no media)"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows="4"
            />
          </div>
          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              name="location"
              placeholder="Enter location..."
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>People</label>
            <div className="people-input-container">
              {peopleNames.map((name, index) => (
                <span key={index} className="people-chip">
                  {name}
                  <button
                    type="button"
                    className="chip-remove"
                    onClick={() => removePeopleName(index)}
                  >
                    ×
                  </button>
                </span>
              ))}
              <input
                type="text"
                className="people-input"
                placeholder={peopleNames.length === 0 ? "Type a name and press comma or Enter..." : ""}
                value={peopleInput}
                onChange={handlePeopleInputChange}
                onKeyDown={handlePeopleKeyDown}
              />
            </div>
            <small style={{ color: '#666', fontSize: '12px' }}>
              Type a name and press comma (,) or Enter to add. Only letters and spaces allowed.
            </small>
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Creating...' : 'Create Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;
