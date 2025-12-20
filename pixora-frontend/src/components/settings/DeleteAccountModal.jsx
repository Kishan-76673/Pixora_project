import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

const DeleteAccountModal = ({ isOpen, onClose, username }) => {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmation: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Warning, 2: Confirmation

  const expectedConfirmation = `${username}/DeleteAccount`;

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleNextStep = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/delete-account/', {
        username: formData.username,
        password: formData.password,
        confirmation: formData.confirmation
      });

      if (response.data.deleted) {
        // Clear all user data
        logout();
        
        // Show success message and redirect
        alert('Your account has been deleted successfully');
        navigate('/login');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete account');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ username: '', password: '', confirmation: '' });
    setError('');
    setStep(1);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={styles.overlay}>
      <div className="modal-content" style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <h3 style={styles.title}>
            <i className="bi bi-exclamation-triangle-fill text-danger me-2"></i>
            Delete Account
          </h3>
          <button onClick={handleClose} style={styles.closeBtn}>
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        {/* Step 1: Warning */}
        {step === 1 && (
          <div style={styles.body}>
            <div className="alert alert-danger" role="alert">
              <h5 className="alert-heading">⚠️ Warning: This action is irreversible!</h5>
              <hr />
              <p className="mb-2"><strong>What will be deleted:</strong></p>
              <ul className="mb-3">
                <li>All your posts and stories</li>
                <li>All your comments</li>
                <li>All your likes and reactions</li>
                <li>Your profile picture and bio</li>
                <li>All your chat messages</li>
              </ul>
              <p className="mb-2"><strong>What will be kept:</strong></p>
              <ul>
                <li>Your username (reserved, cannot be reused)</li>
                <li>Your follower/following relationships</li>
              </ul>
            </div>

            <div className="d-flex gap-2 justify-content-end">
              <button 
                onClick={handleClose}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button 
                onClick={handleNextStep}
                className="btn btn-danger"
              >
                Continue to Delete
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Confirmation */}
        {step === 2 && (
          <div style={styles.body}>
            <p className="mb-3 text-muted">
              To confirm deletion, please enter your account details:
            </p>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {/* Username Input */}
            <div className="mb-3">
              <label className="form-label">Username</label>
              <input
                type="text"
                className="form-control"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder={`Enter your username: ${username}`}
                disabled={loading}
              />
            </div>

            {/* Password Input */}
            <div className="mb-3">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {/* Confirmation Input */}
            <div className="mb-3">
              <label className="form-label">
                Type <code>{expectedConfirmation}</code> to confirm
              </label>
              <input
                type="text"
                className="form-control"
                name="confirmation"
                value={formData.confirmation}
                onChange={handleInputChange}
                placeholder={expectedConfirmation}
                disabled={loading}
              />
              <small className="text-muted">
                Case sensitive. Must be exact.
              </small>
            </div>

            {/* Buttons */}
            <div className="d-flex gap-2 justify-content-end">
              <button 
                onClick={() => setStep(1)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Back
              </button>
              <button 
                onClick={handleDelete}
                className="btn btn-danger"
                disabled={
                  loading || 
                  !formData.username || 
                  !formData.password || 
                  formData.confirmation !== expectedConfirmation
                }
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <i className="bi bi-trash me-2"></i>
                    Delete My Account Permanently
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1050,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px',
    borderBottom: '1px solid #dee2e6'
  },
  title: {
    margin: 0,
    fontSize: '1.25rem',
    fontWeight: 600
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0',
    color: '#6c757d'
  },
  body: {
    padding: '20px'
  }
};

export default DeleteAccountModal;