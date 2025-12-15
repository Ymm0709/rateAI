import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Star, Heart, Building2 } from 'lucide-react'
import InteractiveRatingStars from './InteractiveRatingStars'
import TagList from './TagList'
import { useAppContext } from '../context/AppContext'
import './AICard.css'

function AICard({ ai }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, favoriteIds, toggleFavorite, submitRating } = useAppContext()
  const isFavorite = favoriteIds.includes(ai.id)

  const handleFavoriteClick = (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    toggleFavorite(ai.id)
  }

  const handleQuickRate = (ratingValue) => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    // 将总体评分转换为各维度评分
    const ratingPayload = {
      versatility: ratingValue,
      imageGeneration: ratingValue,
      informationQuery: ratingValue,
      studyAssistance: ratingValue,
      valueForMoney: ratingValue
    }
    submitRating(ai.id, ratingPayload)
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
          />
          <div className="rating-meta">
          <span className="score-value">{ai.averageScore.toFixed(1)}</span>
        <span className="rating-count">({ai.ratingCount} 评价)</span>
          </div>
      </div>

      <div className="ai-details">
        <div className="detail-item">
          <span className="detail-label">万能性:</span>
            <span className="detail-value">{ai.ratings.versatility}/10</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">图像生成:</span>
            <span className="detail-value">{ai.ratings.imageGeneration}/10</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">信息查询:</span>
            <span className="detail-value">{ai.ratings.informationQuery}/10</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">学习辅助:</span>
            <span className="detail-value">{ai.ratings.studyAssistance}/10</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">性价比:</span>
            <span className="detail-value">{ai.ratings.valueForMoney}/10</span>
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

