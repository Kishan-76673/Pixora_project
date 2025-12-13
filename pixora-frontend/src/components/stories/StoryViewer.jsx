import { useState, useEffect, useRef, useCallback } from 'react';
import { storyService } from '../../services/storyService';

const StoryViewer = ({ storyId, stories, onClose, onNext, onPrevious }) => {
  const [currentIndex, setCurrentIndex] = useState(
    stories.findIndex(s => s.id === storyId)
  );
  const [progress, setProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(30000);
  const videoRef = useRef(null);
  const progressInterval = useRef(null);

  const currentStory = stories[currentIndex];
  const duration = currentStory?.media_type === 'video' ? 30000 : 5000;

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onNext && onNext();
    }
  }, [currentIndex, stories.length, onNext]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    } else {
      onPrevious && onPrevious();
    }
  }, [currentIndex, onPrevious]);


  const markAsViewed = useCallback(async () => {
    try {
      if (currentStory?.id) {
        await storyService.markStoryViewed(currentStory.id);
      }
    } catch (error) {
      console.error('Mark viewed error:', error);
    }
  }, [currentStory]);

  const startProgress = useCallback(() => {
    setProgress(0);
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Calculate increment based on actual video duration (max 30 seconds)
    const actualDuration = Math.min(videoDuration, 30000); // Max 30 seconds
    const totalSteps = actualDuration / 100; // Update every 100ms
    const increment = 100 / totalSteps;

    progressInterval.current = setInterval(() => {
      setProgress(prev => {
        const nextProgress = prev + increment;
        if (nextProgress >= 100) {
          return 100; // Stop at 100, handle completion in useEffect
        }
        return nextProgress;
      });
    }, 100);
  }, [videoDuration]);
  // Get video duration when video loads
  const handleVideoLoaded = useCallback(() => {
    if (videoRef.current && currentStory?.media_type === 'video') {
      const duration = videoRef.current.duration * 1000; // Convert to milliseconds
      setVideoDuration(duration);
    } else {
      setVideoDuration(30000); // Default for images
    }
  }, [currentStory]);


  // Handle initial setup
  useEffect(() => {
    if (currentStory) {
      markAsViewed();
      startProgress();
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentIndex, markAsViewed, startProgress, currentStory]);


  // Handle when progress reaches 100%
  useEffect(() => {
    if (progress >= 100) {
      // Clear interval first
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
      // Use setTimeout to defer the state update to next render cycle
      const timer = setTimeout(() => {
        handleNext();
      }, 100); // Small delay to ensure clean transition

      return () => clearTimeout(timer);
    }
  }, [progress, handleNext]);

  // Handle video end
  useEffect(() => {
    if (videoRef.current && currentStory?.media_type === 'video') {
      const handleVideoEnd = () => {
        handleNext();
      };

      videoRef.current.addEventListener('ended', handleVideoEnd);

      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('ended', handleVideoEnd);
        }
      };
    }
  }, [currentStory, handleNext]);

  if (!currentStory) {
    return null; // Or a loading state
  }
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
            playsInline
            onLoadedMetadata={handleVideoLoaded}
            onEnded={handleNext}
          />
        ) : (
          <img
            src={currentStory.media_url}
            alt="Story"
            className="w-100 h-100"
            style={{ objectFit: 'contain', maxHeight: '90vh' }}
            onLoad={handleVideoLoaded}
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

