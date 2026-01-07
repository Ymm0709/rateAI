import './TagList.css'

function TagList({ tags }) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="tag-list">
      {tags.slice(0, 5).map((tag, index) => {
        // 处理标签：可能是对象 {tag_name, count} 或字符串
        const tagName = typeof tag === 'string' ? tag : (tag.tag_name || tag.name || String(tag))
        const tagCount = typeof tag === 'object' && tag.count ? tag.count : null
        const tagKey = typeof tag === 'object' && tag.tag_id ? tag.tag_id : index
        
        return (
          <span key={tagKey} className="tag">
            {tagName}
            {tagCount && tagCount > 1 && (
              <span className="tag-count">({tagCount})</span>
            )}
          </span>
        )
      })}
      {tags.length > 5 && (
        <span className="tag more">+{tags.length - 5}</span>
      )}
    </div>
  )
}

export default TagList

