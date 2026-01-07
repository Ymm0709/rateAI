import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { apiRequest } from '../utils/api'

const AppContext = createContext(null)

// 从localStorage加载用户数据
const loadUserFromStorage = () => {
  try {
    const stored = localStorage.getItem('rateAI_user')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function AppProvider({ children }) {
  const [ais, setAIs] = useState([])
  const [comments, setComments] = useState([])
  const storedUser = loadUserFromStorage()
  const [user, setUser] = useState(storedUser)
  const [favoriteIds, setFavoriteIds] = useState(storedUser?.favoriteIds || [])
  const [userActivity, setUserActivity] = useState(() => {
    // 从localStorage加载用户活动数据
    if (storedUser && storedUser.userActivity) {
      return {
        ratings: storedUser.userActivity.ratings || [],
        comments: storedUser.userActivity.comments || [],
        reactions: storedUser.userActivity.reactions || {},
        tags: storedUser.userActivity.tags || {}
      }
    }
    return {
      ratings: [],
      comments: [],
      reactions: {},
      tags: {}
    }
  })

  // 从后端加载初始数据
  useEffect(() => {
    const normalizeAI = (ai) => {
      // 辅助函数：安全地将值转换为数字
      const toNumber = (val, defaultValue = 0) => {
        if (val === null || val === undefined) return defaultValue
        const num = typeof val === 'string' ? parseFloat(val) : Number(val)
        return isNaN(num) ? defaultValue : num
      }
      
      return {
        id: ai.ai_id,
        name: ai.name || '',
        developer: ai.developer || '',
        description: ai.description || '',
        price: ai.price_text || ai.price || '—',
        link: ai.official_url || ai.link || '',
        averageScore: Number(toNumber(ai.avg_score, 0).toFixed(1)),
        ratingCount: toNumber(ai.rating_count, 0),
        favoriteCount: toNumber(ai.favorite_count, 0),
        ratings: {
          overall: toNumber(ai.overall_score, 0), // 总评分（通用性评价）
          versatility: toNumber(ai.versatility_score, 0),
          imageGeneration: toNumber(ai.image_generation_score, 0),
          informationQuery: toNumber(ai.information_query_score, 0),
          studyAssistance: toNumber(ai.study_assistance_score, 0),
          valueForMoney: toNumber(ai.value_for_money_score, 0)
        },
        tags: Array.isArray(ai.tags) 
          ? ai.tags.map(t => {
              // 处理标签：可能是对象 {tag_id, tag_name, count} 或字符串
              if (typeof t === 'string') return { tag_name: t, count: 1 }
              if (t && typeof t === 'object') {
                return {
                  tag_id: t.tag_id,
                  tag_name: t.tag_name || t.name || String(t),
                  count: t.count || 1
                }
              }
              return { tag_name: String(t), count: 1 }
            }).filter(Boolean) // 过滤掉空值
          : [],
        reactions: {
          thumbUp: toNumber(ai.reactions_thumb_up, 0),
          thumbDown: toNumber(ai.reactions_thumb_down, 0),
          amazing: toNumber(ai.reactions_amazing, 0),
          bad: toNumber(ai.reactions_bad, 0)
        },
        ratingTrend: ai.ratingTrend || []
      }
    }

    const normalizeComment = (c) => {
      // 如果用户被删除，user 可能为 null，但评论本身可能还在（这种情况不应该发生，因为设置了CASCADE）
      // 如果确实出现了，显示"已删除用户"
      let author = '已删除用户'
      if (c.user && c.user.username) {
        author = c.user.username
      } else if (c.user_id && !c.user) {
        // 如果只有 user_id 但没有 user 对象，说明用户可能被删除了
        author = '已删除用户'
      }
      
      return {
        id: c.comment_id,
        aiId: c.ai_id || (c.ai?.ai_id || (typeof c.ai === 'number' ? c.ai : parseInt(c.ai_id))),
        author: author,
        date: (c.created_at || '').slice(0, 10),
        rating: null,
        content: c.content || '',
        images: c.images || [],
        upvotes: c.upvotes || 0,
        helpful: false,
        notHelpful: false,
        replies: []
      }
    }

    const fetchInitialData = async () => {
      try {
        console.log('[AppContext] 开始加载数据...')
        
        const [aiRes, commentRes] = await Promise.all([
          fetch('/api/ais/', { credentials: 'include' }),
          fetch('/api/comments/', { credentials: 'include' })
        ])

        console.log('[AppContext] API响应状态:', {
          ais: { ok: aiRes.ok, status: aiRes.status, statusText: aiRes.statusText },
          comments: { ok: commentRes.ok, status: commentRes.status, statusText: commentRes.statusText }
        })

        if (aiRes.ok) {
          const aiData = await aiRes.json()
          console.log('[AppContext] 收到AI数据:', {
            type: typeof aiData,
            isArray: Array.isArray(aiData),
            length: Array.isArray(aiData) ? aiData.length : 'N/A',
            firstItem: Array.isArray(aiData) && aiData.length > 0 ? aiData[0] : null
          })
          
          if (!Array.isArray(aiData)) {
            console.error('[AppContext] 错误: AI数据不是数组!', aiData)
            setAIs([])
          } else {
            try {
              const mapped = aiData.map(normalizeAI)
              console.log('[AppContext] 转换后的AI数据:', {
                count: mapped.length,
                firstItem: mapped.length > 0 ? mapped[0] : null,
                sample: mapped.slice(0, 2)
              })
              setAIs(mapped)
              
              if (mapped.length === 0) {
                console.warn('[AppContext] 警告: AI数据数组为空（转换后）')
              } else {
                console.log('[AppContext] ✓ 成功加载', mapped.length, '条AI数据')
              }
            } catch (error) {
              console.error('[AppContext] 数据转换错误:', error)
              console.error('[AppContext] 错误的数据项:', aiData)
              setAIs([])
            }
          }
        } else {
          const errorText = await aiRes.text()
          console.error('[AppContext] AI数据加载失败:', {
            status: aiRes.status,
            statusText: aiRes.statusText,
            error: errorText
          })
        }

        if (commentRes.ok) {
          const commentData = await commentRes.json()
          console.log('[AppContext] 收到评论数据:', commentData)
          const mapped = Array.isArray(commentData) ? commentData.map(normalizeComment) : []
          console.log('[AppContext] 转换后的评论数据:', mapped)
          setComments(mapped)
        } else {
          const errorText = await commentRes.text()
          console.error('[AppContext] 评论数据加载失败:', {
            status: commentRes.status,
            statusText: commentRes.statusText,
            error: errorText
          })
        }
      } catch (err) {
        // 详细记录错误信息
        console.error('[AppContext] 加载初始数据失败:', {
          error: err,
          message: err.message,
          stack: err.stack,
          name: err.name
        })
        // 显示用户友好的错误提示
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
          console.error('[AppContext] 网络错误: 无法连接到后端服务器。请确保后端服务正在运行 (python3 manage.py runserver)')
        }
      }
    }

    fetchInitialData()
  }, [])

  // 初始化时加载用户数据并验证登录状态
  useEffect(() => {
    const verifyUser = async () => {
      try {
        const response = await fetch('/api/check-auth/', { credentials: 'include' })
        const data = await response.json()
        
        if (data.authenticated && data.user) {
          // Session有效，使用后端返回的用户信息
          const storedUser = loadUserFromStorage()
          const verifiedUser = {
            id: data.user.user_id,
            user_id: data.user.user_id,
            username: data.user.username,
            email: data.user.email,
            name: data.user.username,
            level: 1,
            avatar: data.user.avatar_url || null,
            createdAt: data.user.created_at,
            is_approved: data.user.is_approved,
            // 保留本地存储的收藏和活动数据（如果存在且用户ID匹配）
            favoriteIds: (storedUser && storedUser.user_id === data.user.user_id) 
              ? (storedUser.favoriteIds || []) 
              : [],
            userActivity: (storedUser && storedUser.user_id === data.user.user_id)
              ? {
                  ratings: storedUser.userActivity?.ratings || [],
                  comments: storedUser.userActivity?.comments || [],
                  reactions: storedUser.userActivity?.reactions || {},
                  tags: storedUser.userActivity?.tags || {}
                }
              : {
                  ratings: [],
                  comments: [],
                  reactions: {},
                  tags: {}
                },
            stats: {
              comments: 0,
              ratings: 0,
              favorites: 0,
              helpful: 0
            }
          }
          
          setUser(verifiedUser)
          setFavoriteIds(verifiedUser.favoriteIds)
          setUserActivity(verifiedUser.userActivity)
          
          // 从后端加载收藏列表
          try {
            const favResponse = await apiRequest('/api/favorites/list/', { method: 'GET' })
            if (favResponse.ok) {
              const favData = await favResponse.json()
              if (favData.success && favData.favorite_ids) {
                verifiedUser.favoriteIds = favData.favorite_ids
                setFavoriteIds(favData.favorite_ids)
              }
            }
          } catch (error) {
            // apiRequest会自动处理401跳转，这里只记录其他错误
            if (error.message !== '未登录，已跳转到登录页') {
              console.error('加载收藏列表失败:', error)
            }
          }
        } else {
          // Session无效，清除本地数据
          localStorage.removeItem('rateAI_user')
          setUser(null)
          setFavoriteIds([])
          setUserActivity({ ratings: [], comments: [], reactions: {}, tags: {} })
        }
      } catch (error) {
        // 网络错误时，尝试使用本地存储的数据（向后兼容）
        console.error('验证用户失败:', error)
        const storedUser = loadUserFromStorage()
        if (storedUser && storedUser.user_id) {
          setUser(storedUser)
          if (storedUser.favoriteIds) {
            setFavoriteIds(storedUser.favoriteIds)
          }
          if (storedUser.userActivity) {
            const restoredActivity = {
              ratings: storedUser.userActivity.ratings || [],
              comments: storedUser.userActivity.comments || [],
              reactions: storedUser.userActivity.reactions || {},
              tags: storedUser.userActivity.tags || {}
            }
            setUserActivity(restoredActivity)
          }
        }
      }
    }
    
    verifyUser()
  }, [])

  // 监听user变化，保存到localStorage（但不包括favoriteIds和userActivity，它们单独保存）
  useEffect(() => {
    if (user) {
      const userToSave = {
        ...user,
        favoriteIds,
        userActivity,
        stats: {
          comments: userActivity.comments.length,
          ratings: userActivity.ratings.length,
          favorites: favoriteIds.length,
          helpful: user?.stats?.helpful || 0
        }
      }
      localStorage.setItem('rateAI_user', JSON.stringify(userToSave))
    } else {
      localStorage.removeItem('rateAI_user')
    }
  }, [user, favoriteIds, userActivity])

  // 注册新用户
  const register = async (userData) => {
    try {
      const response = await fetch('/api/register/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: userData.username,
          email: userData.email,
          password: userData.password
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        // 转换后端数据格式为前端格式
        const newUser = {
          id: data.user.user_id,
          user_id: data.user.user_id,
          username: data.user.username,
          email: data.user.email,
          name: data.user.username,
          level: 1,
          avatar: data.user.avatar_url || null,
          createdAt: data.user.created_at,
          favoriteIds: [],
          userActivity: {
            ratings: [],
            comments: []
          },
          stats: {
            comments: 0,
            ratings: 0,
            favorites: 0,
            helpful: 0
          }
        }
        setUser(newUser)
        return { 
          success: true, 
          user: newUser,
          message: '注册成功'
        }
      } else {
        return { success: false, error: data.error || '注册失败' }
      }
    } catch (error) {
      console.error('注册错误:', error)
      // 提供更详细的错误信息
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: '无法连接到服务器，请检查后端服务是否运行' }
      }
      return { success: false, error: `网络错误：${error.message || '请重试'}` }
    }
  }

  // 登录
  const login = async (username, password) => {
    try {
      const response = await fetch('/api/login/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username,
          password: password
        })
      })

      // 检查响应状态
      let data
      try {
        data = await response.json()
      } catch (jsonError) {
        console.error('解析响应失败:', jsonError)
        // 如果无法解析JSON，根据状态码返回错误
        if (response.status >= 500) {
          return { success: false, error: '服务器错误，请稍后重试' }
        } else if (response.status === 401) {
          return { success: false, error: '用户名或密码错误' }
        } else {
          return { success: false, error: `登录失败 (状态码: ${response.status})` }
        }
      }

      // 检查响应是否成功
      if (!response.ok) {
        // 返回后端的具体错误信息
        return { success: false, error: data.error || data.detail || `登录失败 (状态码: ${response.status})` }
      }

      if (data.success) {
        // 转换后端数据格式为前端格式
        const userData = {
          id: data.user.user_id,
          user_id: data.user.user_id,
          username: data.user.username,
          email: data.user.email,
          name: data.user.username,
          level: 1,
          avatar: data.user.avatar_url || null,
          createdAt: data.user.created_at,
          is_approved: data.user.is_approved,
          favoriteIds: [],
          userActivity: {
            ratings: [],
            comments: []
          },
          stats: {
            comments: 0,
            ratings: 0,
            favorites: 0,
            helpful: 0
          }
        }
        
        // 从后端加载用户的收藏列表
        try {
          const favResponse = await apiRequest('/api/favorites/list/', { method: 'GET' })
          if (favResponse.ok) {
            const favData = await favResponse.json()
            if (favData.success && favData.favorite_ids) {
              userData.favoriteIds = favData.favorite_ids
              setFavoriteIds(favData.favorite_ids)
            }
          }
        } catch (error) {
          // apiRequest会自动处理401跳转，这里只记录其他错误
          if (error.message !== '未登录，已跳转到登录页') {
            console.error('加载收藏列表失败:', error)
          }
        }
        
        // 尝试从localStorage恢复用户的活动数据
        const storedUser = loadUserFromStorage()
        if (storedUser && storedUser.user_id === userData.user_id) {
          if (storedUser.userActivity) {
            userData.userActivity = storedUser.userActivity
            setUserActivity(storedUser.userActivity)
          }
        }
        
        setUser(userData)
        return { success: true, user: userData }
      } else {
        // 如果响应成功但data.success为false，返回错误信息
        return { success: false, error: data.error || data.detail || '登录失败，请重试' }
      }
    } catch (error) {
      console.error('登录错误:', error)
      // 提供更详细的错误信息
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: '无法连接到服务器，请检查后端服务是否运行' }
      }
      return { success: false, error: `网络错误：${error.message || '请重试'}` }
    }
  }

  // 登出
  const logout = async () => {
    try {
      await fetch('/api/logout/', {
        method: 'POST',
        credentials: 'include'
      })
    } catch (error) {
      console.error('登出失败:', error)
    } finally {
      setUser(null)
      setFavoriteIds([])
      setUserActivity({ ratings: [], comments: [] })
    }
  }

  // 更新用户信息
  const updateUser = (updates) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      return updated
    })
  }

  const toggleFavorite = async (aiId) => {
    // 移除前端检查，直接调用后端API，由后端验证
    try {
      const response = await apiRequest('/api/favorites/', {
        method: 'POST',
        body: JSON.stringify({
          ai_id: aiId
        })
      })

      if (!response.ok) {
        let data
        try {
          data = await response.json()
        } catch (e) {
          return { success: false, error: `操作失败 (状态码: ${response.status})` }
        }
        return { success: false, error: data.error || data.detail || '操作失败' }
      }

      const data = await response.json()

      // 更新前端状态
      setFavoriteIds((prev) => {
        return data.is_favorite 
          ? [...prev, aiId]
          : prev.filter((id) => id !== aiId)
      })

      // 更新AI的收藏数
      setAIs((prev) =>
        prev.map((ai) => {
          if (ai.id !== aiId) return ai
          return {
            ...ai,
            favoriteCount: data.is_favorite 
              ? (ai.favoriteCount || 0) + 1
              : Math.max(0, (ai.favoriteCount || 0) - 1)
          }
        })
      )

      return { success: true, is_favorite: data.is_favorite }
    } catch (error) {
      // 如果是因为未登录而跳转，不返回错误（用户已经被重定向）
      if (error.message === '未登录，已跳转到登录页') {
        return { success: false, error: null } // 返回null表示已跳转，不需要显示错误
      }
      console.error('收藏操作失败:', error)
      // 提供更详细的错误信息
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: '无法连接到服务器，请检查后端服务是否运行' }
      }
      return { success: false, error: `网络错误：${error.message || '请重试'}` }
    }
  }

  const addTag = async (aiId, tag) => {
    // 移除前端检查，直接调用后端API，由后端验证和检查重复
    try {
      const response = await apiRequest('/api/tags/add/', {
        method: 'POST',
        body: JSON.stringify({
          ai_id: aiId,
          tag_name: tag
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || '添加标签失败' }
      }

      // 更新本地状态 - 标签应该是字符串数组
      setAIs((prev) =>
        prev.map((ai) => {
          if (ai.id === aiId) {
            // 确保 tags 是字符串数组
            const currentTags = Array.isArray(ai.tags) 
              ? ai.tags.map(t => typeof t === 'string' ? t : (t.tag_name || t))
              : []
            // 检查标签是否已存在
            const tagName = typeof data.tag === 'object' ? data.tag.tag_name : (data.tag || tag)
            if (!currentTags.includes(tagName)) {
              return { ...ai, tags: [...currentTags, tagName] }
            }
          }
          return ai
        })
      )

      // 记录用户添加的标签
      setUserActivity((prev) => ({
        ...prev,
        tags: {
          ...prev.tags,
          [aiId]: [...userTags, tag]
        }
      }))

      return { success: true, tag: data.tag }
    } catch (error) {
      // 如果是因为未登录而跳转，不返回错误（用户已经被重定向）
      if (error.message === '未登录，已跳转到登录页') {
        return { success: false, error: null } // 返回null表示已跳转，不需要显示错误
      }
      console.error('添加标签失败:', error)
      return { success: false, error: '网络错误，请重试' }
    }
  }

  const addComment = async (aiId, payload) => {
    // 移除前端检查，直接调用后端API，由后端验证
    try {
      const response = await apiRequest('/api/comments/create/', {
        method: 'POST',
        body: JSON.stringify({
          ai_id: aiId,
          content: payload.content,
          images: payload.images || [],
          parent_comment_id: payload.parent_comment_id || null
        })
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || '发布评论失败' }
      }

      // 将后端返回的评论转换为前端格式
      const newComment = {
        id: data.comment.comment_id,
        aiId: data.comment.ai?.ai_id || data.comment.ai_id,
        author: data.comment.user?.username || user?.name || 'AI 探索者',
        date: data.comment.created_at ? data.comment.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
        rating: null, // 评论中没有评分，评分在Rating模型中
        content: data.comment.content || '',
        images: data.comment.images || payload.images || [],
        upvotes: data.comment.upvotes || 0,
        helpful: false,
        notHelpful: false,
        replies: []
      }

      // 更新本地状态
      setComments((prev) => [...prev, newComment])
      setUserActivity((prev) => ({
        ...prev,
        comments: [{ aiId, commentId: newComment.id, content: payload.content }, ...prev.comments]
      }))

      // 重新加载评论列表，确保获取最新数据
      try {
        const commentRes = await fetch('/api/comments/', { credentials: 'include' })
        if (commentRes.ok) {
          const commentData = await commentRes.json()
          const normalizeCommentForList = (c) => {
            // 如果用户被删除，显示"已删除用户"
            let author = '已删除用户'
            if (c.user && c.user.username) {
              author = c.user.username
            } else if (c.user_id && !c.user) {
              author = '已删除用户'
            }
            
            return {
              id: c.comment_id,
              aiId: typeof c.ai_id === 'number' ? c.ai_id : (c.ai?.ai_id || parseInt(c.ai_id)),
              author: author,
              date: (c.created_at || '').slice(0, 10),
              rating: null,
              content: c.content || '',
              images: c.images || [],
              upvotes: c.upvotes || 0,
              helpful: false,
              notHelpful: false,
              replies: []
            }
          }
          const mapped = Array.isArray(commentData) ? commentData.map(normalizeCommentForList) : []
          setComments(mapped)
        }
      } catch (error) {
        console.error('重新加载评论失败:', error)
      }

      return { success: true, comment: newComment }
    } catch (error) {
      // 如果是因为未登录而跳转，不返回错误（用户已经被重定向）
      if (error.message === '未登录，已跳转到登录页') {
        return { success: false, error: null } // 返回null表示已跳转，不需要显示错误
      }
      console.error('发布评论失败:', error)
      return { success: false, error: '网络错误，请重试' }
    }
  }

  const submitRating = async (aiId, ratingPayload) => {
    // 移除前端检查，直接调用后端API，由后端验证
    // 检查用户是否已经对该AI评分过（仅用于前端UI状态，不用于权限控制）
    const existingRatingIndex = userActivity.ratings.findIndex(r => r.aiId === aiId)
    const isUpdate = existingRatingIndex !== -1
    const oldRating = isUpdate ? userActivity.ratings[existingRatingIndex] : null

    // 准备提交数据（使用下划线命名，匹配后端API）
    const payload = {}
    if (ratingPayload.overall !== undefined && ratingPayload.overall > 0) {
      payload.overall_score = ratingPayload.overall
    }
    if (ratingPayload.versatility !== undefined && ratingPayload.versatility > 0) {
      payload.versatility_score = ratingPayload.versatility
    }
    if (ratingPayload.imageGeneration !== undefined && ratingPayload.imageGeneration > 0) {
      payload.image_generation_score = ratingPayload.imageGeneration
    }
    if (ratingPayload.informationQuery !== undefined && ratingPayload.informationQuery > 0) {
      payload.information_query_score = ratingPayload.informationQuery
    }
    if (ratingPayload.studyAssistance !== undefined && ratingPayload.studyAssistance > 0) {
      payload.study_assistance_score = ratingPayload.studyAssistance
    }
    if (ratingPayload.valueForMoney !== undefined && ratingPayload.valueForMoney > 0) {
      payload.value_for_money_score = ratingPayload.valueForMoney
    }

    try {
      // 调用后端API保存评分
      const response = await apiRequest('/api/ratings/', {
        method: 'POST',
        body: JSON.stringify({
          ai_id: aiId,
          ...payload
        })
      })

      if (!response.ok) {
        let data
        try {
          data = await response.json()
        } catch (e) {
          return { success: false, error: `保存评分失败 (状态码: ${response.status})` }
        }
        return { success: false, error: data.error || data.detail || '保存评分失败' }
      }

      const data = await response.json()

      // 成功后重新从后端加载AI数据以获取最新的平均分
      try {
        const aiResponse = await fetch('/api/ais/', { credentials: 'include' })
        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          const updatedAI = aiData.find(a => a.ai_id === aiId)
          if (updatedAI) {
            // 辅助函数：安全地将值转换为数字
            const toNumber = (val, defaultValue = 0) => {
              if (val === null || val === undefined) return defaultValue
              const num = typeof val === 'string' ? parseFloat(val) : Number(val)
              return isNaN(num) ? defaultValue : num
            }
            
            setAIs((prev) =>
              prev.map((ai) => {
                if (ai.id !== aiId) return ai
                return {
                  ...ai,
                  ratingCount: toNumber(updatedAI.rating_count, ai.ratingCount),
                  averageScore: Number(toNumber(updatedAI.avg_score, 0).toFixed(1)),
                  ratings: {
                    overall: Number(toNumber(updatedAI.overall_score, 0).toFixed(1)), // 总评分
                    versatility: Number(toNumber(updatedAI.versatility_score, 0).toFixed(1)),
                    imageGeneration: Number(toNumber(updatedAI.image_generation_score, 0).toFixed(1)),
                    informationQuery: Number(toNumber(updatedAI.information_query_score, 0).toFixed(1)),
                    studyAssistance: Number(toNumber(updatedAI.study_assistance_score, 0).toFixed(1)),
                    valueForMoney: Number(toNumber(updatedAI.value_for_money_score, 0).toFixed(1))
                  }
                }
              })
            )
          }
        }
      } catch (error) {
        console.error('刷新AI数据失败:', error)
        // 如果刷新失败，仍然使用本地计算
        setAIs((prev) =>
          prev.map((ai) => {
            if (ai.id !== aiId) return ai

            const categoryKeys = Object.keys(ai.ratings)
            let newCount = ai.ratingCount
            const categoryScores = {}

            if (isUpdate && oldRating) {
              // 更新评分：需要减去旧的评分，加上新的评分
              categoryKeys.forEach((key) => {
                const previous = ai.ratings[key] || 0
                const oldValue = oldRating.scores[key] || 0
                const newValue = ratingPayload[key] || 0
                // 重新计算：从总数中减去旧值，加上新值
                const total = previous * newCount - oldValue + newValue
                categoryScores[key] = Number((total / newCount).toFixed(2))
              })
            } else {
              // 新增评分
              newCount = ai.ratingCount + 1
              categoryKeys.forEach((key) => {
                const previous = ai.ratings[key] || 0
                const incoming = ratingPayload[key] || previous
                categoryScores[key] = Number(((previous * ai.ratingCount + incoming) / newCount).toFixed(2))
              })
            }

            const newAverage =
              categoryKeys.reduce((sum, key) => sum + categoryScores[key], 0) / categoryKeys.length

            return {
              ...ai,
              ratingCount: newCount,
              ratings: categoryScores,
              averageScore: Number(newAverage.toFixed(2))
            }
          })
        )
      }

      // 更新或添加用户评分记录（立即更新，确保UI能立即反映变化）
      if (isUpdate) {
        setUserActivity((prev) => {
          const newRatings = [...prev.ratings]
          // 合并新旧评分数据（只更新提供的字段，保留其他字段）
          const oldScores = oldRating?.scores || {}
          const mergedScores = { ...oldScores, ...ratingPayload }
          newRatings[existingRatingIndex] = {
            aiId,
            submittedAt: new Date().toISOString(),
            scores: mergedScores
          }
          return {
            ...prev,
            ratings: newRatings
          }
        })
      } else {
        setUserActivity((prev) => ({
          ...prev,
          ratings: [
            {
              aiId,
              submittedAt: new Date().toISOString(),
              scores: ratingPayload
            },
            ...prev.ratings
          ]
        }))
      }

      return { success: true, isUpdate }
    } catch (error) {
      // 如果是因为未登录而跳转，不返回错误（用户已经被重定向）
      if (error.message === '未登录，已跳转到登录页') {
        return { success: false, error: null } // 返回null表示已跳转，不需要显示错误
      }
      console.error('保存评分失败:', error)
      // 提供更详细的错误信息
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: '无法连接到服务器，请检查后端服务是否运行' }
      }
      return { success: false, error: `网络错误：${error.message || '请重试'}` }
    }
  }

  // 添加回复（支持嵌套回复）
  const addReply = (commentId, replyPayload) => {
    const newReply = {
      id: Date.now(),
      author: user?.name || 'AI 探索者',
      date: new Date().toISOString().slice(0, 10),
      content: replyPayload.content,
      replyToAuthor: replyPayload.replyToAuthor || null,
      replies: [] // 支持嵌套回复
    }

    // 递归查找并添加回复
    const addReplyToComment = (comments) => {
      return comments.map(comment => {
        // 如果是目标评论，直接添加回复
        if (comment.id === commentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          }
        }
        // 否则递归查找回复
        if (comment.replies && comment.replies.length > 0) {
          const updatedReplies = addReplyToReplies(comment.replies, commentId)
          if (updatedReplies !== comment.replies) {
            return {
              ...comment,
              replies: updatedReplies
            }
          }
        }
        return comment
      })
    }

    // 递归查找回复中的回复
    const addReplyToReplies = (replies, targetId) => {
      return replies.map(reply => {
        if (reply.id === targetId) {
          return {
            ...reply,
            replies: [...(reply.replies || []), newReply]
          }
        }
        if (reply.replies && reply.replies.length > 0) {
          return {
            ...reply,
            replies: addReplyToReplies(reply.replies, targetId)
          }
        }
        return reply
      })
    }

    setComments((prev) => addReplyToComment(prev))
  }

  const handleReaction = async (aiId, type) => {
    // 后端会验证登录
    try {
      const response = await apiRequest('/api/reactions/', {
        method: 'POST',
        body: JSON.stringify({
          ai_id: aiId,
          reaction_type: type
        })
      })

      if (!response.ok) {
        let data
        try {
          data = await response.json()
        } catch (e) {
          return { success: false, error: `操作失败 (状态码: ${response.status})` }
        }
        return { success: false, error: data.error || data.detail || '操作失败' }
      }

      const data = await response.json()

      // 更新前端状态
      if (data.is_active) {
        setUserActivity((prev) => ({
          ...prev,
          reactions: {
            ...prev.reactions,
            [aiId]: data.reaction_type
          }
        }))
      } else {
        setUserActivity((prev) => {
          const newReactions = { ...prev.reactions }
          delete newReactions[aiId]
          return {
            ...prev,
            reactions: newReactions
          }
        })
      }

      // 重新加载AI数据以获取最新的反应数
      try {
        const aiResponse = await fetch('/api/ais/', { credentials: 'include' })
        if (aiResponse.ok) {
          const aiData = await aiResponse.json()
          const updatedAI = aiData.find(a => a.ai_id === aiId)
          if (updatedAI) {
            setAIs((prev) =>
              prev.map((ai) => {
                if (ai.id !== aiId) return ai
                return {
                  ...ai,
                  reactions: {
                    thumbUp: updatedAI.reactions_thumb_up || 0,
                    thumbDown: updatedAI.reactions_thumb_down || 0,
                    amazing: updatedAI.reactions_amazing || 0,
                    bad: updatedAI.reactions_bad || 0
                  }
                }
              })
            )
          }
        }
      } catch (error) {
        console.error('刷新AI数据失败:', error)
      }

      return { 
        success: true, 
        is_active: data.is_active, 
        reaction_type: data.is_active ? data.reaction_type : null 
      }
    } catch (error) {
      // 如果是因为未登录而跳转，不返回错误（用户已经被重定向）
      if (error.message === '未登录，已跳转到登录页') {
        return { success: false, error: null } // 返回null表示已跳转，不需要显示错误
      }
      console.error('反应操作失败:', error)
      return { success: false, error: `网络错误：${error.message || '请重试'}` }
    }
  }

  // 刷新评论数据
  const refreshComments = async () => {
    try {
      const commentRes = await fetch('/api/comments/', { credentials: 'include' })
      if (commentRes.ok) {
        const commentData = await commentRes.json()
        const mapped = Array.isArray(commentData) ? commentData.map((c) => {
          // 如果用户被删除，显示"已删除用户"
          let author = '已删除用户'
          if (c.user && c.user.username) {
            author = c.user.username
          } else if (c.user_id && !c.user) {
            author = '已删除用户'
          }
          
          return {
            id: c.comment_id,
            aiId: c.ai_id || (c.ai?.ai_id || (typeof c.ai === 'number' ? c.ai : parseInt(c.ai_id))),
            author: author,
            date: (c.created_at || '').slice(0, 10),
            rating: null,
            content: c.content || '',
            images: c.images || [],
            upvotes: c.upvotes || 0,
            helpful: false,
            notHelpful: false,
            replies: []
          }
        }) : []
        setComments(mapped)
      }
    } catch (error) {
      console.error('刷新评论失败:', error)
    }
  }

  const value = useMemo(
    () => ({
      ais,
      comments,
      favoriteIds,
      userActivity,
      user,
      toggleFavorite,
      addTag,
      addComment,
      addReply,
      submitRating,
      refreshComments,
      handleReaction,
      register,
      login,
      logout,
      updateUser
    }),
    [ais, comments, favoriteIds, userActivity, user]
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export const useAppContext = () => {
  const ctx = useContext(AppContext)
  if (!ctx) {
    throw new Error('useAppContext 必须在 AppProvider 内使用')
  }
  return ctx
}

