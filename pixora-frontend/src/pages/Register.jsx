import { useState, useEffect } from "react";
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

const Register = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    confirmPassword: '',
  });
  // const { register, loading, error } = useAuthStore();
  const { register } = useAuthStore();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [timer, setTimer] = useState(300); // 5 minutes in seconds
  const [canResend, setCanResend] = useState(false);
  const [isOtpExpired, setIsOtpExpired] = useState(false);


  // Timer countdown
  useEffect(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            setIsOtpExpired(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };

  }, [step, timer]);

  // Reset timer when step changes
  useEffect(() => {
    if (step === 2) {
      setTimer(300);
      setCanResend(false);
      setIsOtpExpired(false);
      setOtp(['', '', '', '', '', '']);
    }
  }, [step]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value[0];
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      if (prevInput) {
        prevInput.focus();
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
  };

  const handleCollectUserData = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // 1. Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match!');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    // 2. Run your custom validation
    const errorMsg = validateBeforeSubmit();
    if (errorMsg) {
      setError(errorMsg);
      return;
    }

    // setLoading(true);
    // try {
    //   // Check username availability by trying to register first
    //   const checkData = {
    //     email: formData.email,
    //     username: formData.username,
    //     full_name: formData.full_name || '',
    //     password: formData.password,
    //     confirmPassword: formData.password
    //   };

    //   console.log('Checking username availability...');

    //   // Check if email is available
    //   // await authService.checkEmailAvailability(formData.email);

    //   // Check if username is available
    //   // await authService.checkUsernameAvailability(formData.username);

    //   await authService.sendOTP(formData.email);
    //   setSuccess('Verification code sent to your email!');
    //   setStep(2);
    //   setTimer(300);
    //   setCanResend(false);
    //   setIsOtpExpired(false); 

    // } catch (err) {
    //   console.error('Send OTP error:', err.response?.data);
    //   const errorData = err.response?.data;

    //   // Handle different error cases
    //   if (errorData?.email) {
    //     const emailError = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
    //     if (emailError.includes('already exists') || emailError.includes('taken')) {
    //       setError('Email already registered. Please use a different email or login.');
    //     } else {
    //       setError(`Email: ${emailError}`);
    //     }
    //   }
    //   else if (errorData?.username) {
    //     const usernameError = Array.isArray(errorData.username) ? errorData.username[0] : errorData.username;
    //     if (usernameError.includes('already exists') || usernameError.includes('taken')) {
    //       setError('Username already taken. Please choose a different username.');
    //     } else {
    //       setError(`Username: ${usernameError}`);
    //     }
    //   }
    //   else if (errorData?.error) {
    //     setError(errorData.error);
    //   }
    //   else {
    //     setError('Failed to send verification code.');
    //   }
    // } finally {
    //   setLoading(false);
    // }
    setLoading(true);
    try {
      await authService.sendOTP(formData.email);
      setSuccess('Verification code sent to your email!');
      setStep(2);
      setTimer(300);
      setCanResend(false);
      setIsOtpExpired(false);

    } catch (err) {
      console.error('Send OTP error:', err);
      const errorData = err.response?.data;

      // Handle different error cases
      if (errorData?.email) {
        const emailError = Array.isArray(errorData.email) ? errorData.email.join(', ') : errorData.email;
        if (emailError.toLowerCase().includes('already exists') ||
          emailError.toLowerCase().includes('taken') ||
          emailError.toLowerCase().includes('already registered')) {
          setError('Email already registered. Please use a different email or login.');
        } else {
          setError(`Email: ${emailError}`);
        }
      }
      else if (errorData?.username) {
        const usernameError = Array.isArray(errorData.username) ? errorData.username.join(', ') : errorData.username;
        if (usernameError.toLowerCase().includes('already exists') ||
          usernameError.toLowerCase().includes('taken')) {
          setError('Username already taken. Please choose a different username.');
        } else {
          setError(`Username: ${usernameError}`);
        }
      }
      else if (errorData?.error) {
        setError(errorData.error);
      }
      else {
        setError('Failed to send verification code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };


  // Combined handler for OTP verification + Registration
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter complete 6-digit OTP');
      return;
    }

    if (isOtpExpired) {
      setError('OTP has expired. Please request a new one.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // console.log('Verifying OTP for:', formData.email);

      // 1. Verify OTP first
      const verifyResponse = await authService.verifyOTP(formData.email, otpCode);
      // console.log('OTP verified:', verifyResponse);

      // 2. Register user
      // const { confirmPassword, ...userData } = formData;
      // console.log('Registering user:', userData);

      // const registerResponse = await authService.register(registrationData);
      // console.log('Registration successful:', registerResponse);

      const { confirmPassword, ...userData } = formData;
      // Add confirmPassword back for the registration
      const registrationData = {
        ...userData,
        confirmPassword: formData.password
      };
      // console.log('Registering user:', registrationData);

      const registerResponse = await authService.register(registrationData);
      // console.log('Registration successful:', registerResponse);


      // 3. Auto-login after registration
      const { access, refresh, user } = registerResponse;

      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);
      localStorage.setItem('user', JSON.stringify(user));

      setSuccess('Account created! Logging you in...');

      // 4. Redirect to feed/dashboard (change '/feed' to your actual feed route)
      setTimeout(() => {
        navigate('/');
      }, 2000);

    } catch (err) {
      console.error('Registration error:', err.response?.data);
      const errorData = err.response?.data;

      if (errorData) {
        // Handle username already exists
        if (errorData.username && errorData.username.includes('already exists')) {
          setError('Username already taken. Please choose a different username.');
        }
        // Handle email already exists
        else if (errorData.email && errorData.email.includes('already exists')) {
          setError('Email already registered. Please use a different email.');
        }
        // Handle confirmPassword error
        else if (errorData.confirmPassword) {
          setError('Passwords do not match. Please try again.');
        }
        // Handle other field errors
        else if (errorData.username) {
          setError(`Username: ${Array.isArray(errorData.username) ? errorData.username.join(', ') : errorData.username}`);
        } else if (errorData.email) {
          setError(`Email: ${Array.isArray(errorData.email) ? errorData.email.join(', ') : errorData.email}`);
        } else if (errorData.password) {
          setError(`Password: ${Array.isArray(errorData.password) ? errorData.password.join(', ') : errorData.password}`);
        } else if (errorData.non_field_errors) {
          setError(`${Array.isArray(errorData.non_field_errors) ? errorData.non_field_errors.join(', ') : errorData.non_field_errors}`);
        } else if (errorData.error) {
          setError(errorData.error);
        } else {
          // If it's an object with field errors
          const errorMessages = Object.entries(errorData).map(([key, value]) => {
            return `${key}: ${Array.isArray(value) ? value.join(', ') : value}`;
          }).join('. ');
          setError(errorMessages);
        }
      } else {
        setError('Registration failed. Please try again.');
      }
    }

    finally {
      setLoading(false);
    }
  };

  const handleSendOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.sendOTP(formData.email);
      setSuccess('New verification code sent!');
      setOtp(['', '', '', '', '', '']);
      setTimer(300);
      setCanResend(false);
      setIsOtpExpired(false);
    } catch (error) {
      console.error('Resend OTP error:', err.response?.data);
      setError(error.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    setStep(1);
    setError('');
    setSuccess('');
    setOtp(['', '', '', '', '', '']);
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      setError('Please enter complete OTP');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authService.verifyOTP(formData.email, otpCode);
      setSuccess('Email verified! Complete your registration.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  // const handleResendOTP = async () => {
  //   setError('');
  //   setSuccess('');
  //   setLoading(true);

  //   try {
  //     await authService.sendOTP(formData.email);
  //     setSuccess('New verification code sent!');
  //     setOtp(['', '', '', '', '', '']);
  //     setTimer(300);
  //     setCanResend(false);
  //     setIsOtpExpired(false);
  //   } catch (error) {
  //     setError(error.response?.data?.error || 'Failed to resend OTP');
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleResendOTP = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await authService.sendOTP(formData.email);
      setSuccess('New verification code sent!');
      setOtp(['', '', '', '', '', '']);
      setTimer(300);
      setCanResend(false);
      setIsOtpExpired(false);
    } catch (err) {  // <-- FIXED: changed 'error' to 'err'
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };


  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    setLoading(true);
    // setError(null);

    try {
      const { email, username, full_name, password } = formData;
      const response = await authService.register({
        email,
        username,
        full_name,
        password
      });

      setSuccess('Registration successful! Redirecting...');
      setTimeout(() => navigate('/'), 2000);
    } catch (err) {
      const errors = err.response?.data;
      if (typeof errors === 'object') {
        const errorMessages = Object.values(errors).flat().join(', ');
        setError(errorMessages);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const validateBeforeSubmit = () => {
    const emailRegex = /^[\w.-]+@[\w.-]+\.(com|in)$/i;
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    const password = formData.password;

    if (!emailRegex.test(formData.email)) {
      return 'Invalid email (must end with .com or .in)';
    }

    // Username validation
    if (!usernameRegex.test(formData.username)) {
      if (formData.username.length < 3) {
        return 'Username must be at least 3 characters long';
      }
      if (formData.username.length > 30) {
        return 'Username must be less than 30 characters';
      }
      return 'Username can only contain letters, numbers, and underscores';
    }

    if (password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter (A-Z)';
    }

    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter (a-z)';
    }

    if (!/\d/.test(password)) {
      return 'Password must contain at least one number (0-9)';
    }

    if (!/[!@#$%^&*()_+\-=\[\]{}|;:,.<>?]/.test(password)) {
      return 'Password must contain at least one special character (!@#$%^&* etc.)';
    }
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

    if (formData.password.length < 10) {
      setError('Password must be at least 10 characters');
      return;
    }
    setLoading(true);
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
    <div className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6 col-xl-5">
            {/* Card */}
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="card-body p-4 p-md-5">
                {/* Header */}
                <div className="text-center mb-4">
                  <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-primary mb-3"
                    style={{ width: '70px', height: '70px' }}>
                    <span className="fs-1">📸</span>
                  </div>
                  <h1 className="pixora-logo text-primary mb-2">PIXORA</h1>
                  <p className="text-muted">
                    {step === 1 ? 'Create your account' : 'Verify your email'}
                  </p>
                </div>

                {/* Progress Steps */}
                <div className="d-flex justify-content-center align-items-center mb-5">
                  <div className="d-flex align-items-center">
                    <div className={`rounded-circle d-flex align-items-center justify-content-center ${step >= 1
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-white'}`}
                      style={{ width: '40px', height: '40px' }}>
                      <span className="fw-bold">1</span>
                    </div>
                    <div className={`mx-2 ${step > 1 ? 'bg-primary' : 'bg-secondary'}`}
                      style={{ width: '80px', height: '3px' }}></div>
                    <div className={`rounded-circle d-flex align-items-center justify-content-center ${step >= 2
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-white'}`}
                      style={{ width: '40px', height: '40px' }}>
                      <span className="fw-bold">2</span>
                    </div>
                  </div>
                </div>

                {/* Error/Success Messages */}
                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    <div>{error}</div>
                  </div>
                )}

                {success && (
                  <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                    <i className="bi bi-check-circle-fill me-2"></i>
                    <div>{success}</div>
                  </div>
                )}

                {/* Step 1: Registration Form */}
                {step === 1 && (
                  <form onSubmit={handleCollectUserData}>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <label className="form-label">Email Address</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-envelope"></i>
                          </span>
                          <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className="form-control"
                            placeholder="your.email@example.com"
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Username</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-person"></i>
                          </span>
                          <input
                            type="text"
                            name="username"
                            value={formData.username}
                            onChange={handleChange}
                            required
                            className="form-control"
                            placeholder="Choose a username"
                          />
                        </div>
                      </div>

                      <div className="col-12">
                        <label className="form-label">Full Name (Optional)</label>
                        <input
                          type="text"
                          name="full_name"
                          value={formData.full_name}
                          onChange={handleChange}
                          className="form-control"
                          placeholder="Your full name"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Password</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-lock"></i>
                          </span>
                          <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="form-control"
                            placeholder="Minimum 8 characters"
                          />
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label">Confirm Password</label>
                        <div className="input-group">
                          <span className="input-group-text">
                            <i className="bi bi-lock-fill"></i>
                          </span>
                          <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                            className="form-control"
                            placeholder="Confirm your password"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary w-100 py-3 fw-bold"
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Sending Code...
                        </>
                      ) : (
                        'Send Verification Code'
                      )}
                    </button>
                  </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                  <form onSubmit={handleVerifyAndRegister}>
                    <div className="text-center mb-5">
                      <div className="d-inline-flex align-items-center justify-content-center rounded-circle bg-light mb-3"
                        style={{ width: '70px', height: '70px' }}>
                        <i className="bi bi-shield-check text-primary fs-3"></i>
                      </div>
                      <h2 className="h4 fw-bold mb-2">Verify Your Email</h2>
                      <p className="text-muted mb-0">
                        We sent a 6-digit code to<br />
                        <strong className="text-primary">{formData.email}</strong>
                      </p>
                    </div>

                    {/* OTP Input */}
                    <div className="mb-4">
                      <label className="form-label text-center d-block mb-3">
                        Enter verification code
                      </label>
                      <div className="d-flex justify-content-center gap-2" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                          <input
                            key={index}
                            id={`otp-${index}`}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleOtpChange(index, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                            className="form-control text-center fw-bold"
                            style={{
                              width: '60px',
                              height: '60px',
                              fontSize: '1.5rem',
                              borderColor: digit ? '#0d6efd' : '#dee2e6'
                            }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Timer */}
                    <div className="text-center mb-4">
                      <div className="badge bg-light text-dark p-2">
                        <i className={`bi bi-clock me-1 ${timer > 30 ? 'text-success' : timer > 0 ? 'text-warning' : 'text-danger'}`}></i>
                        <span className={timer > 30 ? 'text-success' : timer > 0 ? 'text-warning' : 'text-danger'}>
                          {timer > 0 ? `Expires in ${formatTime(timer)}` : 'Code expired!'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otp.join('').length !== 6 || isOtpExpired || timer === 0}
                      className="btn btn-primary w-100 py-3 fw-bold mb-3"
                    >

                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Verifying...
                        </>
                      ) : (
                        'Verify & Create Account'
                      )}
                    </button>

                    {/* Resend Button */}
                    <button
                      type="button"
                      onClick={handleResendOTP}
                      disabled={!canResend || loading}
                      className={`btn w-100 mb-2 ${canResend ? 'btn-outline-primary' : 'btn-outline-secondary'}`}
                    >
                      {canResend ? (
                        <>
                          <i className="bi bi-arrow-clockwise me-2"></i>
                          Resend Verification Code
                        </>
                      ) : (
                        'Resend available after expiry'
                      )}
                    </button>

                    {/* Back Button */}
                    <button
                      type="button"
                      onClick={handleGoBack}
                      className="btn btn-link w-100 text-decoration-none"
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Back to Email
                    </button>
                  </form>
                )}

                {/* Login Link */}
                <div className="text-center mt-5 pt-4 border-top">
                  <p className="text-muted mb-0">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary fw-bold text-decoration-none">
                      Log In
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Footer Note */}
            <div className="text-center mt-4">
              <p className="text-light opacity-75 small">
                By continuing, you agree to Pixora's Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
