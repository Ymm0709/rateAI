import { useState } from 'react'
import { Star } from 'lucide-react'
import './RatingForm.css'

function RatingForm({ aiId, onSubmit, initialRatings }) {
  const [ratings, setRatings] = useState({
    overall: initialRatings?.overall || 0, // 总评分（通用性评价）
    versatility: initialRatings?.versatility || 0,
    imageGeneration: initialRatings?.imageGeneration || 0,
    informationQuery: initialRatings?.informationQuery || 0,
    studyAssistance: initialRatings?.studyAssistance || 0,
    valueForMoney: initialRatings?.valueForMoney || 0
  })

  const [hoveredRating, setHoveredRating] = useState({})

  const handleRatingChange = (category, value) => {
    setRatings({ ...ratings, [category]: value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(ratings)
  }

  const RatingInput = ({ label, category }) => {
    const value = ratings[category]
    // 一颗星=2分，所以value是10分制的，需要转换为星数显示
    const starValue = value / 2
    const hovered = hoveredRating[category] || starValue

    return (
      <div className="rating-input-group">
        <label className="rating-label">{label}</label>
        <div className="star-rating">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className="star-btn"
              onMouseEnter={() => setHoveredRating({ ...hoveredRating, [category]: star })}
              onMouseLeave={() => setHoveredRating({ ...hoveredRating, [category]: 0 })}
              onClick={() => handleRatingChange(category, star * 2)} // 一颗星=2分
            >
              <Star
                size={28}
                fill={star <= hovered ? 'currentColor' : 'none'}
                className={star <= hovered ? 'filled' : 'empty'}
              />
            </button>
          ))}
          {value > 0 && <span className="rating-value-text">{value}/10</span>}
        </div>
      </div>
    )
  }

  return (
    <form className="rating-form" onSubmit={handleSubmit}>
      <div style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid var(--border)' }}>
        <RatingInput label="总体评价（通用性）" category="overall" />
        <p style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          这是对该AI模型的总体通用性评价，与下面的五个细则评分无关
        </p>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px' }}>
          详细评分（可选）
        </h3>
        <p style={{ marginBottom: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}>
          以下五个方面的评分可以单独打分，每个评分独立计算平均值
        </p>
      </div>
      
      <RatingInput label="万能性 / 广度" category="versatility" />
      <RatingInput label="图像生成能力" category="imageGeneration" />
      <RatingInput label="信息查询能力" category="informationQuery" />
      <RatingInput label="学习辅助能力" category="studyAssistance" />
      <RatingInput label="性价比" category="valueForMoney" />

      <div className="form-actions">
        <button type="submit" className="submit-btn">
          提交评分
        </button>
      </div>
    </form>
  )
}

export default RatingForm

