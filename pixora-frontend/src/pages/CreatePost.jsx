import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';

const CreatePost = () => {
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
      
      // Validate file size
      const maxSize = fileType === 'video' ? 10 * 1024 * 1024 : 10 * 1024 * 1024; // 10MB for both
      if (selectedFile.size > maxSize) {
        alert(`File size must be less than ${maxSize / 1024 / 1024}MB`);
        return;
      }

      // Validate file type
      if (!selectedFile.type.startsWith('image/') && !selectedFile.type.startsWith('video/')) {
        alert('Please select an image or video file');
        return;
      }

      setFile(selectedFile);
      setMediaType(fileType);
      setPreview(URL.createObjectURL(selectedFile));
      setError(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('caption', caption);
      formData.append('media_type', mediaType);

      console.log('Uploading...', mediaType);
      await postService.createPost(formData);

      // alert('Post created successfully!');
      navigate('/');
    } catch (error) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response?.data);
      
      const errorMsg = error.response?.data?.error 
        || error.response?.data?.message 
        || error.response?.data?.detail
        || 'Failed to create post. Please try again.';
      
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-6">
        <div className="card shadow-sm">
          <div className="card-header">
            <h5 className="mb-0">Create New Post</h5>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">
                  Select Image or Video *
                </label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  disabled={loading}
                  required
                />
                <small className="text-muted">
                  Images & Videos: Max 10MB
                </small>
              </div>

              {preview && (
                <div className="mb-3">
                  {mediaType === 'video' ? (
                    <video 
                      controls 
                      className="w-100 rounded"
                      style={{ maxHeight: '400px' }}
                    >
                      <source src={preview} />
                    </video>
                  ) : (
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="img-fluid rounded" 
                      style={{ maxHeight: '400px' }}
                    />
                  )}
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Caption</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Write a caption..."
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  disabled={loading}
                  maxLength={2200}
                ></textarea>
                <small className="text-muted">
                  {caption.length}/2200 characters
                </small>
              </div>

              <div className="d-flex gap-2">
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading || !file}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-upload me-2"></i>
                      Share Post
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => navigate('/')}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;