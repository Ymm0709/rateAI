import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { X, Plus } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import './TagInput.css'

function TagInput({ tags = [], onAddTag, onRemoveTag }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppContext()
  const [inputValue, setInputValue] = useState('')
  const [showInput, setShowInput] = useState(false)

  const handleAddTag = () => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (inputValue.trim() && !tags.includes(inputValue.trim())) {
      onAddTag?.(inputValue.trim())
      setInputValue('')
      setShowInput(false)
    }
  }

  const handleShowInput = () => {
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    setShowInput(true)
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    } else if (e.key === 'Escape') {
      setShowInput(false)
      setInputValue('')
    }
  }

  return (
    <div className="tag-input-container">
      <div className="tags-display">
        {tags.map((tag, index) => (
          <span key={index} className="tag-display">
            {tag}
            {onRemoveTag && (
              <button
                className="tag-remove"
                onClick={() => onRemoveTag(tag)}
              >
                <X size={14} />
              </button>
            )}
          </span>
        ))}
        
        {!showInput ? (
          <button
            className="add-tag-btn"
            onClick={handleShowInput}
          >
            <Plus size={16} />
            添加标签
          </button>
        ) : (
          <div className="tag-input-wrapper">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              onBlur={() => {
                if (!inputValue.trim()) {
                  setShowInput(false)
                }
              }}
              placeholder="输入标签..."
              className="tag-input"
              autoFocus
            />
            <button
              type="button"
              className="tag-confirm"
              onClick={handleAddTag}
            >
              添加
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TagInput

