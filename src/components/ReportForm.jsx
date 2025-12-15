import { useState } from 'react'
import { X } from 'lucide-react'
import './ReportForm.css'

const REPORT_REASONS = [
  { value: 'spam', label: '垃圾信息/广告' },
  { value: 'fake', label: '虚假信息' },
  { value: 'inappropriate', label: '不当内容' },
  { value: 'copyright', label: '版权问题' },
  { value: 'other', label: '其他原因' }
]

function ReportForm({ type, targetName, onClose, onSubmit }) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!reason) {
      setError('请选择举报原因')
      return
    }

    if (reason === 'other' && !description.trim()) {
      setError('请填写详细的举报原因')
      return
    }

    onSubmit({
      reason,
      description: description.trim(),
      type, // 'ai' 或 'comment'
      targetName
    })

    // 重置表单并关闭
    setReason('')
    setDescription('')
    onClose()
  }

  return (
    <div className="report-modal-overlay" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <h3>举报 {type === 'ai' ? 'AI工具' : '评论'}</h3>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form className="report-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>举报原因 <span className="required">*</span></label>
            <div className="reason-options">
              {REPORT_REASONS.map(option => (
                <label key={option.value} className="reason-option">
                  <input
                    type="radio"
                    name="reason"
                    value={option.value}
                    checked={reason === option.value}
                    onChange={(e) => setReason(e.target.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>
              详细描述 {reason === 'other' && <span className="required">*</span>}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={reason === 'other' ? '请详细描述举报原因...' : '请提供更多详细信息（可选）...'}
              rows={5}
              className="report-textarea"
              required={reason === 'other'}
            />
            <p className="form-hint">
              您正在举报：<strong>{targetName}</strong>
            </p>
          </div>

          <div className="form-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              取消
            </button>
            <button type="submit" className="submit-btn">
              提交举报
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ReportForm

