import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Trophy, Star, DollarSign, GraduationCap } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import RatingStars from '../components/RatingStars'
import './Rankings.css'

const RANKING_TYPES = [
  { id: 'overall', name: '综合排行榜', icon: Trophy },
  { id: 'students', name: '最适合学生', icon: GraduationCap },
  { id: 'value', name: '性价比最高', icon: DollarSign },
  { id: 'image', name: '最佳图像生成', icon: Star },
]

function Rankings() {
  const { ais } = useAppContext()
  const [selectedType, setSelectedType] = useState('overall')

  // 进入排行榜页面时滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [selectedType])

  const getRankedAIs = () => {
    const sorted = [...ais]
    const valueScore = (ai) => ai.ratings.valueForMoney / (ai.price.includes('免费') ? 1 : 5)
    
    switch (selectedType) {
      case 'overall':
        return sorted.sort((a, b) => b.averageScore - a.averageScore)
      case 'students':
        return sorted.sort((a, b) => b.ratings.studyAssistance - a.ratings.studyAssistance)
      case 'value':
        return sorted.sort((a, b) => valueScore(b) - valueScore(a))
      case 'image':
        return sorted.sort((a, b) => b.ratings.imageGeneration - a.ratings.imageGeneration)
      default:
        return sorted
    }
  }

  const rankedAIs = getRankedAIs()

  return (
    <div className="rankings">
      <div className="container">
        <div className="rankings-header">
          <div className="title-with-img">
            <img src="https://via.placeholder.com/48x48?text=R" alt="排行榜图标占位" />
            <h1>AI 排行榜</h1>
          </div>
          <p className="subtitle">发现最受欢迎的 AI 工具</p>
        </div>

        <div className="ranking-tabs">
          {RANKING_TYPES.map(type => {
            const Icon = type.icon
            return (
              <button
                key={type.id}
                className={`ranking-tab ${selectedType === type.id ? 'active' : ''}`}
                onClick={() => setSelectedType(type.id)}
              >
                <Icon size={20} />
                {type.name}
              </button>
            )
          })}
        </div>

        <div className="rankings-list">
          {rankedAIs.map((ai, index) => (
            <div key={ai.id} className="ranking-item">
              <div className="rank-number">
                {index < 3 ? (
                  <span className={`medal medal-${index + 1}`}>
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </span>
                ) : (
                  <span className="rank-text">#{index + 1}</span>
                )}
              </div>
              <Link to={`/ai/${ai.id}`} className="ranking-card">
                <div className="ranking-card-header">
                  <div className="ranking-card-info">
                    <h3 className="ranking-card-name">{ai.name}</h3>
                    <div className="ranking-card-details">
                      <div className="ranking-detail-item">
                        <span className="detail-label">万能性:</span>
                        <span className="detail-value">{ai.ratings.versatility}/10</span>
                      </div>
                      <div className="ranking-detail-item">
                        <span className="detail-label">学习辅助:</span>
                        <span className="detail-value">{ai.ratings.studyAssistance}/10</span>
                      </div>
                      <div className="ranking-detail-item">
                        <span className="detail-label">性价比:</span>
                        <span className="detail-value">{ai.ratings.valueForMoney}/10</span>
                      </div>
                    </div>
                  </div>
                  <div className="ranking-card-rating">
                    <RatingStars score={ai.averageScore} size={16} />
                    <span className="ranking-card-score">{ai.averageScore.toFixed(1)}</span>
                    <span className="ranking-card-count">({ai.ratingCount})</span>
                  </div>
                </div>
                <div className="ranking-card-footer">
                  <span className="ranking-card-price">{ai.price}</span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Rankings

