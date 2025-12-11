import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authService } from '../services/authService';

// const validateBeforeSubmit = () => {
//   const emailRegex = /^[\w.-]+@[\w.-]+\.(com|in)$/;
//   const usernameRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;
//   const passwordRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/;

//   if (!emailRegex.test(formData.email)) return "Invalid email (must end with .com or .in)";
//   if (!usernameRegex.test(formData.username)) return "Username must contain uppercase, lowercase, number, special character, and be 8+ chars";
//   if (!passwordRegex.test(formData.password)) return "Password must be strong (uppercase, lowercase, number, special character, 8+ chars)";

//   return null;
// };

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

  // Timer countdown
  useState(() => {
    let interval;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

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
      document.getElementById(`otp-${index + 1}`).focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`).focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
  };

// Combined handler for OTP verification + Registration
const handleVerifyAndRegister = async (e) => {
  e.preventDefault();
  const otpCode = otp.join('');
  
  if (otpCode.length !== 6) {
    setError('Please enter complete OTP');
    return;
  }
  
  setLoading(true);
  setError('');
  
  try {
    // 1. Verify OTP first
    await authService.verifyOTP(formData.email, otpCode);
    
    // 2. If OTP verified, register user
    const { confirmPassword, ...userData } = formData;
    const response = await authService.register(userData);
    
    // 3. Auto-login after registration
    const { access, refresh, user } = response;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(user));
    
    setSuccess('Account created! Logging you in...');
    
    // 4. Redirect to feed/dashboard (change '/feed' to your actual feed route)
    setTimeout(() => {
      navigate('/feed'); // Or '/dashboard', '/home', etc.
    }, 2000);
    
  } catch (err) {
    setError(err.response?.data?.error || 'Registration failed');
  } finally {
    setLoading(false);
  }
};

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await authService.sendOTP(formData.email);
      setSuccess('OTP sent to your email!');
      setStep(2);
      setTimer(300);
      setCanResend(false);
      // alert('OTP sent to your email!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
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
  const handleResendOTP = async () => {
    setError('');
    setLoading(true);

    try {
      await authService.sendOTP(formData.email);
      setSuccess('New OTP sent!');
      setOtp(['', '', '', '', '', '']);
      setTimer(300);
      setCanResend(false);
    } catch (err) {
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
      setTimeout(() => navigate('/dashboard'), 2000);
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

const handleCollectUserData = async (e) => {
  e.preventDefault();
  setError('');

  // 1. Validate passwords match
  if (formData.password !== formData.confirmPassword) {
    setError('Passwords do not match!');
    return;
  }

  // 2. Run your custom validation
  const errorMsg = validateBeforeSubmit();
  if (errorMsg) {
    setError(errorMsg);
    return;
  }

  // 3. Send OTP to verify email
  setLoading(true);
  try {
    await authService.sendOTP(formData.email);
    setSuccess('OTP sent to your email!');
    setStep(2); // Move to OTP verification
    setTimer(300);
  } catch (err) {
    setError(err.response?.data?.error || 'Failed to send OTP');
  } finally {
    setLoading(false);
  }
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

  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4">
  //       <div className="container">
  //         <div className="row justify-content-center">
  //           <div className="col-md-5">
  //             <div className="card shadow-sm border-0">
  //               <div className="card-body p-5">
  //                 <div className="text-center mb-4">
  //                   <h1 className="pixora-logo mb-3">Pixora</h1>
  //                   <p className="text-muted">
  //                     {/* Sign up to see photos and videos from your friends. */}
  //                     {step === 1 && 'Enter your email to get started'}
  //                     {step === 2 && 'Enter the OTP sent to your email'}
  //                     {step === 3 && 'Complete your profile'}
  //                   </p>
  //                 </div>
  //                 {/* Progress Steps */}
  //                 <div className="d-flex justify-content-center mb-4">
  //                   <div className={`px-3 py-1 rounded ${step >= 1 ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
  //                     1. Email
  //                   </div>
  //                   <div className="px-2">→</div>
  //                   <div className={`px-3 py-1 rounded ${step >= 2 ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
  //                     2. OTP
  //                   </div>
  //                   <div className="px-2">→</div>
  //                   <div className={`px-3 py-1 rounded ${step >= 3 ? 'bg-primary text-white' : 'bg-secondary text-white'}`}>
  //                     3. Details
  //                   </div>
  //                 </div>

  //                 {error && (
  //                   <div className="alert alert-danger" role="alert">
  //                     <i className="bi bi-exclamation-triangle me-2"></i>
  //                     {error}
  //                   </div>
  //                 )}
  //                 {/* Step 1: Email */}
  //                 {step === 1 && (
  //                 <form onSubmit={handleSendOTP}>
  //                   <div className="mb-3">
  //                     <input
  //                       type="email"
  //                       className="form-control"
  //                       placeholder="Email"
  //                       value={formData.email}
  //                       onChange={(e) => setFormData({ ...formData, email: e.target.value })}
  //                       required
  //                     />
  //                   </div>
  // <button type="submit" className="btn btn-primary w-100" disabled={loading}>
  //                       {loading ? 'Sending...' : 'Send OTP'}
  //                     </button>
  //                   </form>
  //                 )}


  //                 {/* Step 2: OTP */}
  //                 {step === 2 && (
  //                   <form onSubmit={handleVerifyOTP}>
  //                   <div className="mb-3">
  //                     <input
  //                       type="text"
  //                       className="form-control text-center"
  //                       placeholder="Enter 6-digit OTP"
  //                       value={formData.otp}
  //                       onChange={(e) => setFormData({ ...formData, otp: e.target.value })}
  //                       maxLength={6}
  //                       required
  //                       style={{ fontSize: '24px', letterSpacing: '8px' }}
  //                     />
  //                   </div>
  // <button type="submit" className="btn btn-primary w-100" disabled={loading}>
  //                       {loading ? 'Verifying...' : 'Verify OTP'}
  //                     </button>
  //                     <button 
  //                       type="button" 
  //                       className="btn btn-link w-100 mt-2"
  //                       onClick={handleSendOTP}
  //                     >
  //                       Resend OTP
  //                     </button>
  //                   </form>
  //                 )}


  //                   <div className="mb-3">
  //                     <input
  //                       type="text"
  //                       className="form-control"
  //                       placeholder="Full Name"
  //                       value={formData.full_name}
  //                       onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
  //                       required
  //                     />
  //                   </div>

  //                   <div className="mb-3">
  //                     <input
  //                       type="password"
  //                       className="form-control"
  //                       placeholder="Password"
  //                       value={formData.password}
  //                       onChange={(e) => setFormData({ ...formData, password: e.target.value })}
  //                       required
  //                     />
  //                   </div>

  //                   <div className="mb-3">
  //                     <input
  //                       type="password"
  //                       className="form-control"
  //                       placeholder="Confirm Password"
  //                       value={formData.confirmPassword}
  //                       onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
  //                       required
  //                     />
  //                   </div>

  //                   <button
  //                     type="submit"
  //                     className="btn btn-primary w-100"
  //                     disabled={loading}
  //                   >
  //                     {loading ? (
  //                       <>
  //                         <span className="spinner-border spinner-border-sm me-2" role="status"></span>
  //                         Signing up...
  //                       </>
  //                     ) : (
  //                       'Sign Up'
  //                     )}
  //                   </button>
  //                 </form>

  //                 <div className="text-center mt-4">
  //                   <p className="text-muted mb-0">
  //                     Have an account?{' '}
  //                     <Link to="/login" className="text-primary fw-bold text-decoration-none">
  //                       Log in
  //                     </Link>
  //                   </p>
  //                 </div>
  //               </div>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };

  // export default Register;



  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            📸 PIXORA
          </h1>
          <p className="text-gray-600">
            {step === 1 && 'Create your account'}
            {step === 2 && 'Verify your email'}
            {step === 3 && 'Complete your profile'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-purple-600 text-white' : 'bg-gray-300 text-gray-600'
                }`}>
                {s}
              </div>
              {s < 3 && <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-purple-600' : 'bg-gray-300'}`} />}
            </div>
          ))}
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Step 1: Email Input */}
        {step === 1 && (
          // <form onSubmit={handleSendOTP} className="space-y-4">
          <form onSubmit={handleCollectUserData} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>


            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Choose a username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Create a password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Confirm password"
              />
            </div>


            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition 
              "
              // disabled:opacity-50"
            >
              {/* {loading ? 'Sending...' : 'Send Verification Code'} */}
              Continue
            </button>
          </form>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <form onSubmit={handleVerifyAndRegister} className="space-y-6">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit code sent to<br />
                <strong>{formData.email}</strong>
              </p>
              </div>
 <button
      type="submit"
      disabled={loading || otp.join('').length !== 6}
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
    >
      {loading ? 'Verifying...' : 'Verify & Create Account'}
    </button>
  </form>
)}


              {/* <div className="flex justify-center gap-2 mb-4" onPaste={handlePaste}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-12 h-12 text-center text-xl font-bold border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  />
                ))}
              </div>

              <div className="text-sm text-gray-600">
                {timer > 0 ? (
                  <p>Code expires in: <strong>{formatTime(timer)}</strong></p>
                ) : (
                  <p className="text-red-600">Code expired!</p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Verify Email'}
            </button>

            <button
              type="button"
              onClick={handleResendOTP}
              disabled={!canResend || loading}
              className="w-full text-purple-600 py-2 text-sm hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {canResend ? 'Resend Code' : 'Resend available after expiry'}
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="w-full text-gray-600 py-2 text-sm hover:underline"
            >
              Change Email
            </button>
          </form>
        )} */}

        {/* Step 3: Complete Registration */}
        {step === 3 && (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Choose a unique username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Your full name (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Create a strong password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                placeholder="Confirm your password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {loading ? 'Creating Account...' : 'Complete Registration'}
            </button>
          </form>
        )}

        {/* Login Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            Already have an account?{' '}
            <Link to="/login" className="text-purple-600 hover:underline font-semibold">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
