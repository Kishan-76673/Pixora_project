import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    // if (window.confirm("Are you sure you want to logout?")) {
      logout();
      navigate("/login");
    // }
  };

  return (
    <nav className="navbar navbar-expand-lg modern-navbar shadow-sm sticky-top">
      <div className="container">

        <Link to="/" className="navbar-brand pixora-logo text-white fw-bold fs-3">
          Pixora
        </Link>

        <button
          className="navbar-toggler custom-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <i className="bi bi-list"></i>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav ms-auto align-items-center gap-3">

            {isAuthenticated ? (
              <>
                <li className="nav-item mx-2">
                  <span className="nav-link text-white fw-semibold">
                    Hi, {user?.username}
                  </span>
                </li>

                <li className="nav-item mx-2">
                  <Link
                    to="/"
                    className={`nav-link nav-icon ${location.pathname === "/" ? "active-icon" : ""}`}
                    title="Home"
                  >
                    <i className="bi bi-house-door fs-4"></i>
                  </Link>
                </li>

                <li className="nav-item mx-2">
                  <Link
                    to="/create"
                    className={`nav-link nav-icon ${location.pathname === "/create" ? "active-icon" : ""}`}
                    title="Create Post"
                  >
                    <i className="bi bi-plus-square fs-4"></i>
                  </Link>
                </li>

                <li className="nav-item mx-2">
                  <Link to={`/profile/${user?.username}`} className="nav-link" title="Profile">
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        className="rounded-circle"
                        style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="bi bi-person-circle fs-4"></i>
                    )}
                  </Link>
                </li>

                {/* Dark Mode Toggle */}
                <li className="nav-item mx-2">
                  <button
                    onClick={toggleTheme}
                    className="btn btn-link nav-link p-0"
                    title={isDark ? "Light Mode" : "Dark Mode"}
                  >
                    <i className={`bi bi-${isDark ? 'sun' : 'moon'}-fill fs-4`}></i>
                  </button>
                </li>

                <li className="nav-item mx-2">
                  <button className="btn btn-light px-3 rounded" onClick={handleLogout} title="Logout">
                    {/* Logout */}
                    <i className="bi bi-box-arrow-right fs-4"></i>
                  </button>
                </li>
              </>
            ) : (
              <>

                <li className="nav-item mx-2">
                  <button
                    onClick={toggleTheme}
                    className="btn btn-link nav-link p-0"
                    title={isDark ? "Light Mode" : "Dark Mode"}
                  >
                    <i className={`bi bi-${isDark ? 'sun' : 'moon'}-fill fs-4`}></i>
                  </button>
                </li>

                <li className="nav-item mx-2">
                  <Link to="/login" className="btn btn-light px-4">Login</Link>
                </li>
                <li className="nav-item mx-2">
                  <Link to="/register" className="btn btn-outline-light px-4">Sign Up</Link>
                </li>
              </>
            )}

          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;