import './ReactionButtons.css'

function ReactionButtons({ reactions, aiId, userReaction, onReaction }) {
  const handleReaction = async (type) => {
    // 后端会验证登录
    // 如果用户已经反应过，且点击的是同一个反应，则取消
    // 如果用户已经反应过，但点击的是不同的反应，则替换为新的反应类型
    await onReaction?.(type)
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

