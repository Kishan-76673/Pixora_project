import { useState, useEffect } from 'react';
import { postService } from '../services/postService';
import PostCard from '../components/posts/PostCard';
import { useAuthStore } from '../store/authStore';
import StoriesCarousel from '../components/stories/StoriesCarousel';
import StoryViewer from '../components/stories/StoryViewer';

const Home = () => {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingStory, setViewingStory] = useState(null);
  const [allStories, setAllStories] = useState([]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      const data = await postService.getPosts();
      setPosts(data);
    } catch (error) {
      console.error('Load posts error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (storyId, stories) => {
    setViewingStory(storyId);
    setAllStories(stories);
  };

  const handleDelete = (postId) => {
    setPosts(posts.filter(p => p.id !== postId));
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-6 col-md-8">
        <StoriesCarousel onStoryClick={handleStoryClick} />
        {/* <h2 className="mb-4">Welcome, {user?.username}!</h2> */}
       {posts.length === 0 ? (  
        <div className="card border-0 shadow-sm">
          <div className="card-body text-center py-5">
            <i className="bi bi-images display-1 text-muted mb-3"></i>
            <h5 className="card-title">No posts yet</h5>
            <p className="card-text text-muted">
              Start following users or create your first post!
            </p>
          </div>
        </div>) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} onDelete={handleDelete} />
          ))
        )}
      </div>

      {/* Story Viewer Modal */}
      {viewingStory && (
        <StoryViewer
          storyId={viewingStory}
          stories={allStories}
          onClose={() => setViewingStory(null)}
          onNext={() => setViewingStory(null)}
          onPrevious={() => {}}
        />
      )}
    </div>
  );
};

export default Home;