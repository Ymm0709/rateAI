import { Star } from 'lucide-react'
import './RatingStars.css'

function RatingStars({ score, size = 20 }) {
  // 一颗星代表2分，所以5颗星=10分
  // score是10分制的，需要转换为5颗星的显示
  const starScore = score / 2 // 将10分制转换为5星制
  const fullStars = Math.floor(starScore)
  const hasHalfStar = starScore % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  return (
    <div className="rating-stars">
      {[...Array(fullStars)].map((_, i) => (
        <div key={`full-${i}`} className="star-wrapper" style={{ width: size, height: size }}>
          <Star size={size} fill="currentColor" className="star filled" />
        </div>
      ))}
      {hasHalfStar && (
        <div className="star-wrapper star half" style={{ width: size, height: size }}>
          <Star size={size} fill="currentColor" className="star filled" />
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <div key={`empty-${i}`} className="star-wrapper" style={{ width: size, height: size }}>
          <Star size={size} className="star empty" />
        </div>
      ))}
    </div>
  )
}

export default RatingStars

