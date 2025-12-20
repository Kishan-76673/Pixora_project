import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../services/UserService';
import { useAuthStore } from '../store/authStore';
import DeleteAccountModal from '../components/settings/DeleteAccountModal';
const EditProfile = () => {
  const navigate = useNavigate();
  const { user: currentUser, login } = useAuthStore();
  
  const [formData, setFormData] = useState({
    full_name: '',
    bio: '',
  });
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await userService.getCurrentProfile();
      setFormData({
        full_name: profile.full_name || '',
        bio: profile.bio || '',
      });
      setAvatarPreview(profile.avatar_url);
    } catch (error) {
      console.error('Load profile error:', error);
    // Fallback to current user data from localStorage
    if (currentUser) {
      setFormData({
        full_name: currentUser.full_name || '',
        bio: currentUser.bio || '',
      });
      setAvatarPreview(currentUser.avatar_url);
    }
  } finally {
    setLoading(false);
  }
};

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Avatar size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('full_name', formData.full_name);
      formDataToSend.append('bio', formData.bio);
      
      if (avatar) {
        formDataToSend.append('avatar', avatar);
      }

      const response = await userService.updateProfile(formDataToSend);
      
      // Update user in auth store
      const updatedUser = {
        ...currentUser,
        ...response.user
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      navigate(`/profile/${currentUser.username}`);
    } catch (error) {
      console.error('Update profile error:', error);
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="row justify-content-center">
      <div className="col-lg-6">
        <div className="card shadow-sm">
           <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Edit Profile</h5>
            <button 
              className="btn btn-outline-danger btn-sm"
              onClick={() => setShowDeleteModal(true)}
            >
              <i className="bi bi-gear me-1"></i>
              Account Settings
            </button>
          </div>
          <div className="card-body">
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Avatar */}
              <div className="mb-4 text-center">
                <div className="mb-3">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="rounded-circle"
                      style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center mx-auto"
                      style={{ width: '150px', height: '150px', fontSize: '3rem' }}
                    >
                      {currentUser?.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  disabled={loading}
                  id="avatar-input"
                  style={{ display: 'none' }}
                />
                <label htmlFor="avatar-input" className="btn btn-outline-primary">
                  <i className="bi bi-camera me-2"></i>
                  Change Avatar
                </label>
                <small className="d-block text-muted mt-2">Max size: 5MB</small>
              </div>

              {/* Username (read-only) */}
              <div className="mb-3">
                <label className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  value={currentUser?.username}
                  disabled
                />
                <small className="text-muted">Username cannot be changed</small>
              </div>

              {/* Full Name */}
              <div className="mb-3">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  disabled={loading}
                  maxLength={100}
                />
              </div>

              {/* Bio */}
              <div className="mb-3">
                <label className="form-label">Bio</label>
                <textarea
                  className="form-control"
                  rows="4"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  disabled={loading}
                  maxLength={500}
                  placeholder="Tell us about yourself..."
                ></textarea>
                <small className="text-muted">{formData.bio.length}/500</small>
              </div>

              {/* Buttons */}
              <div className="d-flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-circle me-2"></i>
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate(`/profile/${currentUser.username}`)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="card shadow-sm mt-3 border-danger">
          <div className="card-header bg-danger text-white">
            <h6 className="mb-0">
              <i className="bi bi-exclamation-triangle me-2"></i>
              Danger Zone
            </h6>
          </div>
          <div className="card-body">
            <p className="text-muted mb-3">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <button 
              className="btn btn-danger"
              onClick={() => setShowDeleteModal(true)}
            >
              <i className="bi bi-trash me-2"></i>
              Delete Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        username={currentUser?.username}
      />
    </div>
  ); 
};

export default EditProfile;