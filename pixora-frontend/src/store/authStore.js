import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set, get) => ({
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
    set({ loading: true, error: null, success: null });
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
      // const { access, refresh, user } = response;
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
    window.location.href = '/login';
  },

  updateUser: (userData) => {
    const updatedUser = { ...authService.getCurrentUser(), ...userData };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  clearError: () => set({ error: null }),


  updateFollowCounts: (delta) => {
    set((state) => {
      if (!state.user) return state;

      const updatedUser = {
        ...state.user,
        following_count: state.user.following_count + delta,
      };

      localStorage.setItem('user', JSON.stringify(updatedUser));

      return { user: updatedUser };
    });
  },

  refreshAccessToken: async () => {
    try {
      const newAccessToken = await authService.refreshToken();
      return newAccessToken;
    } catch (error) {
      get().logout();
      throw error;
    }
  },

  // Initialize auth from localStorage
  initializeAuth: () => {
    const token = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const userStr = localStorage.getItem('user');

    if (token && refreshToken && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({
          user,
          isAuthenticated: true,
        });
      } catch {
        get().logout();
      }
    }
  },
}));

// Listen for logout event from api.js
if (typeof window !== 'undefined') {
  window.addEventListener('logout', () => {
    useAuthStore.getState().logout();
  });
}

