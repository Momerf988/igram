import React, { useState } from 'react';
import axios from 'axios';
import './Modal.css';

const API_URL = 'http://localhost:5000/api';

const EditPostModal = ({ post, onClose, onPostUpdated }) => {
  const [caption, setCaption] = useState(post.caption || '');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setImageFile(file || null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('caption', caption);
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const response = await axios.put(`${API_URL}/posts/${post._id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      onPostUpdated(response.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit Post</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Media File (leave empty to keep current)</label>
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
            />
          </div>
          <div className="form-group">
            <label>Caption</label>
            <textarea
              name="caption"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows="4"
            />
          </div>
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Updating...' : 'Update Post'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPostModal;
