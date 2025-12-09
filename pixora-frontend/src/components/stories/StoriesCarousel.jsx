import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storyService } from '../../services/storyService';
import { useAuthStore } from '../../store/authStore';

const StoriesCarousel = ({ onStoryClick }) => {
  const { user: currentUser } = useAuthStore();
  const [stories, setStories] = useState([]);
  const [groupedStories, setGroupedStories] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      const data = await storyService.getStories();
      setStories(data);
      
      // Group stories by user
      const grouped = data.reduce((acc, story) => {
        const username = story.user.username;
        if (!acc[username]) {
          acc[username] = {
            user: story.user,
            stories: [],
            hasUnviewed: false
          };
        }
        acc[username].stories.push(story);
        if (!story.is_viewed) {
          acc[username].hasUnviewed = true;
        }
        return acc;
      }, {});
      
      setGroupedStories(grouped);
    } catch (error) {
      console.error('Load stories error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-3">Loading stories...</div>;
  }

  return (
    <div className="stories-carousel mb-4 py-3 border-bottom">
      <div className="d-flex gap-3 overflow-auto px-2" style={{ scrollbarWidth: 'none' }}>
        {/* Current User - Add Story */}
        <Link to="/stories/create" className="text-decoration-none">
          <div className="text-center">
            <div 
              className="rounded-circle border-2 p-1 position-relative"
              style={{ 
                width: '70px', 
                height: '70px',
                border: '2px solid #dbdbdb'
              }}
            >
              {currentUser?.avatar_url ? (
                <img
                  src={currentUser.avatar_url}
                  alt={currentUser.username}
                  className="rounded-circle w-100 h-100"
                  style={{ objectFit: 'cover' }}
                />
              ) : (
                <div 
                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center w-100 h-100"
                  style={{ fontSize: '1.5rem' }}
                >
                  {currentUser?.username[0].toUpperCase()}
                </div>
              )}
              <div 
                className="position-absolute bottom-0 end-0 rounded-circle bg-primary text-white d-flex align-items-center justify-content-center"
                style={{ width: '24px', height: '24px', border: '2px solid white' }}
              >
                <i className="bi bi-plus" style={{ fontSize: '1rem' }}></i>
              </div>
            </div>
            <small className="d-block mt-1 text-truncate" style={{ maxWidth: '70px', color: 'var(--bs-body-color)' }}>
              Your story
            </small>
          </div>
        </Link>

        {/* Other Users' Stories */}
        {Object.values(groupedStories).map((group) => (
          <button
            key={group.user.username}
            onClick={() => onStoryClick && onStoryClick(group.stories[0].id, group.stories)}
            className="btn p-0 text-decoration-none"
            style={{ background: 'none', border: 'none' }}
          >
            <div className="text-center">
              <div 
                className="rounded-circle p-1 position-relative"
                style={{ 
                  width: '70px', 
                  height: '70px',
                  background: group.hasUnviewed 
                    ? 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)'
                    : '#dbdbdb',
                  padding: '2px'
                }}
              >
                <div className="rounded-circle bg-white w-100 h-100 d-flex align-items-center justify-content-center p-1">
                  {group.user.avatar_url ? (
                    <img
                      src={group.user.avatar_url}
                      alt={group.user.username}
                      className="rounded-circle w-100 h-100"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center w-100 h-100"
                      style={{ fontSize: '1.5rem' }}
                    >
                      {group.user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <small className="d-block mt-1 text-truncate" style={{ maxWidth: '70px', color: 'var(--bs-body-color)' }}>
                {group.user.username}
              </small>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default StoriesCarousel;