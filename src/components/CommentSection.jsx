import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ThumbsUp, ThumbsDown, Reply, Flag, Image as ImageIcon } from 'lucide-react'
import CommentForm from './CommentForm'
import ReplyForm from './ReplyForm'
import ReportForm from './ReportForm'
import { useAppContext } from '../context/AppContext'
import './CommentSection.css'

function CommentSection({ aiId, comments, onAddComment }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, addReply } = useAppContext()
  const [showCommentForm, setShowCommentForm] = useState(false)
  const [expandedReplies, setExpandedReplies] = useState({})
  const [replyingTo, setReplyingTo] = useState(null) // { commentId, replyId, author }

  const toggleReplies = (commentId) => {
    setExpandedReplies({
      ...expandedReplies,
      [commentId]: !expandedReplies[commentId]
    })
  }

  const handleReply = (commentId, replyId = null, author = null) => {
    // 后端会验证登录
    setReplyingTo({ commentId, replyId, author })
    // 自动展开回复区域
    if (!expandedReplies[commentId]) {
      setExpandedReplies({
        ...expandedReplies,
        [commentId]: true
      })
    }
  }

  const handleSubmitReply = (replyPayload) => {
    const targetId = replyingTo.replyId || replyingTo.commentId
    addReply(targetId, replyPayload)
    setReplyingTo(null)
  }

  return (
    <section className="comment-section">
      <div className="section-header">
        <h2>评论 ({comments.length})</h2>
        <button 
          className="comment-btn"
          onClick={() => {
            // 后端会验证登录
            setShowCommentForm(!showCommentForm)
          }}
        >
          {showCommentForm ? '取消评论' : '写评论'}
        </button>
      </div>

      {showCommentForm && (
        <CommentForm 
          aiId={aiId}
          onSubmit={(payload) => {
            setShowCommentForm(false)
            onAddComment?.(payload)
          }}
        />
      )}

      <div className="comments-list">
        {comments.map(comment => (
          <CommentItem 
            key={comment.id} 
            comment={comment}
            onToggleReplies={() => toggleReplies(comment.id)}
            onReply={(replyId, author) => handleReply(comment.id, replyId, author)}
            showReplies={expandedReplies[comment.id]}
            replyingTo={replyingTo}
            onSubmitReply={handleSubmitReply}
            onCancelReply={() => setReplyingTo(null)}
          />
        ))}
      </div>

      {comments.length === 0 && (
        <div className="empty-comments">
          <p>还没有评论，快来第一个评论吧！</p>
        </div>
      )}
    </section>
  )
}

