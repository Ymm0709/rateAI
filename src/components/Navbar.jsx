import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, Star, User, TrendingUp, LogOut, Moon, Sun } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import './Navbar.css'

function Navbar({ theme = 'light', onToggleTheme }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAppContext()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          <Star className="logo-icon" />
          <span>Rate AI</span>
        </Link>
        
        <div className="navbar-links">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            首页
          </Link>
          <Link 
            to="/rankings" 
            className={`nav-link ${location.pathname === '/rankings' ? 'active' : ''}`}
          >
            <TrendingUp size={18} />
            排行榜
          </Link>
          {user ? (
            <>
              <Link 
                to="/profile" 
                className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
              >
                <User size={18} />
                我的
              </Link>
              <div className="user-menu">
                <div className="user-info">
                  <User size={16} />
                  <span>{user.name}</span>
                </div>
                <button onClick={handleLogout} className="logout-btn" title="登出">
                  <LogOut size={16} />
                </button>
              </div>
            </>
          ) : (
            <div className="auth-buttons">
              <Link to="/login" className="nav-link login-link">
                登录
              </Link>
              <Link to="/register" className="nav-link register-link">
                注册
              </Link>
            </div>
          )}
          <button
            className="theme-toggle"
            onClick={onToggleTheme}
            aria-label="切换主题"
            title={theme === 'light' ? '切换至深色' : '切换至浅色'}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            <span className="theme-toggle__text">{theme === 'light' ? '浅色' : '深色'}</span>
          </button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar

