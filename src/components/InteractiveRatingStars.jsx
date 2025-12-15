import { useState } from 'react'
import { Star } from 'lucide-react'
import './InteractiveRatingStars.css'

function InteractiveRatingStars({ size = 24, onRate, disabled = false }) {
  // 星星默认不填充，用户点击后才变色
  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedStar, setSelectedStar] = useState(0)

  const handleStarClick = (e, starIndex) => {
    if (!onRate) return
    e.preventDefault()
    e.stopPropagation()
    const newSelectedStar = starIndex + 1
    setSelectedStar(newSelectedStar)
    const ratingValue = newSelectedStar * 2 // 一颗星=2分
    onRate(ratingValue)
  }

  const displayStar = starIndex => {
    // 优先显示hover，其次显示已选择
    const displayCount = hoveredStar || selectedStar
    return starIndex < displayCount
  }

  return (
    <div
      className="interactive-rating-stars"
      onClick={(e) => {
        // 阻止事件冒泡到外层 Link，防止跳转
        e.preventDefault()
        e.stopPropagation()
      }}
    >
      {[0, 1, 2, 3, 4].map((starIndex) => (
        <button
          key={starIndex}
          type="button"
          className={`star-btn ${displayStar(starIndex) ? 'filled' : 'empty'}`}
          style={{ width: size, height: size }}
          onMouseEnter={() => !disabled && setHoveredStar(starIndex + 1)}
          onMouseLeave={() => setHoveredStar(0)}
          onClick={(e) => handleStarClick(e, starIndex)}
          disabled={disabled || !onRate}
          title={onRate ? `评分 ${(starIndex + 1) * 2}/10` : '登录后评分'}
        >
          <Star size={size} fill={displayStar(starIndex) ? 'currentColor' : 'none'} />
        </button>
      ))}
    </div>
  )
}

export default InteractiveRatingStars

