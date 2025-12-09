import { useState, useEffect, useRef } from 'react';
import { storyService } from '../../services/storyService';

const StoryViewer = ({ storyId, stories, onClose, onNext, onPrevious }) => {
  const [currentIndex, setCurrentIndex] = useState(
    stories.findIndex(s => s.id === storyId)
  );
  const [progress, setProgress] = useState(0);
  const videoRef = useRef(null);
  const progressInterval = useRef(null);

  const currentStory = stories[currentIndex];
  const duration = currentStory.media_type === 'video' ? 30000 : 5000; // 30s for video, 5s for image

  useEffect(() => {
    markAsViewed();
    startProgress();
    
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex]);

  const markAsViewed = async () => {
    try {
      await storyService.markStoryViewed(currentStory.id);
    } catch (error) {
      console.error('Mark viewed error:', error);
    }
  };

  const startProgress = () => {
    setProgress(0);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    const increment = 100 / (duration / 100);
    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + increment;
      });
    }, 100);
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      onNext && onNext();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else {
      onPrevious && onPrevious();
    }
  };

  return (
    <div 
      className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 9999 }}
    >
      {/* Progress bars */}
      <div className="position-absolute top-0 start-0 w-100 p-2 d-flex gap-1">
        {stories.map((_, idx) => (
          <div key={idx} className="flex-grow-1 bg-secondary" style={{ height: '2px' }}>
            <div 
              className="bg-white h-100"
              style={{ 
                width: idx < currentIndex ? '100%' : (idx === currentIndex ? `${progress}%` : '0%'),
                transition: 'width 0.1s linear'
              }}
            ></div>
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="position-absolute top-0 start-0 w-100 p-3 d-flex align-items-center justify-content-between text-white">
        <div className="d-flex align-items-center gap-2">
          {currentStory.user.avatar_url ? (
            <img
              src={currentStory.user.avatar_url}
              alt={currentStory.user.username}
              className="rounded-circle"
              style={{ width: '32px', height: '32px', objectFit: 'cover' }}
            />
          ) : (
            <div 
              className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
              style={{ width: '32px', height: '32px', fontSize: '1rem' }}
            >
              {currentStory.user.username[0].toUpperCase()}
            </div>
          )}
          <span className="fw-bold">{currentStory.user.username}</span>
          <small className="text-white-50">
            {new Date(currentStory.created_at).toLocaleTimeString()}
          </small>
        </div>
        <button 
          className="btn btn-link text-white p-0"
          onClick={onClose}
        >
          <i className="bi bi-x-lg fs-4"></i>
        </button>
      </div>

      {/* Story Content */}
      <div className="position-relative" style={{ maxWidth: '500px', maxHeight: '90vh' }}>
        {currentStory.media_type === 'video' ? (
          <video
            ref={videoRef}
            src={currentStory.media_url}
            className="w-100 h-100"
            style={{ objectFit: 'contain', maxHeight: '90vh' }}
            autoPlay
            onEnded={handleNext}
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="w-100 h-100"
            style={{ objectFit: 'contain', maxHeight: '90vh' }}
          />
        )}

        {/* Navigation areas */}
        <div 
          className="position-absolute top-0 start-0 h-100"
          style={{ width: '33%', cursor: 'pointer' }}
          onClick={handlePrevious}
        ></div>
        <div 
          className="position-absolute top-0 end-0 h-100"
          style={{ width: '33%', cursor: 'pointer' }}
          onClick={handleNext}
        ></div>
      </div>
    </div>
  );
};

export default StoryViewer;

