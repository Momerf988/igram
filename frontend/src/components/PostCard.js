import React, { useState, useEffect } from 'react';
import { api, API_BASE_URL } from '../api';
import './PostCard.css';

const PostCard = ({ post, currentUser, onPostDeleted, onLikeToggle, onCommentAdded, onComment, isConsumerView = false, consumerName = '' }) => {
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (isConsumerView && consumerName) {
      // Check consumer likes
      const liked = post.consumerLikes?.some(like => 
        like.consumerName === consumerName
      ) || false;
      setIsLiked(liked);
      const userLikesCount = post.likes?.length || 0;
      const consumerLikesCount = post.consumerLikes?.length || 0;
      setLikesCount(userLikesCount + consumerLikesCount);
    } else if (currentUser && currentUser.id) {
      // Check authenticated user likes
      const liked = post.likes?.some(like => {
        const likeId = typeof like === 'object' && like._id ? like._id.toString() : like.toString();
        return likeId === currentUser.id;
      }) || false;
      setIsLiked(liked);
      const userLikesCount = post.likes?.length || 0;
      const consumerLikesCount = post.consumerLikes?.length || 0;
      setLikesCount(userLikesCount + consumerLikesCount);
    } else {
      setIsLiked(false);
      const userLikesCount = post.likes?.length || 0;
      const consumerLikesCount = post.consumerLikes?.length || 0;
      setLikesCount(userLikesCount + consumerLikesCount);
    }
  }, [post.likes, post.consumerLikes, currentUser, consumerName, isConsumerView]);

  const handleLike = async () => {
    // In consumer view, check if name is required
    if (isConsumerView && !consumerName) {
      return; // Don't allow like if no name
    }
    try {
      await onLikeToggle(post._id);
      setIsLiked(!isLiked);
      setLikesCount(isLiked ? likesCount - 1 : likesCount + 1);
    } catch (err) {
      console.error('Failed to toggle like:', err);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    // In consumer view, check if name is required
    if (isConsumerView && !consumerName) {
      return; // Don't allow comment if no name
    }

    if (isConsumerView && onComment) {
      // Consumer view - use onComment callback
      await onComment(post._id, commentText);
      setCommentText('');
    } else {
      // Authenticated user
      try {
        await api.post('/api/comments', {
          postId: post._id,
          text: commentText
        });
        setCommentText('');
        onCommentAdded();
      } catch (err) {
        console.error('Failed to add comment:', err);
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await api.delete(`/api/posts/${post._id}`);
      onPostDeleted(post._id);
    } catch (err) {
      console.error('Failed to delete post:', err);
      alert('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;

    try {
      if (isConsumerView && consumerName) {
        // Consumer view - use public delete route
        await api.delete(`/api/comments/public/${commentId}`, {
          data: { consumerName: consumerName }
        });
      } else {
        // Authenticated user
        await api.delete(`/api/comments/${commentId}`);
      }
      onCommentAdded(); // Refresh comments
    } catch (err) {
      console.error('Failed to delete comment:', err);
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  const isCreator = currentUser?.role === 'creator';

  // Debug: log post data to see what we're receiving
  useEffect(() => {
    console.log('Post data:', {
      id: post._id,
      title: post.title,
      location: post.location,
      caption: post.caption,
      people: post.people
    });
  }, [post]);

  const authorName = post.creator?.name || post.creator?.username || post.user?.name || post.user?.username || 'Unknown';

  const mediaUrl = post.imageUrl
    ? (post.imageUrl.startsWith('http')
        ? post.imageUrl
        : `${API_BASE_URL}${post.imageUrl}`)
    : null;

  const isVideo =
    post.mediaType === 'video' ||
    (post.imageUrl &&
      /\.(mp4|webm|ogg)$/i.test(post.imageUrl));

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="post-creator">
          <strong>{authorName}{isCreator ? ' (Creator)' : ''}</strong>
        </div>
        {isCreator && (
          <div className="post-actions">
            <button className="delete-btn" onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}
      </div>

      {post.imageUrl && (
        isVideo ? (
          <video
            className="post-media post-video"
            src={mediaUrl}
            controls
          />
        ) : (
          <img
            src={mediaUrl}
            alt={post.caption || 'Post'}
            className="post-media post-image"
          />
        )
      )}

      <div className="post-content">
        {post.title && post.title.trim() ? (
          <div className="post-title">
            <h3>{post.title}</h3>
          </div>
        ) : null}

        <div className="post-actions-bar">
          <button
            className={`like-btn ${isLiked ? 'liked' : ''}`}
            onClick={handleLike}
            disabled={isConsumerView && !consumerName}
            title={isConsumerView && !consumerName ? 'Please login to interact' : ''}
          >
            {isLiked ? '❤️' : '🤍'} {likesCount}
          </button>
        </div>

        {post.caption && post.caption.trim() ? (
          <div className="post-caption">
            {post.caption}
          </div>
        ) : null}

        {(post.location && post.location.trim()) || (post.people && post.people.trim()) ? (
          <div className="post-metadata">
            {post.location && post.location.trim() && (
              <span className="metadata-item">📍 {post.location}</span>
            )}
            {post.people && post.people.trim() && (
              <div className="metadata-item people-display">
                <span className="people-label">👥</span>
                <div className="people-chips">
                  {post.people.split(',').map((name, index) => {
                    const trimmedName = name.trim();
                    return trimmedName ? (
                      <span key={index} className="people-chip-display">
                        {trimmedName}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}

        <div className="post-comments">
          {post.comments && post.comments.length > 0 && (
            <div className="comments-list">
              {post.comments.map(comment => {
                let commentAuthor = 'Unknown';
                if (comment.user) {
                  // Check if creator - use currentUser to check role if comment.user doesn't have it
                  const isCommentCreator = comment.user.role === 'creator' || 
                    (currentUser?.role === 'creator' && comment.user._id === currentUser.id);
                  const displayName = comment.user.name || comment.user.username;
                  // For creator comments, always show "Name (Creator)" format
                  commentAuthor = isCommentCreator ? `${displayName} (Creator)` : displayName;
                } else if (comment.consumerName) {
                  commentAuthor = comment.consumerName;
                }
                // Creator can only delete their own comments (not consumer comments)
                // Consumer can only delete their own comments
                let canDelete = false;
                if (isCreator) {
                  // Creator can only delete comments made by authenticated users (themselves)
                  canDelete = comment.user && (comment.user._id === currentUser.id || comment.user === currentUser.id);
                } else if (isConsumerView) {
                  // Consumer can only delete their own comments
                  canDelete = comment.consumerName === consumerName;
                } else {
                  // Authenticated consumer can delete their own comments
                  canDelete = comment.user && (comment.user._id === currentUser.id || comment.user === currentUser.id);
                }
                return (
                  <div key={comment._id} className="comment">
                    <div className="comment-content">
                      <strong>{commentAuthor}</strong> {comment.text}
                    </div>
                    {canDelete && (
                      <button
                        className="delete-comment-btn"
                        onClick={() => handleDeleteComment(comment._id)}
                        title="Delete comment"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <form onSubmit={handleComment} className="comment-form">
            <input
              type="text"
              placeholder={isConsumerView && !consumerName ? "Login to interact to comment..." : "Add a comment..."}
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="comment-input"
              disabled={isConsumerView && !consumerName}
            />
            <button type="submit" className="comment-btn" disabled={isConsumerView && !consumerName}>
              Post
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostCard;
