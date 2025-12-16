import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav
      className="navbar navbar-expand-lg shadow-sm sticky-top pixora-navbar"
    >
      <div className="container">
        <Link to="/" className="navbar-brand pixora-logo fw-bold fs-3">
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
                  <span className="nav-link fw-semibold">
                    Hi, {user?.username}
                  </span>
                </li>

                <li className="nav-item mx-2">
                  <Link
                    to="/"
                    className={`navbar-icon-btn ${location.pathname === "/" ? "active-nav" : ""}`}
                    title="Home"
                  >
                    <i className="bi bi-house-door"></i>
                  </Link>
                </li>

                <li className="nav-item mx-2">
                  <Link
                    to="/create"
                    className={`navbar-icon-btn ${location.pathname === "/create" ? "active-nav" : ""}`}
                    title="Create Post"
                  >
                    <i className="bi bi-plus-square"></i>
                  </Link>
                </li>

                <li className="nav-item mx-2">
                  <Link
                    to={`/profile/${user?.username}`}
                    className="navbar-icon-btn"
                    title="Profile"
                  >
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.username}
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          objectFit: "cover"
                        }}
                      />
                    ) : (
                      <i className="bi bi-person-circle"></i>
                    )}
                  </Link>
                </li>

                <li className="nav-item mx-2">
                  <button
                    onClick={toggleTheme}
                    className="navbar-icon-btn"
                    title={isDark ? "Light Mode" : "Dark Mode"}
                  >
                    <i className={`bi bi-${isDark ? 'sun' : 'moon'}-fill`}></i>
                  </button>
                </li>

                <li className="nav-item mx-2">
                  <button
                    className="navbar-icon-btn"
                    onClick={handleLogout}
                    title="Logout"
                  >
                    <i className="bi bi-box-arrow-right"></i>
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