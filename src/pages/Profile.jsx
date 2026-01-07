import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Star, Heart, MessageSquare, Settings } from 'lucide-react'
import AICard from '../components/AICard'
import { useAppContext } from '../context/AppContext'
import './Profile.css'

function Profile() {
  const navigate = useNavigate()
  const { user, ais, favoriteIds, comments, userActivity, updateUser } = useAppContext()
  const [activeTab, setActiveTab] = useState('favorites')
  const [settingsData, setSettingsData] = useState({
    username: '',
    email: ''
  })
  const [userComments, setUserComments] = useState([])
  const [loading, setLoading] = useState(false)

  // 如果未登录，重定向到登录页面
  useEffect(() => {
    if (!user) {
      navigate('/login')
    } else {
      setSettingsData({
        username: user.name || user.username || '',
        email: user.email || ''
      })
    }
  }, [user, navigate])

  // 从后端加载用户的评论
  useEffect(() => {
    const loadUserComments = async () => {
      if (!user) return
      
      setLoading(true)
      try {
        const response = await fetch('/api/users/comments/', {
          credentials: 'include'
        })
        if (response.ok) {
          const data = await response.json()
          if (data.success && data.comments) {
            // 转换评论格式
            const normalizedComments = data.comments.map(c => ({
              id: c.comment_id,
              aiId: c.ai?.ai_id || c.ai_id,
              author: c.user?.username || user?.username || '用户',
              date: c.created_at ? c.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
              rating: null,
              content: c.content || '',
              images: c.images || [],
              upvotes: c.upvotes || 0,
              helpful: false,
              notHelpful: false,
              replies: []
            }))
            setUserComments(normalizedComments)
          }
        }
      } catch (error) {
        console.error('加载用户评论失败:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user && activeTab === 'comments') {
      loadUserComments()
    }
  }, [user, activeTab])

  const favoriteAIs = useMemo(
    () => ais.filter(ai => favoriteIds.includes(ai.id)),
    [ais, favoriteIds]
  )
  // 优先使用从后端加载的用户评论，如果没有则使用context中的评论
  const myComments = useMemo(
    () => {
      if (userComments.length > 0) {
        return userComments
      }
      return comments.filter(c => c.author === (user?.name || user?.username))
    },
    [comments, user, userComments]
  )
  const findAIName = (aiId) => ais.find(ai => ai.id === aiId)?.name || '未知 AI'

  // 如果未登录，不渲染内容
  if (!user) {
    return null
  }

  const handleSaveSettings = () => {
    updateUser({
      name: settingsData.username,
      username: settingsData.username,
      email: settingsData.email
    })
    alert('设置已保存')
  }

  return (
    <div className="profile">
      <div className="container">
        <div className="profile-header">
          <div className="avatar-section">
            <div className="avatar">
              {user.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <div className="avatar-placeholder">
                  <User size={40} />
                </div>
              )}
            </div>
            <div className="user-info">
              <h1>{user?.name || user?.username || '用户'}</h1>
              <div className="user-meta">
                <div className="user-level">
                  <Star size={16} fill="currentColor" />
                  <span>等级 {user?.level || 1}</span>
                </div>
                <div className="user-email">
                  <span>{user?.email || ''}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="user-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <MessageSquare size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{user?.stats?.comments || userActivity.comments.length || 0}</div>
                <div className="stat-label">评论</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Star size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{user?.stats?.ratings || userActivity.ratings.length || 0}</div>
                <div className="stat-label">评分</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Heart size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{user?.stats?.favorites || favoriteIds.length || 0}</div>
                <div className="stat-label">收藏</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">
                <Star size={24} />
              </div>
              <div className="stat-content">
                <div className="stat-value">{user?.stats?.helpful || 0}</div>
                <div className="stat-label">获赞</div>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'favorites' ? 'active' : ''}`}
            onClick={() => setActiveTab('favorites')}
          >
            <Heart size={18} />
            我的收藏
          </button>
          <button
            className={`profile-tab ${activeTab === 'comments' ? 'active' : ''}`}
            onClick={() => setActiveTab('comments')}
          >
            <MessageSquare size={18} />
            我的评论
          </button>
          <button
            className={`profile-tab ${activeTab === 'ratings' ? 'active' : ''}`}
            onClick={() => setActiveTab('ratings')}
          >
            <Star size={18} />
            我的评分
          </button>
          <button
            className={`profile-tab ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            设置
          </button>
        </div>

        <div className="profile-content">
          {activeTab === 'favorites' && (
            <div className="favorites-section">
              {favoriteAIs.length === 0 ? (
                <div className="empty-state">
                  <Heart size={48} className="empty-icon" />
                  <p>还没有收藏任何 AI</p>
                  <button 
                    className="action-link-btn"
                    onClick={() => navigate('/')}
                  >
                    去首页看看
                  </button>
                </div>
              ) : (
                <div className="favorites-grid">
                  {favoriteAIs.map(ai => (
                    <AICard key={ai.id} ai={ai} />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="comment-history">
              {loading ? (
                <div className="empty-state">
                  <p>加载中...</p>
                </div>
              ) : myComments.length === 0 ? (
                <div className="empty-state">
                  <MessageSquare size={48} className="empty-icon" />
                  <p>还没有评论，去详情页写一条吧～</p>
                  <button 
                    className="action-link-btn"
                    onClick={() => navigate('/')}
                  >
                    去首页看看
                  </button>
                </div>
              ) : (
                myComments.map((comment) => (
                  <div key={comment.id} className="comment-card">
                    <div className="comment-card-header">
                      <h3 className="comment-ai">{findAIName(comment.aiId)}</h3>
                      <button 
                        className="view-ai-btn"
                        onClick={() => navigate(`/ai/${comment.aiId}`)}
                      >
                        查看详情
                      </button>
                    </div>
                    <div className="comment-meta">
                      <span className="comment-date">{comment.date}</span>
                      {comment.rating && (
                        <div className="comment-rating">
                          <Star size={14} fill="currentColor" />
                          <span>{comment.rating}/10</span>
                        </div>
                      )}
                    </div>
                    <p className="comment-text">{comment.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'ratings' && (
            <div className="rating-history">
              {userActivity.ratings.length === 0 ? (
                <div className="empty-state">
                  <Star size={48} className="empty-icon" />
                  <p>还没有提交评分，去试试吧！</p>
                  <button 
                    className="action-link-btn"
                    onClick={() => navigate('/')}
                  >
                    去首页看看
                  </button>
                </div>
              ) : (
                userActivity.ratings.map((rating) => {
                  const aiItem = ais.find(a => a.id === rating.aiId)
                  // 如果有总评分，使用总评分；否则计算平均值
                  let averageScore = 0
                  if (rating.scores?.overall && rating.scores.overall > 0) {
                    averageScore = rating.scores.overall
                  } else {
                    const validScores = Object.values(rating.scores || {}).filter(val => val > 0)
                    if (validScores.length > 0) {
                      averageScore = validScores.reduce((sum, val) => sum + val, 0) / validScores.length
                    }
                  }
                  return (
                    <div key={rating.submittedAt} className="rating-card">
                      <div className="rating-card-header">
                        <div className="rating-card-title">
                          <h3>{findAIName(rating.aiId)}</h3>
                          <div className="rating-card-score">
                            <Star size={16} fill="currentColor" />
                            <span>{Number(averageScore).toFixed(1)}/10</span>
                          </div>
                        </div>
                        <button 
                          className="view-ai-btn"
                          onClick={() => navigate(`/ai/${rating.aiId}`)}
                        >
                          查看详情
                        </button>
                      </div>
                      <div className="rating-meta">
                        <span className="comment-date">
                          {new Date(rating.submittedAt).toLocaleString('zh-CN', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <div className="rating-grid">
                        {Object.entries(rating.scores || {}).filter(([key, value]) => value > 0).map(([key, value]) => {
                          const labelMap = {
                            overall: '总体评价',
                            versatility: '万能性',
                            imageGeneration: '图像生成',
                            informationQuery: '信息查询',
                            studyAssistance: '学习辅助',
                            valueForMoney: '性价比'
                          }
                          return (
                            <div key={key} className="rating-chip">
                              <span className="rating-chip-label">{labelMap[key] || key}</span>
                              <strong className="rating-chip-value">{Number(value).toFixed(1)}/10</strong>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="settings-section">
              <div className="settings-card">
                <h3>账户设置</h3>
                <div className="setting-item">
                  <label>用户名</label>
                  <input 
                    type="text" 
                    value={settingsData.username}
                    onChange={(e) => setSettingsData({ ...settingsData, username: e.target.value })}
                  />
                </div>
                <div className="setting-item">
                  <label>邮箱</label>
                  <input 
                    type="email" 
                    value={settingsData.email}
                    onChange={(e) => setSettingsData({ ...settingsData, email: e.target.value })}
                    placeholder="user@example.com" 
                  />
                </div>
                <button className="save-btn" onClick={handleSaveSettings}>保存更改</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Profile

