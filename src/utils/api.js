/**
 * API工具函数 - 统一处理认证和错误
 */

// 防止重复跳转的标记
let isRedirecting = false

/**
 * 统一的fetch包装函数，自动处理认证错误
 * @param {string} url - API URL
 * @param {object} options - fetch选项
 * @param {boolean} requireAuth - 是否需要认证（如果为true，401/403时会跳转到登录页）
 * @returns {Promise<Response>}
 */
export async function apiRequest(url, options = {}, requireAuth = true) {
  const defaultOptions = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  }

  try {
    const response = await fetch(url, defaultOptions)
    
    // 如果是401或403且需要认证，跳转到登录页
    if ((response.status === 401 || response.status === 403) && requireAuth && !isRedirecting) {
      isRedirecting = true
      
      // 清除本地用户数据
      localStorage.removeItem('rateAI_user')
      
      // 跳转到登录页（保存当前路径，登录后可以返回）
      const currentPath = window.location.pathname + window.location.search
      const loginUrl = `/login?from=${encodeURIComponent(currentPath)}`
      
      console.log('[API] 认证失败，跳转到登录页:', loginUrl)
      
      // 使用window.location.href确保完全跳转（清除所有状态）
      window.location.href = loginUrl
      
      // 返回一个拒绝的Promise，阻止后续处理
      return Promise.reject(new Error('未登录，已跳转到登录页'))
    }
    
    // 重置跳转标记（如果请求成功）
    if (response.ok) {
      isRedirecting = false
    }
    
    return response
  } catch (error) {
    // 如果是网络错误，不重置跳转标记
    if (error.message !== '未登录，已跳转到登录页') {
      console.error('[API] 请求错误:', error)
    }
    throw error
  }
}

/**
 * 检查后端认证状态
 * @returns {Promise<{authenticated: boolean, user: object|null}>}
 */
export async function checkAuth() {
  try {
    const response = await apiRequest('/api/check-auth/', { method: 'GET' }, false)
    const data = await response.json()
    return {
      authenticated: data.authenticated || false,
      user: data.user || null
    }
  } catch (error) {
    return {
      authenticated: false,
      user: null
    }
  }
}

