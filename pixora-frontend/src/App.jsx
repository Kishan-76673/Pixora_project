import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import CreatePost from './pages/CreatePost';
import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import CreateStory from './pages/CreateStory';
import PostDetail from './pages/PostDetail';
import Messages from './pages/Messages';
import Followers from './pages/Followers';
import Following from './pages/Following';
import SessionTimeout from './components/common/SessionTimeout';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { initTheme } = useThemeStore();
  const { isAuthenticated, initializeAuth } = useAuthStore();

  useEffect(() => {
    initTheme();
    initializeAuth();
  }, [initTheme, initializeAuth]);

  return (
    <>
      {isAuthenticated && <SessionTimeout />}

      <Routes>
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/register"
          element={!isAuthenticated ? <Register /> : <Navigate to="/" />}
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="create" element={<CreatePost />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="stories/create" element={<CreateStory />} />
          <Route path="posts/:postId" element={<PostDetail />} />
          <Route path="messages" element={<Messages />} />
          <Route path="profile/:username/followers" element={<Followers />} />
          <Route path="profile/:username/following" element={<Following />} />
        </Route>
      </Routes>
    </>
  );

}

export default App;