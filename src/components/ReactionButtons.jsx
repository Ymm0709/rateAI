import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import './ReactionButtons.css'

function ReactionButtons({ reactions, aiId, userReaction, onReaction }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppContext()

  const handleReaction = (type) => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    // 如果用户已经反应过，且点击的是同一个反应，则取消
    // 如果用户已经反应过，但点击的是不同的反应，则不允许更改
    if (userReaction && userReaction !== type) {
      return // 不允许更改反应
    }
    onReaction?.(type)
  }

  return (
    <div className="reaction-buttons">
      <button
        className={`reaction-btn ${userReaction === 'thumbUp' ? 'active' : ''}`}
        onClick={() => handleReaction('thumbUp')}
        disabled={userReaction && userReaction !== 'thumbUp'}
      >
        👍 <span>{reactions.thumbUp || 0}</span>
      </button>
      <button
        className={`reaction-btn ${userReaction === 'thumbDown' ? 'active' : ''}`}
        onClick={() => handleReaction('thumbDown')}
        disabled={userReaction && userReaction !== 'thumbDown'}
      >
        👎 <span>{reactions.thumbDown || 0}</span>
      </button>
      <button
        className={`reaction-btn ${userReaction === 'amazing' ? 'active' : ''}`}
        onClick={() => handleReaction('amazing')}
        disabled={userReaction && userReaction !== 'amazing'}
      >
        🤯 <span>{reactions.amazing || 0}</span>
      </button>
      <button
        className={`reaction-btn ${userReaction === 'bad' ? 'active' : ''}`}
        onClick={() => handleReaction('bad')}
        disabled={userReaction && userReaction !== 'bad'}
      >
        😭 <span>{reactions.bad || 0}</span>
      </button>
    </div>
  )
}

export default ReactionButtons

