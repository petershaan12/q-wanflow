import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import axios from 'axios';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      _hasHydrated: false,
      
      setAuth: (user, token) => set({ user, token }),
      
      loginWithGoogle: async (credential) => {
        try {
          const response = await axios.post('/api/auth/google', { credential });
          const { user, access_token } = response.data;
          set({ user, token: access_token });
          return { success: true };
        } catch (error) {
          console.error('Google Login failed:', error);
          return { success: false, error: error.response?.data?.detail || 'Google login failed' };
        }
      },

      login: async (email, password) => {
        try {
          const response = await axios.post('/api/auth/login', { email, password });
          const { user, access_token } = response.data;
          set({ user, token: access_token });
          return { success: true };
        } catch (error) {
          console.error('Login failed:', error);
          const needsVerification = error.response?.headers['x-account-verified'] === 'false';
          return { 
            success: false, 
            error: error.response?.data?.detail || 'Login failed',
            needsVerification
          };
        }
      },

      register: async (email, password, name) => {
        try {
          const response = await axios.post('/api/auth/register', { email, password, name });
          return { success: true, user: response.data };
        } catch (error) {
          console.error('Registration failed:', error);
          return { success: false, error: error.response?.data?.detail || 'Registration failed' };
        }
      },

      verifyOTP: async (email, otp_code) => {
        try {
          const response = await axios.post('/api/auth/verify-otp', { email, otp_code });
          const { user, access_token } = response.data;
          set({ user, token: access_token });
          return { success: true };
        } catch (error) {
          console.error('OTP Verification failed:', error);
          return { success: false, error: error.response?.data?.detail || 'Invalid OTP' };
        }
      },

      resendOTP: async (email) => {
        try {
          await axios.post('/api/auth/resend-otp', { email });
          return { success: true };
        } catch (error) {
          console.error('Resend OTP failed:', error);
          return { success: false, error: error.response?.data?.detail || 'Resend failed' };
        }
      },
      
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('settings_avatar');
      },

      contactSupport: async (name, email, message) => {
        try {
          await axios.post('/api/util/support', { name, email, message });
          return { success: true };
        } catch (error) {
          console.error('Support request failed:', error);
          return { success: false, error: error.response?.data?.detail || 'Failed to send message' };
        }
      },
      
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true);
      },
    }
  )
);

export default useAuthStore;
