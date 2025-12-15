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

  const favoriteAIs = useMemo(
    () => ais.filter(ai => favoriteIds.includes(ai.id)),
    [ais, favoriteIds]
  )
  const myComments = useMemo(
    () => comments.filter(c => c.author === (user?.name || user?.username)),
    [comments, user]
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
                <User size={40} />
              )}
            </div>
            <div className="user-info">
              <div className="title-with-img">
                <img src="https://via.placeholder.com/48x48?text=P" alt="个人页图标占位" />
                <h1>{user?.name || user?.username || '用户'}</h1>
              </div>
              <div className="user-level">
                <Star size={16} fill="currentColor" />
                <span>等级 {user?.level || 1}</span>
              </div>
            </div>
          </div>

          <div className="user-stats">
            <div className="stat-card">
              <MessageSquare size={24} />
              <div>
                <div className="stat-value">{user?.stats?.comments || userActivity.comments.length || 0}</div>
                <div className="stat-label">评论</div>
              </div>
            </div>
            <div className="stat-card">
              <Star size={24} />
              <div>
                <div className="stat-value">{user?.stats?.ratings || userActivity.ratings.length || 0}</div>
                <div className="stat-label">评分</div>
              </div>
            </div>
            <div className="stat-card">
              <Heart size={24} />
              <div>
                <div className="stat-value">{user?.stats?.favorites || favoriteIds.length || 0}</div>
                <div className="stat-label">收藏</div>
              </div>
            </div>
            <div className="stat-card">
              <Star size={24} />
              <div>
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
            <div className="favorites-grid">
              {favoriteAIs.map(ai => (
                <AICard key={ai.id} ai={ai} />
              ))}
              {favoriteAIs.length === 0 && (
                <div className="empty-state">
                  <p>还没有收藏任何 AI</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="comment-history">
              {myComments.length === 0 ? (
                <div className="empty-state">
                  <p>还没有评论，去详情页写一条吧～</p>
                </div>
              ) : (
                myComments.map((comment) => (
                  <div key={comment.id} className="comment-card">
                    <div className="comment-meta">
                      <span className="comment-ai">{findAIName(comment.aiId)}</span>
                      <span className="comment-date">{comment.date}</span>
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
                  <p>还没有提交评分，去试试吧！</p>
                </div>
              ) : (
                userActivity.ratings.map((rating) => (
                  <div key={rating.submittedAt} className="rating-card">
                    <div className="rating-meta">
                      <span className="comment-ai">{findAIName(rating.aiId)}</span>
                      <span className="comment-date">
                        {new Date(rating.submittedAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="rating-grid">
                      {Object.entries(rating.scores).map(([key, value]) => (
                        <div key={key} className="rating-chip">
                          <span>{key}</span>
                          <strong>{value}</strong>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
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

