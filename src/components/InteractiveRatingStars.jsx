import { useState, useEffect } from 'react'
import { Star } from 'lucide-react'
import './InteractiveRatingStars.css'

function InteractiveRatingStars({ size = 24, onRate, disabled = false, userRating = null }) {
  // 星星默认不填充，用户点击后才变色
  const [hoveredStar, setHoveredStar] = useState(0)
  const [selectedStar, setSelectedStar] = useState(() => {
    // 初始化时根据userRating设置选中状态
    if (userRating) {
      return Math.round(userRating / 2)
    }
    return 0
  })
  
  // 当userRating prop变化时更新选中状态
  useEffect(() => {
    if (userRating !== null && userRating !== undefined && userRating > 0) {
      // userRating是10分制的，需要转换为星数（1-5）
      const starCount = Math.round(userRating / 2)
      setSelectedStar(starCount)
    } else if ((userRating === null || userRating === 0) && selectedStar > 0) {
      // 如果userRating变为null或0（用户取消了评分），重置选中状态
      setSelectedStar(0)
    }
  }, [userRating])

  const handleStarClick = (e, starIndex) => {
    if (!onRate) return
    e.preventDefault()
    e.stopPropagation()
    const newSelectedStar = starIndex + 1
    setSelectedStar(newSelectedStar) // 立即更新本地状态
    const ratingValue = newSelectedStar * 2 // 一颗星=2分
    onRate(ratingValue)
  }

  const displayStar = starIndex => {
    // 优先显示hover，其次显示已选择（包括用户之前的评分）
    const displayCount = hoveredStar || selectedStar
    return starIndex < displayCount
  }
  
  // 如果有用户评分，星星应该显示为蓝色（已评分状态）
  const isRated = selectedStar > 0

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
          className={`star-btn ${displayStar(starIndex) ? 'filled' : 'empty'} ${isRated ? 'rated' : ''}`}
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

