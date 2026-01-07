import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Plus } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import './TagInput.css'

// 预定义的标签列表（与FilterPanel保持一致）
const ALLOWED_TAGS = ['万能', '最适合学生', '做PPT很强', '画图一流', '难用', '贵但好用', '免费', '中文友好', '长文本', '多模态']

function TagInput({ tags = [], onAddTag, onRemoveTag }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppContext()
  const [inputValue, setInputValue] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [tagError, setTagError] = useState('')

  const handleAddTag = (tagName) => {
    // 后端会验证登录
    const trimmedTag = tagName.trim()
    if (!trimmedTag) return
    
    if (!ALLOWED_TAGS.includes(trimmedTag)) {
      setTagError(`标签必须是以下之一：${ALLOWED_TAGS.join('、')}`)
      setTimeout(() => setTagError(''), 3000)
      return
    }
    
    if (tags.includes(trimmedTag)) {
      setTagError('该标签已存在')
      setTimeout(() => setTagError(''), 2000)
      return
    }
    
    onAddTag?.(trimmedTag)
    setInputValue('')
    setShowInput(false)
    setTagError('')
  }

  const handleShowInput = () => {
    // 后端会验证登录
    setShowInput(true)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag(inputValue)
    } else if (e.key === 'Escape') {
      setShowInput(false)
      setInputValue('')
      setTagError('')
    }
  }

  return (
    <div className="tag-input-container">
      <div className="tags-display">
        {tags.map((tag, index) => {
          // 处理标签：可能是对象 {tag_name, count} 或字符串
          const tagName = typeof tag === 'string' ? tag : (tag.tag_name || tag.name || String(tag))
          const tagCount = typeof tag === 'object' && tag.count ? tag.count : null
          const tagKey = typeof tag === 'object' && tag.tag_id ? tag.tag_id : index
          
          return (
            <span key={tagKey} className="tag-display">
              {tagName}
              {tagCount && tagCount > 1 && (
                <span className="tag-count">({tagCount})</span>
              )}
              {onRemoveTag && (
                <button
                  className="tag-remove"
                  onClick={() => onRemoveTag(tagName)}
                >
                  <X size={14} />
                </button>
              )}
            </span>
          )
        })}
        
        {!showInput ? (
          <div>
            <button
              className="add-tag-btn"
              onClick={handleShowInput}
            >
              <Plus size={16} />
              添加标签
            </button>
            <div className="tag-hint" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              可选标签：{ALLOWED_TAGS.join('、')}
            </div>
          </div>
        ) : (
          <div className="tag-input-wrapper">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value)
                setTagError('')
              }}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                if (!inputValue.trim()) {
                  setShowInput(false)
                  setTagError('')
                }
              }}
              placeholder={`输入标签（${ALLOWED_TAGS.join('、')}）`}
              className="tag-input"
              autoFocus
              list="tag-suggestions"
            />
            <datalist id="tag-suggestions">
              {ALLOWED_TAGS.filter(tag => !tags.includes(tag)).map(tag => (
                <option key={tag} value={tag} />
              ))}
            </datalist>
            <button
              type="button"
              className="tag-confirm"
              onClick={() => handleAddTag(inputValue)}
            >
              添加
            </button>
          </div>
        )}
        {tagError && (
          <div style={{ color: 'var(--error)', fontSize: '12px', marginTop: '8px' }}>
            {tagError}
          </div>
        )}
      </div>
    </div>
  )
}

export default TagInput

