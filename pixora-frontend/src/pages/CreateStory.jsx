import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { storyService } from '../services/storyService';

const CreateStory = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [mediaType, setMediaType] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const fileType = selectedFile.type.startsWith('video/') ? 'video' : 'image';
      
      // Validate size
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (selectedFile.size > maxSize) {
        alert('File size must be less than 10MB');
        return;
      }

      setFile(selectedFile);
      setMediaType(fileType);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('media', file);
      formData.append('media_type', mediaType);

      await storyService.createStory(formData);
      alert('Story uploaded!');
      navigate('/');
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload story');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center">
      <div className="card" style={{ maxWidth: '500px', width: '100%' }}>
        <div className="card-header">
          <h5 className="mb-0">Create Story</h5>
        </div>
        <div className="card-body">
          {!preview ? (
            <div className="text-center py-5">
              <i className="bi bi-plus-circle display-1 text-muted mb-3"></i>
              <p>Select an image or video</p>
              <input
                type="file"
                className="form-control"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
            </div>
          ) : (
            <>
              {mediaType === 'video' ? (
                <video src={preview} controls className="w-100 mb-3" />
              ) : (
                <img src={preview} alt="Preview" className="w-100 mb-3" />
              )}
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-primary flex-grow-1"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? 'Uploading...' : 'Share to Story'}
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => navigate('/')}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateStory;

