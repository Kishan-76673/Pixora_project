import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,
  error: null,


  // Send OTP
  sendOTP: async (email) => {
    set({ loading: true, error: null });
    try {
      const response = await authService.sendOTP(email);
      set({ success: 'OTP sent to your email!' });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.email?.[0] || 
                       'Failed to send OTP';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },


  // Verify OTP
  verifyOTP: async (email, otp) => {
    set({ loading: true, error: null,success: null });
    try {
      const response = await authService.verifyOTP(email, otp);
      set({ success: 'Email verified successfully!' });
      return response;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 
                       error.response?.data?.detail || 
                       'Invalid OTP';
      set({ error: errorMsg });
      throw error;
    } finally {
      set({ loading: false });
    }
  },


  login: async (credentials) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(credentials);
      set({ user: data.user, isAuthenticated: true, loading: false });
      return data;
    } catch (error) {
      const errorMsg = error.response?.data?.message ||
  error.response?.data?.detail ||
  error.response?.data?.error ||
  'Login failed';

      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.register(userData);
      const { access, refresh, user } = response;
      set({ loading: false });
      return data;
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Registration failed';
      set({ error: errorMsg, loading: false });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  updateUser: (userData) => {
    const updatedUser = { ...authService.getCurrentUser(), ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  clearError: () => set({ error: null }),
}));