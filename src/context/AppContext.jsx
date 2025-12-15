import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { mockAIs as initialAIs, mockComments as initialComments } from '../data/mockData'

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
  const [ais, setAIs] = useState(initialAIs)
  const [comments, setComments] = useState(initialComments)
  const [favoriteIds, setFavoriteIds] = useState([])
  const [user, setUser] = useState(loadUserFromStorage)
  const [userActivity, setUserActivity] = useState({
    ratings: [],
    comments: []
  })

  // 初始化时加载用户数据
  useEffect(() => {
    const storedUser = loadUserFromStorage()
    if (storedUser) {
      setUser(storedUser)
      if (storedUser.favoriteIds) {
        setFavoriteIds(storedUser.favoriteIds)
      }
      if (storedUser.userActivity) {
        setUserActivity(storedUser.userActivity)
      }
    }
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
  const register = (userData) => {
    const newUser = {
      id: Date.now(),
      username: userData.username,
      email: userData.email,
      name: userData.username,
      level: 1,
      avatar: null,
      createdAt: new Date().toISOString(),
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
    return { success: true, user: newUser }
  }

  // 登录
  const login = (email, password) => {
    // 检查是否已有用户数据
    const storedUser = loadUserFromStorage()
    if (storedUser && storedUser.email === email) {
      setUser(storedUser)
      if (storedUser.favoriteIds) {
        setFavoriteIds(storedUser.favoriteIds)
      }
      if (storedUser.userActivity) {
        setUserActivity(storedUser.userActivity)
      }
      return { success: true, user: storedUser }
    }
    // 如果没有用户，创建默认用户（用于演示）
    if (!storedUser) {
      const defaultUser = {
        id: Date.now(),
        username: email.split('@')[0],
        email: email,
        name: email.split('@')[0],
        level: 1,
        avatar: null,
        createdAt: new Date().toISOString(),
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
      setUser(defaultUser)
      return { success: true, user: defaultUser }
    }
    return { success: false, error: '邮箱或密码错误' }
  }

  // 登出
  const logout = () => {
    setUser(null)
    setFavoriteIds([])
    setUserActivity({ ratings: [], comments: [] })
  }

  // 更新用户信息
  const updateUser = (updates) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...updates }
      return updated
    })
  }

  const toggleFavorite = (aiId) => {
    setFavoriteIds((prev) => {
      return prev.includes(aiId) ? prev.filter((id) => id !== aiId) : [...prev, aiId]
    })
  }

  const addTag = (aiId, tag) => {
    setAIs((prev) =>
      prev.map((ai) =>
        ai.id === aiId && !ai.tags.includes(tag)
          ? { ...ai, tags: [...ai.tags, tag] }
          : ai
      )
    )
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

  const submitRating = (aiId, ratingPayload) => {
    setAIs((prev) =>
      prev.map((ai) => {
        if (ai.id !== aiId) return ai

        const categoryKeys = Object.keys(ai.ratings)
        const newCount = ai.ratingCount + 1
        const categoryScores = {}

        categoryKeys.forEach((key) => {
          const previous = ai.ratings[key] || 0
          const incoming = ratingPayload[key] || previous
          categoryScores[key] = Number(((previous * ai.ratingCount + incoming) / newCount).toFixed(2))
        })

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

