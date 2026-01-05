import { useState } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { User, Lock, Mail, UserPlus, ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import './Register.css'

function Register() {
  const navigate = useNavigate()
  const location = useLocation()
  const { register } = useAppContext()
  const from = location.state?.from?.pathname || '/'
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // 验证所有字段
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('请填写所有字段')
      setLoading(false)
      return
    }

    // 验证用户名长度
    if (formData.username.length < 3) {
      setError('用户名至少需要3个字符')
      setLoading(false)
      return
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.email)) {
      setError('请输入有效的邮箱地址')
      setLoading(false)
      return
    }

    // 验证密码长度
    if (formData.password.length < 6) {
      setError('密码至少需要6个字符')
      setLoading(false)
      return
    }

    // 验证密码确认
    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      setLoading(false)
      return
    }

    try {
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      })
      
      if (result.success) {
        if (result.message) {
          alert(result.message)
        }
        navigate('/login')
      } else {
        setError(result.error || '注册失败，请重试')
      }
    } catch (err) {
      setError('注册时发生错误，请重试')
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
    <div className="register-page">
      <div className="register-container">
        <button className="back-button" onClick={handleBack}>
          <ArrowLeft size={20} />
          返回
        </button>
        <div className="register-header">
          <h1>注册</h1>
          <p>创建您的 Rate AI 账户</p>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
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
              placeholder="请输入用户名（至少3个字符）"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              <Mail size={18} />
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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="请输入密码（至少6个字符）"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">
              <Lock size={18} />
              确认密码
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="请再次输入密码"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                aria-label={showConfirmPassword ? "隐藏密码" : "显示密码"}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="register-btn" disabled={loading}>
            <UserPlus size={20} />
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="register-footer">
          <p>
            已有账户？{' '}
            <Link to="/login" className="link">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register

