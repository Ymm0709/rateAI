import './TagList.css'

function TagList({ tags }) {
  if (!tags || tags.length === 0) return null

  return (
    <div className="tag-list">
      {tags.slice(0, 5).map((tag, index) => (
        <span key={index} className="tag">
          {tag}
        </span>
      ))}
      {tags.length > 5 && (
        <span className="tag more">+{tags.length - 5}</span>
      )}
    </div>
  )
}

export default TagList

