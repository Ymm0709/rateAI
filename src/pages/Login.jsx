import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { User, Lock, LogIn, ArrowLeft } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import './Login.css'

function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAppContext()
  const from = location.state?.from?.pathname || '/'
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.email || !formData.password) {
      setError('请填写所有字段')
      setLoading(false)
      return
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址')
      setLoading(false)
      return
    }

    try {
      const result = login(formData.email, formData.password)
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
            <label htmlFor="email">
              <User size={18} />
              邮箱
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="请输入您的邮箱"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <Lock size={18} />
              密码
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入您的密码"
              required
            />
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