function CommentItem({ comment, onToggleReplies, onReply, showReplies, replyingTo, onSubmitReply, onCancelReply }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAppContext()
  const [helpful, setHelpful] = useState(comment.helpful || false)
  const [notHelpful, setNotHelpful] = useState(comment.notHelpful || false)
  const [upvotes, setUpvotes] = useState(comment.upvotes || 0)
  const [showReportForm, setShowReportForm] = useState(false)
  const [reportMessage, setReportMessage] = useState('')

  const handleReport = () => {
    // 后端会验证登录（如果需要）
    setShowReportForm(true)
  }

  const handleSubmitReport = (reportData) => {
    console.log('举报评论:', {
      ...reportData,
      commentId: comment.id,
      timestamp: new Date().toISOString()
    })
    
    setReportMessage('举报已提交，我们会尽快审核处理。感谢您的反馈！')
    setTimeout(() => setReportMessage(''), 4000)
  }

  const handleUpvote = () => {
    // 后端会验证登录（如果需要）
    if (helpful) {
      setUpvotes(upvotes - 1)
      setHelpful(false)
    } else {
      setUpvotes(upvotes + 1)
      setHelpful(true)
      setNotHelpful(false)
    }
  }

  const handleDownvote = () => {
    // 后端会验证登录（如果需要）
    setNotHelpful(!notHelpful)
    if (notHelpful) {
      setHelpful(false)
    }
  }

  return (
    <div className="comment-item">
      <div className="comment-header">
        <div className="comment-author">
          <div className="author-avatar">
            {comment.author.charAt(0)}
          </div>
          <div className="author-info">
            <span className="author-name">{comment.author}</span>
            <span className="comment-date">{comment.date}</span>
          </div>
        </div>
        {comment.rating && (
          <div className="comment-rating">
            {comment.rating}/10 ⭐
          </div>
        )}
      </div>

      <div className="comment-content">
        <p>{comment.content}</p>
        {comment.images && comment.images.length > 0 && (
          <div className="comment-images">
            {comment.images.map((img, idx) => (
              <div key={idx} className="comment-image">
                <img src={img} alt={`评论图片 ${idx + 1}`} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="comment-actions">
        <div className="action-group">
          <button 
            className={`action-btn ${helpful ? 'active' : ''}`}
            onClick={handleUpvote}
          >
            <ThumbsUp size={18} />
            <span>有用 ({upvotes})</span>
          </button>
          <button 
            className={`action-btn ${notHelpful ? 'active' : ''}`}
            onClick={handleDownvote}
          >
            <ThumbsDown size={18} />
            <span>无用</span>
          </button>
        </div>
        <div className="action-group">
          {(comment.replies && comment.replies.length > 0) && (
            <button 
              className="action-btn" 
              onClick={onToggleReplies}
            >
              <span>{showReplies ? '收起' : '查看'}回复 ({getTotalRepliesCount(comment.replies || [])})</span>
            </button>
          )}
          <button 
            className="action-btn" 
            onClick={() => onReply(null, comment.author)}
          >
            <Reply size={18} />
            <span>回复</span>
          </button>
          <button className="action-btn" onClick={handleReport}>
            <Flag size={18} />
            <span>举报</span>
          </button>
          {reportMessage && (
            <div className="comment-report-message">
              {reportMessage}
            </div>
          )}
        </div>
      </div>

      {showReportForm && (
        <ReportForm
          type="comment"
          targetName={`${comment.author}的评论`}
          onClose={() => setShowReportForm(false)}
          onSubmit={handleSubmitReport}
        />
      )}

      {/* 回复区域 */}
      {(replyingTo && replyingTo.commentId === comment.id && !replyingTo.replyId) || showReplies ? (
        <div className="replies-section">
          {/* 回复表单 - 回复评论 */}
          {replyingTo && replyingTo.commentId === comment.id && !replyingTo.replyId && (
            <ReplyForm
              parentId={comment.id}
              replyToAuthor={comment.author}
              onCancel={onCancelReply}
              onSubmit={onSubmitReply}
            />
          )}
          
          {/* 显示所有回复 */}
          {showReplies && comment.replies && comment.replies.length > 0 && (
            <div className="replies-list">
          {comment.replies.map(reply => (
                <ReplyItem
                  key={reply.id}
                  reply={reply}
                  commentId={comment.id}
                  onReply={onReply}
                  replyingTo={replyingTo}
                  onSubmitReply={onSubmitReply}
                  onCancelReply={onCancelReply}
                  depth={0}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

// 计算总回复数（包括嵌套回复）
function getTotalRepliesCount(replies) {
  if (!replies || replies.length === 0) return 0
  return replies.reduce((count, reply) => {
    return count + 1 + getTotalRepliesCount(reply.replies || [])
  }, 0)
}

// 回复项组件（支持嵌套）
function ReplyItem({ reply, commentId, onReply, replyingTo, onSubmitReply, onCancelReply, depth = 0 }) {
  const maxDepth = 3 // 最大嵌套深度
  const isReplying = replyingTo && replyingTo.replyId === reply.id

  return (
    <div className={`reply-item ${depth > 0 ? 'nested-reply' : ''}`} style={{ marginLeft: `${depth * 20}px` }}>
      <div className="reply-header">
              <div className="reply-author">
          {reply.replyToAuthor && (
            <span className="reply-to-indicator">@{reply.replyToAuthor}</span>
          )}
                <span className="author-name">{reply.author}</span>
                <span className="reply-date">{reply.date}</span>
        </div>
              </div>
              <p className="reply-content">{reply.content}</p>
      <div className="reply-actions">
        <button 
          className="reply-action-btn"
          onClick={() => onReply(reply.id, reply.author)}
        >
          <Reply size={14} />
          <span>回复</span>
        </button>
            </div>

      {/* 回复表单 - 回复回复 */}
      {isReplying && depth < maxDepth && (
        <ReplyForm
          parentId={reply.id}
          replyToAuthor={reply.author}
          onCancel={onCancelReply}
          onSubmit={onSubmitReply}
        />
      )}

      {/* 嵌套回复 */}
      {reply.replies && reply.replies.length > 0 && depth < maxDepth && (
        <div className="nested-replies">
          {reply.replies.map(nestedReply => (
            <ReplyItem
              key={nestedReply.id}
              reply={nestedReply}
              commentId={commentId}
              onReply={onReply}
              replyingTo={replyingTo}
              onSubmitReply={onSubmitReply}
              onCancelReply={onCancelReply}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default CommentSection

