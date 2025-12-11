import { useState, useEffect } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';
import PostCard from '../components/posts/PostCard';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    try {
      const response = await postService.getPost(postId);
      setPost(response);
    } catch (error) {
      console.error('Load post error:', error);
      alert('Post not found');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    navigate(-1); // Go back
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border" role="status"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="alert alert-danger">Post not found</div>
    );
  }

  return (
    <div className="row justify-content-center">
      <div className="col-lg-6">
        <button 
          className="btn btn-link mb-3" 
          onClick={() => navigate(-1)}
        >
          <i className="bi bi-arrow-left me-2"></i>
          Back
        </button>
        <PostCard post={post} onDelete={handleDelete} />
      </div>
    </div>
  );
};

export default PostDetail;