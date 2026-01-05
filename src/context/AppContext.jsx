import { createContext, useContext, useMemo, useState, useEffect } from 'react'

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
    const normalizeAI = (ai) => ({
      id: ai.ai_id,
      name: ai.name,
      developer: ai.developer || '',
      description: ai.description || '',
      price: ai.price_text || ai.price || '—',
      link: ai.official_url || ai.link || '',
      averageScore: Number(ai.avg_score ?? 0),
      ratingCount: ai.rating_count || 0,
      favoriteCount: ai.favorite_count || 0,
      ratings: {
        versatility: ai.versatility_score || 0,
        imageGeneration: ai.image_generation_score || 0,
        informationQuery: ai.information_query_score || 0,
        studyAssistance: ai.study_assistance_score || 0,
        valueForMoney: ai.value_for_money_score || 0
      },
      tags: Array.isArray(ai.tags) ? ai.tags.map(t => t.tag_name) : [],
      reactions: {
        thumbUp: ai.reactions_thumb_up || 0,
        thumbDown: ai.reactions_thumb_down || 0,
        amazing: ai.reactions_amazing || 0,
        bad: ai.reactions_bad || 0
      },
      ratingTrend: ai.ratingTrend || []
    })

    const normalizeComment = (c) => ({
      id: c.comment_id,
      aiId: c.ai_id,
      author: c.user?.username || `用户${c.user_id ?? ''}`,
      date: (c.created_at || '').slice(0, 10),
      rating: null,
      content: c.content || '',
      images: [],
      upvotes: c.upvotes || 0,
      helpful: false,
      notHelpful: false,
      replies: []
    })

    const fetchInitialData = async () => {
      try {
        const [aiRes, commentRes] = await Promise.all([
          fetch('/api/ais/', { credentials: 'include' }),
          fetch('/api/comments/', { credentials: 'include' })
        ])

        if (aiRes.ok) {
          const aiData = await aiRes.json()
          const mapped = Array.isArray(aiData) ? aiData.map(normalizeAI) : []
          setAIs(mapped)
        }

        if (commentRes.ok) {
          const commentData = await commentRes.json()
          const mapped = Array.isArray(commentData) ? commentData.map(normalizeComment) : []
          setComments(mapped)
        }
      } catch (err) {
        // 静默处理，防止阻断前端
        console.error('加载初始数据失败', err)
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
            const favResponse = await fetch('/api/favorites/list/', { credentials: 'include' })
            if (favResponse.ok) {
              const favData = await favResponse.json()
              if (favData.success && favData.favorite_ids) {
                verifiedUser.favoriteIds = favData.favorite_ids
                setFavoriteIds(favData.favorite_ids)
              }
            }
          } catch (error) {
            console.error('加载收藏列表失败:', error)
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
          message: data.requires_approval 
            ? '注册成功，请等待管理员审核通过后即可登录'
            : '注册成功'
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
        } else if (response.status === 403) {
          return { success: false, error: '您的账号尚未通过管理员审核' }
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
          const favResponse = await fetch('/api/favorites/list/', { credentials: 'include' })
          if (favResponse.ok) {
            const favData = await favResponse.json()
            if (favData.success && favData.favorite_ids) {
              userData.favoriteIds = favData.favorite_ids
              setFavoriteIds(favData.favorite_ids)
            }
          }
        } catch (error) {
          console.error('加载收藏列表失败:', error)
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
    if (!user) {
      return { success: false, error: '请先登录' }
    }

    try {
      const response = await fetch('/api/favorites/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ai_id: aiId
        })
      })

      // 检查响应状态
      if (response.status === 401) {
        // 认证失败，清除用户状态并提示重新登录
        console.error('认证失败，请重新登录')
        setUser(null)
        return { success: false, error: '登录已过期，请重新登录' }
      }

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
      console.error('收藏操作失败:', error)
      // 提供更详细的错误信息
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        return { success: false, error: '无法连接到服务器，请检查后端服务是否运行' }
      }
      return { success: false, error: `网络错误：${error.message || '请重试'}` }
    }
  }

  const addTag = (aiId, tag) => {
    // 检查用户是否已经对该AI添加过标签
    const userTags = userActivity.tags[aiId] || []
    if (userTags.includes(tag)) {
      return { success: false, error: '您已经添加过这个标签了' }
    }

    setAIs((prev) =>
      prev.map((ai) =>
        ai.id === aiId && !ai.tags.includes(tag)
          ? { ...ai, tags: [...ai.tags, tag] }
          : ai
      )
    )

    // 记录用户添加的标签
    setUserActivity((prev) => ({
      ...prev,
      tags: {
        ...prev.tags,
        [aiId]: [...userTags, tag]
      }
    }))

    return { success: true }
  }

  const addComment = (aiId, payload) => {
    const newComment = {
      id: Date.now(),
      aiId,
      author: user?.name || 'AI 探索者',
      date: new Date().toISOString().slice(0, 10),
      rating: payload.rating || null,
      content: payload.content,
      images: payload.images || [],
      upvotes: 0,
      helpful: false,
      notHelpful: false,
      replies: []
    }

    setComments((prev) => [...prev, newComment])
    setUserActivity((prev) => ({
      ...prev,
      comments: [{ aiId, commentId: newComment.id, content: payload.content }, ...prev.comments]
    }))
  }

  const submitRating = async (aiId, ratingPayload) => {
    // 如果没有登录用户，返回错误
    if (!user) {
      return { success: false, error: '请先登录' }
    }

    // 检查用户是否已经对该AI评分过
    const existingRatingIndex = userActivity.ratings.findIndex(r => r.aiId === aiId)
    const isUpdate = existingRatingIndex !== -1
    const oldRating = isUpdate ? userActivity.ratings[existingRatingIndex] : null

    try {
      // 调用后端API保存评分
      const response = await fetch('/api/ratings/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ai_id: aiId,
          versatility_score: ratingPayload.versatility || 0,
          image_generation_score: ratingPayload.imageGeneration || 0,
          information_query_score: ratingPayload.informationQuery || 0,
          study_assistance_score: ratingPayload.studyAssistance || 0,
          value_for_money_score: ratingPayload.valueForMoney || 0,
        })
      })

      // 检查响应状态
      if (response.status === 401) {
        // 认证失败，清除用户状态并提示重新登录
        console.error('认证失败，请重新登录')
        setUser(null)
        return { success: false, error: '登录已过期，请重新登录' }
      }

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
            setAIs((prev) =>
              prev.map((ai) => {
                if (ai.id !== aiId) return ai
                return {
                  ...ai,
                  ratingCount: updatedAI.rating_count || ai.ratingCount,
                  averageScore: Number(updatedAI.avg_score || 0),
                  ratings: {
                    versatility: updatedAI.versatility_score || 0,
                    imageGeneration: updatedAI.image_generation_score || 0,
                    informationQuery: updatedAI.information_query_score || 0,
                    studyAssistance: updatedAI.study_assistance_score || 0,
                    valueForMoney: updatedAI.value_for_money_score || 0
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
          newRatings[existingRatingIndex] = {
            aiId,
            submittedAt: new Date().toISOString(),
            scores: ratingPayload
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

  const handleReaction = (aiId, type) => {
    // 检查用户是否已经反应过
    const existingReaction = userActivity.reactions[aiId]
    if (existingReaction && existingReaction === type) {
      // 如果点击的是同一个反应，取消反应
      setUserActivity((prev) => {
        const newReactions = { ...prev.reactions }
        delete newReactions[aiId]
        return {
          ...prev,
          reactions: newReactions
        }
      })
    } else if (!existingReaction) {
      // 如果还没有反应过，添加反应
      setUserActivity((prev) => ({
        ...prev,
        reactions: {
          ...prev.reactions,
          [aiId]: type
        }
      }))
    }
    // 如果已经有其他反应，不允许更改
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

