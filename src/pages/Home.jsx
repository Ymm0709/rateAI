import { useMemo, useState } from 'react'
import { Filter, ArrowUpAZ, ArrowDownAZ, Sparkles } from 'lucide-react'
import AICard from '../components/AICard'
import SearchBar from '../components/SearchBar'
import FilterPanel from '../components/FilterPanel'
import { useAppContext } from '../context/AppContext'
import './Home.css'

function Home() {
  const { ais } = useAppContext()
  const [searchQuery, setSearchQuery] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    tags: [],
    minScore: 0,
    sortBy: 'alpha'
  })

  // 调试信息
  console.log('[Home] 当前AI数据:', {
    count: ais.length,
    ais: ais.slice(0, 2), // 只显示前两条用于调试
    isEmpty: ais.length === 0
  })

  const filteredAIs = useMemo(() => {
    const search = searchQuery.trim().toLowerCase()
    const matched = ais.filter((ai) => {
      const matchesSearch =
        ai.name.toLowerCase().includes(search) ||
        ai.developer?.toLowerCase().includes(search) ||
        ai.tags.some((tag) => {
          const tagName = typeof tag === 'string' ? tag : (tag.tag_name || tag.name || String(tag))
          return tagName.toLowerCase().includes(search)
        })

      const matchesTags =
        filters.tags.length === 0 || filters.tags.some((filterTag) => 
          ai.tags.some((tag) => {
            const tagName = typeof tag === 'string' ? tag : (tag.tag_name || tag.name || String(tag))
            return tagName === filterTag
          })
        )

      const matchesScore = ai.averageScore >= filters.minScore

      return matchesSearch && matchesTags && matchesScore
    })

    return matched.sort((a, b) => {
      if (filters.sortBy === 'alpha') {
      return a.name.localeCompare(b.name)
      }
      if (filters.sortBy === 'ratingCount') {
        return b.ratingCount - a.ratingCount
      }
      return 0
    })
  }, [ais, filters.minScore, filters.sortBy, filters.tags, searchQuery])

  return (
    <div className="home">
      <div className="container">
        <div className="home-header">
          <div className="hero-content">
            <div className="hero-icon">
              <Sparkles size={48} />
            </div>
            <h1>AI "监视器"</h1>
            <p className="subtitle">
              探索、评价、分享你最喜欢的 AI 工具。直接点击星星即可快速评分！
            </p>
          </div>
        </div>

        <div className="search-section">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="搜索 AI 名称、标签或开发商..."
          />
          <div className="search-actions">
            <button 
              className="filter-toggle" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter size={20} />
              筛选
            </button>
            <button
              className="filter-toggle ghost"
              onClick={() => {
                setFilters((prev) => ({
                  ...prev,
                  sortBy: prev.sortBy === 'alpha' ? 'ratingCount' : 'alpha'
                }))
              }}
            >
              {filters.sortBy === 'alpha' ? '按字母' : '按热度'}
            </button>
          </div>
        </div>

        {showFilters && (
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            onClose={() => setShowFilters(false)}
          />
        )}

        <div className="ai-grid">
          {filteredAIs.map((ai) => (
            <AICard key={ai.id} ai={ai} />
          ))}
        </div>

        {filteredAIs.length === 0 && (
          <div className="empty-state">
            <p>没有找到匹配的 AI</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Home


