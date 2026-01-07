import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useMemo } from 'react'
import { Star, Heart, Building2 } from 'lucide-react'
import InteractiveRatingStars from './InteractiveRatingStars'
import TagList from './TagList'
import { useAppContext } from '../context/AppContext'
import './AICard.css'

function AICard({ ai }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, favoriteIds, userActivity, toggleFavorite, submitRating } = useAppContext()
  const isFavorite = favoriteIds.includes(ai.id)
  // 获取用户对该AI的评分（用于显示星星状态）
  const userRating = useMemo(() => {
    return userActivity.ratings.find(r => r.aiId === ai.id)
  }, [userActivity.ratings, ai.id])
  // 计算平均评分（10分制）
  const userAverageRating = useMemo(() => {
    if (!userRating) return null
    const scores = Object.values(userRating.scores)
    if (scores.length === 0) return null
    return scores.reduce((sum, val) => sum + val, 0) / scores.length
  }, [userRating])

  const handleFavoriteClick = (e) => {
    e.preventDefault()
    // 后端会验证登录
    toggleFavorite(ai.id)
  }

  const handleQuickRate = async (ratingValue) => {
    // 后端会验证登录
    // 快速评分只提交总评分（通用性评价）
    const ratingPayload = {
      overall: ratingValue  // 总评分，独立于五个细则
    }
    // 等待评分保存完成，确保状态更新
    await submitRating(ai.id, ratingPayload)
  }

  return (
    <>
    <Link to={`/ai/${ai.id}`} className="ai-card">
      <div className="ai-card-header">
        <div className="ai-info">
          <div className="ai-name-row">
            <h3 className="ai-name">{ai.name}</h3>
            <span className="ai-developer">
              <Building2 size={14} />
              {ai.developer || '未注明开发商'}
            </span>
          </div>
          <p className="ai-description">{ai.description}</p>
        </div>
        <button
          className={`favorite-btn ${isFavorite ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label="收藏"
        >
          <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="ai-rating">
          <InteractiveRatingStars 
            size={24} 
            onRate={handleQuickRate}
            userRating={userAverageRating}
          />
          <div className="rating-meta">
          <span className="score-value">{ai.averageScore.toFixed(1)}</span>
        <span className="rating-count">({ai.ratingCount} 评价)</span>
          </div>
      </div>

      <div className="ai-details">
        <div className="detail-item">
          <span className="detail-label">万能性:</span>
          <span className="detail-value">{Number(ai.ratings.versatility).toFixed(1)}/10</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">图像生成:</span>
          <span className="detail-value">{Number(ai.ratings.imageGeneration).toFixed(1)}/10</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">信息查询:</span>
          <span className="detail-value">{Number(ai.ratings.informationQuery).toFixed(1)}/10</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">学习辅助:</span>
          <span className="detail-value">{Number(ai.ratings.studyAssistance).toFixed(1)}/10</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">性价比:</span>
          <span className="detail-value">{Number(ai.ratings.valueForMoney).toFixed(1)}/10</span>
        </div>
      </div>

      <TagList tags={ai.tags} />

      <div className="ai-footer">
        <span className="price">{ai.price}</span>
        <span className="reactions">
          👍 {ai.reactions.thumbUp} · 🤯 {ai.reactions.amazing} · 😭 {ai.reactions.bad}
        </span>
      </div>
    </Link>
    </>
  )
}

export default AICard

