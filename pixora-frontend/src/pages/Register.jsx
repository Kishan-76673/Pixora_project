import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const validateBeforeSubmit = () => {
  const emailRegex = /^[\w.-]+@[\w.-]+\.(com|in)$/;
  const usernameRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
  const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

  if (!emailRegex.test(formData.email)) return "Invalid email (must end with .com or .in)";
  if (!usernameRegex.test(formData.username)) return "Username must contain uppercase, lowercase, number, special character, and be 8+ chars";
  if (!passwordRegex.test(formData.password)) return "Password must be strong (uppercase, lowercase, number, special character, 8+ chars)";

  return null;
};

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  });
  const { register, loading, error } = useAuthStore();
  const navigate = useNavigate();

  const validateBeforeSubmit = () => {
    const emailRegex = /^[\w.-]+@[\w.-]+\.(com|in)$/;
    const usernameRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

    if (!emailRegex.test(formData.email))
      return 'Invalid email (must end with .com or .in)';
    if (!usernameRegex.test(formData.username))
      return 'Username must contain uppercase, lowercase, number, special character, and be 8+ characters long';
    if (!passwordRegex.test(formData.password))
      return 'Password must be strong (uppercase, lowercase, number, special character, 8+ chars)';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Run custom validation before API call
  const errorMsg = validateBeforeSubmit();
  if (errorMsg) {
    alert(errorMsg);
    return;
  }

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      const { confirmPassword, ...userData } = formData;
      await register(userData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      console.error('Registration error:', err);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5">
            <div className="card shadow-sm border-0">
              <div className="card-body p-5">
                <div className="text-center mb-4">
                  <h1 className="pixora-logo mb-3">Pixora</h1>
                  <p className="text-muted">
                    Sign up to see photos and videos from your friends.
                  </p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <input
                      type="email"
                      className="form-control"
                      placeholder="Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Full Name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Confirm Password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Signing up...
                      </>
                    ) : (
                      'Sign Up'
                    )}
                  </button>
                </form>

                <div className="text-center mt-4">
                  <p className="text-muted mb-0">
                    Have an account?{' '}
                    <Link to="/login" className="text-primary fw-bold text-decoration-none">
                      Log in
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;