import api from './api';

export const authService = {

  // authService.js - Add this function
refreshToken: async () => {
  try {
    const refresh = localStorage.getItem('refreshToken');
    if (!refresh) throw new Error('No refresh token');
    
    const response = await api.post('/auth/token/refresh/', { refresh });
    const { access } = response.data;
    
    localStorage.setItem('accessToken', access);
    return access;
  } catch (error) {
    console.error('Refresh token error:', error);
    authService.logout();
    throw error;
  }
},

  register: async (userData) => {
    try {
      // Send BOTH password and confirmPassword (same value)
      const dataToSend = {
        email: userData.email,
        username: userData.username,
        full_name: userData.full_name || '',
        password: userData.password,
        confirmPassword: userData.password
      };

      // console.log('Sending registration data:', dataToSend);
      const response = await api.post('/auth/register/', dataToSend);
      return response.data;
    } catch (error) {
      console.error('Registration error details:', error.response?.data);
      throw error;
    }
  },

  // Send OTP
  sendOTP: async (email) => {
    try {
      const response = await api.post('/auth/send-otp/', { email });
      return response.data;
    } catch (error) {
      console.error('Send OTP error:', error.response?.data);
      throw error;
    }
  },

  // Verify OTP
  verifyOTP: async (email, otp) => {
    try {
      const response = await api.post('/auth/verify-otp/', { email, otp });
      return response.data;
    } catch (error) {
      console.error('Verify OTP error:', error.response?.data);
      throw error;
    }
  },

  login: async (credentials) => {
    const response = await api.post('/auth/login/', credentials);
    const { access, refresh, user } = response.data;

    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
    localStorage.setItem('user', JSON.stringify(user));

    return response.data;
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
};
