import { useState } from 'react'
import { Star } from 'lucide-react'
import './RatingForm.css'

function RatingForm({ aiId, onSubmit, initialRatings }) {
  const [ratings, setRatings] = useState({
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

