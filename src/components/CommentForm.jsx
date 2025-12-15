import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Image as ImageIcon, X } from 'lucide-react'
import { useAppContext } from '../context/AppContext'
import './CommentForm.css'

function CommentForm({ aiId, onSubmit }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppContext()
  const [content, setContent] = useState('')
  const [rating, setRating] = useState(0)
  const [images, setImages] = useState([])

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    // 在实际应用中，这里应该上传图片到服务器
    // 现在只是模拟，使用本地预览
    files.forEach(file => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages([...images, reader.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    if (!content.trim()) return
    
    onSubmit({
      content,
      rating,
      images
    })
    
    // 重置表单
    setContent('')
    setRating(0)
    setImages([])
  }

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label>评分（可选）</label>
        <div className="rating-selector">
          {[1, 2, 3, 4, 5].map(star => (
            <button
              key={star}
              type="button"
              className={`star-select ${rating >= star * 2 ? 'selected' : ''}`}
              onClick={() => setRating(star * 2)} // 一颗星=2分
            >
              ⭐
            </button>
          ))}
          {rating > 0 && <span className="rating-value-text">{rating}/10</span>}
        </div>
      </div>

      <div className="form-group">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论..."
          rows={6}
          className="comment-textarea"
          required
        />
      </div>

      <div className="form-group">
        <label className="image-upload-label">
          <ImageIcon size={20} />
          <span>上传图片</span>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="image-input"
          />
        </label>
        
        {images.length > 0 && (
          <div className="image-preview-list">
            {images.map((img, index) => (
              <div key={index} className="image-preview">
                <img src={img} alt={`预览 ${index + 1}`} />
                <button
                  type="button"
                  className="remove-image"
                  onClick={() => removeImage(index)}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-actions">
        <button type="submit" className="submit-btn">
          发布评论
        </button>
      </div>
    </form>
  )
}

export default CommentForm

