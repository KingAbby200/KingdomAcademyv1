import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Card } from "@/components/ui/card"
import { Avatar } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Heart, MessageCircle, X } from "lucide-react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

interface Comment {
  id: string;
  text: string;
  user: {
    name: string;
    avatar: string;
  };
  likes: number;
  replies?: Comment[];
  timestamp: number;
  reactions: {
    love: number;
    amen: number;
    blessed: number;
  };
  userReaction?: 'love' | 'amen' | 'blessed';
}

interface CommentModalProps {
  isOpen: boolean;
  onClose: () => void;
  comments: Comment[];
  onAddComment: (text: string, parentId?: string) => void;
  onLikeComment: (commentId: string, reaction: 'love' | 'amen' | 'blessed') => void;
}

export function CommentModal({
  isOpen,
  onClose,
  comments,
  onAddComment,
  onLikeComment,
}: CommentModalProps) {
  const [newComment, setNewComment] = React.useState("")
  const [replyingTo, setReplyingTo] = React.useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newComment.trim()) {
      onAddComment(newComment, replyingTo || undefined)
      setNewComment("")
      setReplyingTo(null)
    }
  }

  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.width = '100%'

      return () => {
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.width = ''
      }
    }
  }, [isOpen])

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 ${isReply ? 'ml-12' : ''}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <img src={comment.user.avatar} alt={comment.user.name} />
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="rounded-2xl bg-gray-50 p-3">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{comment.user.name}</span>
            <span className="text-xs text-gray-500">
              {new Date(comment.timestamp).toLocaleString()}
            </span>
          </div>
          <p className="mt-1 text-sm break-words">{comment.text}</p>
        </div>
        <div className="flex items-center gap-4 mt-1 ml-2">
          <ContextMenu>
            <ContextMenuTrigger>
              <button 
                className={`text-gray-500 hover:text-red-500 transition-colors flex items-center gap-1 ${
                  comment.userReaction ? 'text-red-500' : ''
                }`}
              >
                <Heart className={`h-4 w-4 ${comment.userReaction ? 'fill-current' : ''}`} />
                <span className="text-xs">
                  {comment.reactions.love + comment.reactions.amen + comment.reactions.blessed}
                </span>
              </button>
            </ContextMenuTrigger>
            <ContextMenuContent>
              <ContextMenuItem onClick={() => onLikeComment(comment.id, 'love')}>
                ❤️ Love
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onLikeComment(comment.id, 'amen')}>
                🙏 Amen
              </ContextMenuItem>
              <ContextMenuItem onClick={() => onLikeComment(comment.id, 'blessed')}>
                ✝️ Blessed
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
          {!isReply && (
            <button
              className="text-gray-500 hover:text-primary transition-colors flex items-center gap-1"
              onClick={() => setReplyingTo(comment.id)}
            >
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">Reply</span>
            </button>
          )}
        </div>
        {comment.replies?.map((reply) => (
          <CommentItem key={reply.id} comment={reply} isReply />
        ))}
      </div>
    </div>
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[9999] touch-none"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            touchAction: 'none',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose()
          }}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 0 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 0 }}
            className="w-full max-w-lg"
            style={{
              maxHeight: '80vh',
              margin: 'auto',
              touchAction: 'none',
            }}
          >
            <Card className="relative overflow-hidden shadow-xl">
              <button
                onClick={onClose}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 z-50"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="p-6">
                <h3 className="text-lg font-semibold mb-4">Comments</h3>
                <form onSubmit={handleSubmit} className="mb-6">
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=current" alt="You" />
                    </Avatar>
                    <Input
                      ref={inputRef}
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={replyingTo ? "Write a reply..." : "Write a comment..."}
                      className="flex-1 text-base" 
                      style={{
                        fontSize: '16px', 
                        touchAction: 'none',
                      }}
                    />
                  </div>
                  {replyingTo && (
                    <button
                      type="button"
                      onClick={() => setReplyingTo(null)}
                      className="mt-2 text-xs text-gray-500 hover:text-primary"
                    >
                      Cancel reply
                    </button>
                  )}
                </form>

                <div 
                  className="space-y-6 overflow-y-auto" 
                  style={{ 
                    maxHeight: 'calc(70vh - 200px)',
                    WebkitOverflowScrolling: 'touch',
                  }}
                >
                  {comments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
                </div>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}