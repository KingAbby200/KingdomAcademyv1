import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Heart, Star, Flame } from 'lucide-react';

const KeyIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className="glow"
    style={{
      filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))"
    }}
  >
    <motion.path
      d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
    />
  </svg>
);

interface KingdomKeyTabProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function KingdomKeyTab({ isOpen, onToggle, className }: KingdomKeyTabProps) {
  const [selectedReaction, setSelectedReaction] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [comments, setComments] = useState<string[]>([]);

  const reactions = [
    { icon: Heart, label: 'Love' },
    { icon: Star, label: 'Inspired' },
    { icon: Flame, label: 'Spirit-filled' },
  ];

  return (
    <>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={className}
      >
        <motion.div
          className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl p-[2px] shadow-xl hover:shadow-2xl transition-shadow cursor-pointer overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToggle}
        >
          <div className="px-3 py-2 rounded-xl bg-black/20 backdrop-blur-md flex items-center gap-2 w-full">
            <motion.div
              animate={{
                rotate: isOpen ? 180 : 0
              }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex-shrink-0"
            >
              <KeyIcon />
            </motion.div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-white font-bold whitespace-nowrap truncate">Kingdom Keys</span>
              <span className="text-[10px] text-white/70 truncate">Today's Wisdom</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onToggle}
          >
            <div className="min-h-screen px-4 py-8 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className="w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border-t-2 border-t-indigo-500">
                  <div className="p-6">
                    <motion.p 
                      className="text-2xl text-center font-semibold mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
                    >
                      "Your Circle Will Determine Your Cycle"
                    </motion.p>

                    <div className="flex justify-center gap-8 mb-8">
                      {reactions.map(({ icon: Icon, label }, index) => (
                        <motion.button
                          key={label}
                          whileHover={{ scale: 1.1, rotate: [0, -10, 10, 0] }}
                          whileTap={{ scale: 0.95 }}
                          className={`flex flex-col items-center gap-2 transition-all ${
                            selectedReaction === label
                              ? "text-indigo-600"
                              : "text-gray-500"
                          }`}
                          onClick={() => setSelectedReaction(label)}
                        >
                          <motion.div
                            animate={selectedReaction === label ? {
                              scale: [1, 1.2, 1],
                              filter: ["brightness(1)", "brightness(1.3)", "brightness(1)"]
                            } : {}}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              repeatType: "reverse"
                            }}
                          >
                            <Icon className="h-7 w-7" />
                          </motion.div>
                          <span className="text-xs font-medium">{label}</span>
                        </motion.button>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <textarea
                        className="w-full p-4 rounded-xl border border-indigo-100 bg-white/50 backdrop-blur-sm resize-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all placeholder:text-gray-400"
                        rows={2}
                        placeholder="Share your thoughts on today's key..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                        onClick={() => {
                          if (comment.trim()) {
                            setComments([comment, ...comments]);
                            setComment('');
                          }
                        }}
                      >
                        Share Reflection
                      </motion.button>
                    </div>

                    <div className="mt-8 space-y-4 max-h-[40vh] overflow-y-auto">
                      {comments.map((text, index) => (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index }}
                          key={index}
                          className="p-4 rounded-xl bg-gradient-to-r from-indigo-50/50 to-purple-50/50 border border-indigo-100/20"
                        >
                          <p className="text-sm text-gray-700">{text}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}