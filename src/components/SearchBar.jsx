import { Search } from 'lucide-react'
import './SearchBar.css'

function SearchBar({ value, onChange, placeholder = "搜索..." }) {
  return (
    <div className="search-bar">
      <Search className="search-icon" size={20} />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="search-input"
      />
    </div>
  )
}

export default SearchBar

