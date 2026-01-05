import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, Heart, Share2, Flag, Building2, ExternalLink } from 'lucide-react'
import RatingForm from '../components/RatingForm'
import CommentSection from '../components/CommentSection'
import TagInput from '../components/TagInput'
import ReactionButtons from '../components/ReactionButtons'
import RatingStars from '../components/RatingStars'
import RatingTrend from '../components/RatingTrend'
import ReportForm from '../components/ReportForm'
import { useAppContext } from '../context/AppContext'
import './AIDetail.css'

function AIDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const {
    user,
    ais,
    comments,
    favoriteIds,
    userActivity,
    toggleFavorite,
    submitRating,
    addComment,
    addTag,
    handleReaction
  } = useAppContext()
  const ai = ais.find(a => a.id === parseInt(id))
  const [isFavoriteLocal, setIsFavoriteLocal] = useState(false)
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [shareMessage, setShareMessage] = useState('')
  const [reportMessage, setReportMessage] = useState('')
  const [ratingError, setRatingError] = useState('')
  
  // 检查用户是否已经评分过，并获取之前的评分
  const userRating = user && userActivity.ratings.find(r => r.aiId === ai?.id)
  const hasRated = !!userRating

  // 进入详情页时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [id])

  // 分享功能
  const handleShare = async () => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }

    const url = window.location.href
    
    // 尝试使用 Web Share API（移动设备）
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${ai.name} - Rate AI`,
          text: ai.description,
          url: url
        })
        setShareMessage('分享成功！')
        setTimeout(() => setShareMessage(''), 3000)
        return
      } catch (err) {
        // 用户取消分享，不做任何操作
        if (err.name !== 'AbortError') {
          console.error('分享失败:', err)
        }
        return
      }
    }
    
    // 桌面端：复制链接到剪贴板
    try {
      await navigator.clipboard.writeText(url)
      setShareMessage('链接已复制到剪贴板！')
      setTimeout(() => setShareMessage(''), 3000)
    } catch (err) {
      // 降级方案：使用旧方法
      const textArea = document.createElement('textarea')
      textArea.value = url
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        setShareMessage('链接已复制到剪贴板！')
        setTimeout(() => setShareMessage(''), 3000)
      } catch (err) {
        setShareMessage('复制失败，请手动复制链接')
        setTimeout(() => setShareMessage(''), 3000)
      }
      document.body.removeChild(textArea)
    }
  }

  // 打开举报表单
  const handleReport = () => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    setShowReportForm(true)
  }

  // 提交举报
  const handleSubmitReport = (reportData) => {
    // 这里可以添加实际的举报逻辑，比如发送到后端API
    console.log('举报内容:', {
      ...reportData,
      aiId: ai.id,
      timestamp: new Date().toISOString()
    })
    
    setReportMessage('举报已提交，我们会尽快审核处理。感谢您的反馈！')
    setTimeout(() => setReportMessage(''), 4000)
  }

  if (!ai) {
    return (
      <div className="container">
        <div className="not-found">
          <h2>AI 未找到</h2>
          <Link to="/">返回首页</Link>
        </div>
      </div>
    )
  }

  const aiComments = comments.filter(c => c.aiId === ai.id)
  const isFavorite = favoriteIds.includes(ai.id) || isFavoriteLocal

  return (
    <div className="ai-detail">
      <div className="container">
        <Link to="/" className="back-link">
          <ArrowLeft size={20} />
          返回
        </Link>

        <div className="detail-header">
          <div className="header-content">
            <h1>{ai.name}</h1>
            <p className="ai-description-full">{ai.description}</p>
            <div className="developer-chip">
              <Building2 size={16} />
              <span>{ai.developer || '未注明开发商'}</span>
            </div>
            
            <div className="header-stats">
              <div className="main-rating">
                <RatingStars score={ai.averageScore} size={24} />
                <span className="rating-text">
                  <strong>{ai.averageScore.toFixed(1)}</strong> / 10.0
                </span>
                <span className="rating-count">({ai.ratingCount} 评价)</span>
              </div>
              
              <ReactionButtons 
                reactions={ai.reactions}
                aiId={ai.id}
                userReaction={userActivity.reactions[ai.id]}
                onReaction={(type) => {
                  if (!user) {
                    navigate('/login', { state: { from: location } })
                    return
                  }
                  handleReaction(ai.id, type)
                }}
              />
            </div>

            <div className="header-actions">
              {(shareMessage || reportMessage) && (
                <div className="action-message">
                  {shareMessage || reportMessage}
                </div>
              )}
              <button 
                className={`action-btn favorite ${isFavorite ? 'active' : ''}`}
                onClick={() => {
                  if (!user) {
                    navigate('/login', { state: { from: location } })
                    return
                  }
                  setIsFavoriteLocal(!isFavoriteLocal)
                  toggleFavorite(ai.id)
                }}
              >
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                {isFavorite ? '已收藏' : '收藏'}
              </button>
              {ai.link && (
                <a className="action-btn" href={ai.link} target="_blank" rel="noreferrer">
                  <ExternalLink size={18} />
                  官网
                </a>
              )}
              <button className="action-btn" onClick={handleShare}>
                <Share2 size={18} />
                分享
              </button>
              <button className="action-btn" onClick={handleReport}>
                <Flag size={18} />
                举报
              </button>
            </div>
          </div>
        </div>

        {showReportForm && (
          <ReportForm
            type="ai"
            targetName={ai.name}
            onClose={() => setShowReportForm(false)}
            onSubmit={handleSubmitReport}
          />
        )}

        <div className="detail-content">
          <div className="detail-main">
            <section className="rating-section">
              <div className="section-header">
                <div className="title-with-img">
                  <span className="icon-chip">★</span>
                  <h2>评分详情</h2>
                </div>
                <button 
                  className="rate-btn"
                  onClick={() => {
                    if (!user) {
                      navigate('/login', { state: { from: location } })
                      return
                    }
                    setShowRatingForm(!showRatingForm)
                    setRatingError('')
                  }}
                >
                  {showRatingForm ? '取消评分' : hasRated ? '修改评分' : '我要评分'}
                </button>
              </div>

              {ratingError && (
                <div className="error-message" style={{ marginTop: '10px' }}>
                  {ratingError}
                </div>
              )}

              {showRatingForm && (
                <RatingForm 
                  aiId={ai.id}
                  initialRatings={userRating?.scores}
                  onSubmit={(payload) => {
                    const result = submitRating(ai.id, payload)
                    if (result && result.error) {
                      setRatingError(result.error)
                      setTimeout(() => setRatingError(''), 3000)
                    } else {
                      setShowRatingForm(false)
                      setRatingError('')
                    }
                  }}
                />
              )}

              <div className="rating-breakdown">
                <div className="rating-item">
                  <span className="rating-label">万能性 / 广度</span>
                  <div className="rating-bar-container">
                    <div 
                      className="rating-bar"
                      style={{ width: `${(ai.ratings.versatility / 10) * 100}%` }}
                    />
                  </div>
                  <span className="rating-value">{ai.ratings.versatility}/10</span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">图像生成能力</span>
                  <div className="rating-bar-container">
                    <div 
                      className="rating-bar"
                      style={{ width: `${(ai.ratings.imageGeneration / 10) * 100}%` }}
                    />
                  </div>
                  <span className="rating-value">{ai.ratings.imageGeneration}/10</span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">信息查询能力</span>
                  <div className="rating-bar-container">
                    <div 
                      className="rating-bar"
                      style={{ width: `${(ai.ratings.informationQuery / 10) * 100}%` }}
                    />
                  </div>
                  <span className="rating-value">{ai.ratings.informationQuery}/10</span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">学习辅助能力</span>
                  <div className="rating-bar-container">
                    <div 
                      className="rating-bar"
                      style={{ width: `${(ai.ratings.studyAssistance / 10) * 100}%` }}
                    />
                  </div>
                  <span className="rating-value">{ai.ratings.studyAssistance}/10</span>
                </div>
                <div className="rating-item">
                  <span className="rating-label">性价比</span>
                  <div className="rating-bar-container">
                    <div 
                      className="rating-bar"
                      style={{ width: `${(ai.ratings.valueForMoney / 10) * 100}%` }}
                    />
                  </div>
                  <span className="rating-value">{ai.ratings.valueForMoney}/10</span>
                </div>
              </div>
            </section>

            <section className="rating-trend-section">
              <div className="title-with-img">
                <span className="icon-chip">📈</span>
                <h2>评分趋势</h2>
              </div>
              <RatingTrend trendData={ai.ratingTrend} />
            </section>

            <section className="tags-section">
              <div className="title-with-img">
                <span className="icon-chip">🏷️</span>
                <h2>标签</h2>
              </div>
              <TagInput 
                tags={ai.tags}
                userTags={userActivity.tags[ai.id] || []}
                onAddTag={(tag) => {
                  if (!user) {
                    navigate('/login', { state: { from: location } })
                    return
                  }
                  const result = addTag(ai.id, tag)
                  if (result && result.error) {
                    // 可以显示错误提示
                    console.log(result.error)
                  }
                }}
              />
            </section>

            <div className="section-header">
              <div className="title-with-img">
                <span className="icon-chip">💬</span>
                <h2>评论</h2>
              </div>
            </div>
            <CommentSection
              aiId={ai.id}
              comments={aiComments}
              onAddComment={(payload) => addComment(ai.id, payload)}
            />
          </div>

          <div className="detail-sidebar">
            <div className="sidebar-card">
              <h3>价格信息</h3>
              <p className="price-large">{ai.price}</p>
            </div>

            {ai.link && (
              <div className="sidebar-card">
                <h3>访问链接</h3>
                <a className="link-btn" href={ai.link} target="_blank" rel="noreferrer">
                  前往 {ai.name}
                </a>
              </div>
            )}

            <div className="sidebar-card">
              <h3>快速统计</h3>
              <div className="stat-item">
                <span>总评价数</span>
                <strong>{ai.ratingCount}</strong>
              </div>
              <div className="stat-item">
                <span>收藏数</span>
                <strong>{ai.favoriteCount || 0}</strong>
              </div>
              <div className="stat-item">
                <span>评论数</span>
                <strong>{aiComments.length}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AIDetail

