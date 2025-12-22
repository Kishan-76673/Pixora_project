import { useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';

const SessionTimeout = () => {
  const {
    isAuthenticated,
    refreshAccessToken,
    logout
  } = useAuthStore();

  const navigate = useNavigate();
  const checkIntervalRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    checkIntervalRef.current = setInterval(async () => {
      try {
        await refreshAccessToken(); // 👈 THIS IS THE FIX
      } catch {
        console.log('⏰ Session expired, logging out...');
        logout();
        navigate('/login', {
          state: { message: 'Your session has expired. Please login again.' }
        });
      }
    // }, 60000); // every 1 min
    }, 30000); // every 30 seconds


    return () => clearInterval(checkIntervalRef.current);
  }, [isAuthenticated, refreshAccessToken, logout, navigate]);

  return null;
};

export default SessionTimeout;
