import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { User, Lock, LogIn, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAppContext()
  const from = location.state?.from?.pathname || '/'
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.username || !formData.password) {
      setError('请填写所有字段')
      setLoading(false)
      return
    }

    try {
      const result = await login(formData.username, formData.password)
      if (result.success) {
        navigate(from, { replace: true })
      } else {
        setError(result.error || '登录失败，请重试')
      }
    } catch (err) {
      setError('登录时发生错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleBack = () => {
    navigate(-1)
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <button className="back-button" onClick={handleBack}>
          <ArrowLeft size={20} />
          返回
        </button>
        <div className="login-header">
          <h1>登录</h1>
          <p>欢迎回到 Rate AI</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="username">
              <User size={18} />
              用户名
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="请输入您的用户名"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              密码
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="请输入您的密码"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "隐藏密码" : "显示密码"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            <LogIn size={20} />
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            还没有账户？{' '}
            <Link to="/register" className="link">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login