import { X } from 'lucide-react'
import './FilterPanel.css'

const POPULAR_TAGS = ['万能', '最适合学生', '做PPT很强', '画图一流', '难用', '贵但好用', '免费', '中文友好', '长文本', '多模态']

function FilterPanel({ filters, onFiltersChange, onClose }) {
  const toggleTag = (tag) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag]
    onFiltersChange({ ...filters, tags: newTags })
  }

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>筛选条件</h3>
        <button onClick={onClose} className="close-btn">
          <X size={20} />
        </button>
      </div>

      <div className="filter-section">
        <label className="filter-label">标签</label>
        <div className="tag-list">
          {POPULAR_TAGS.map(tag => (
            <button
              key={tag}
              className={`tag-btn ${filters.tags.includes(tag) ? 'active' : ''}`}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">最低评分</label>
        <div className="score-filter">
          <input
            type="range"
            min="0"
            max="5"
            step="0.5"
            value={filters.minScore}
            onChange={(e) => onFiltersChange({ ...filters, minScore: parseFloat(e.target.value) })}
            className="score-slider"
          />
          <span className="score-value">{filters.minScore.toFixed(1)}</span>
        </div>
      </div>

      <div className="filter-section">
        <label className="filter-label">排序</label>
        <select
          className="sort-select"
          value={filters.sortBy}
          onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
        >
          <option value="score">按综合评分</option>
          <option value="ratingCount">按评分数量</option>
          <option value="name">按名称</option>
        </select>
      </div>

      <div className="filter-actions">
        <button 
          className="reset-btn"
          onClick={() => onFiltersChange({ tags: [], minScore: 0, sortBy: 'score' })}
        >
          重置
        </button>
      </div>
    </div>
  )
}

export default FilterPanel

