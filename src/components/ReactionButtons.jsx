import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import './ReactionButtons.css'

function ReactionButtons({ reactions, onReaction }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppContext()
  const [userReactions, setUserReactions] = useState({
    thumbUp: false,
    thumbDown: false,
    amazing: false,
    bad: false
  })

  const handleReaction = (type) => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    setUserReactions({
      ...userReactions,
      [type]: !userReactions[type]
    })
    onReaction?.(type)
  }

  return (
    <div className="reaction-buttons">
      <button
        className={`reaction-btn ${userReactions.thumbUp ? 'active' : ''}`}
        onClick={() => handleReaction('thumbUp')}
      >
        👍 <span>{reactions.thumbUp || 0}</span>
      </button>
      <button
        className={`reaction-btn ${userReactions.thumbDown ? 'active' : ''}`}
        onClick={() => handleReaction('thumbDown')}
      >
        👎 <span>{reactions.thumbDown || 0}</span>
      </button>
      <button
        className={`reaction-btn ${userReactions.amazing ? 'active' : ''}`}
        onClick={() => handleReaction('amazing')}
      >
        🤯 <span>{reactions.amazing || 0}</span>
      </button>
      <button
        className={`reaction-btn ${userReactions.bad ? 'active' : ''}`}
        onClick={() => handleReaction('bad')}
      >
        😭 <span>{reactions.bad || 0}</span>
      </button>
    </div>
  )
}

export default ReactionButtons

