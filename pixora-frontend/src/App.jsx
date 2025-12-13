import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
  const { initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, []);

  return (
    <BrowserRouter>
      <Routes>

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Home />} />
          <Route path="create" element={<CreatePost />} />
          <Route path="profile/:username" element={<Profile />} />
          <Route path="profile/edit" element={<EditProfile />} />
          <Route path="stories/create" element={<CreateStory />} />
          <Route path="posts/:postId" element={<PostDetail />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;