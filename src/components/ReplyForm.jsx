import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppContext } from '../context/AppContext'
import './ReplyForm.css'

function ReplyForm({ parentId, replyToAuthor, onCancel, onSubmit }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppContext()
  const [content, setContent] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    // 后端会验证登录
    if (!content.trim()) return
    
    onSubmit({
      content: content.trim(),
      parentId,
      replyToAuthor
    })
    
    // 重置表单
    setContent('')
  }

  return (
    <form className="reply-form" onSubmit={handleSubmit}>
      <div className="reply-form-content">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={replyToAuthor ? `回复 @${replyToAuthor}...` : '写下你的回复...'}
          rows={3}
          className="reply-textarea"
          required
        />
      </div>
      <div className="reply-form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="submit-reply-btn">
          发布回复
        </button>
      </div>
    </form>
  )
}

export default ReplyForm

