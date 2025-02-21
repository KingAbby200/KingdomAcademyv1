import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Star, Flame } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { getAvatarUrl } from "@/lib/avatar";

interface CommunityCardProps {
  content: {
    type: 'text' | 'image' | 'video' | 'kingdom_insight';
    data: string;
    thumbnail?: string;
    caption?: string;
  };
  user: {
    name: string;
    username?: string;
    inBreakoutRoom?: string | null;
  };
  timestamp?: number;
  onCommentClick: () => void;
  onProfileClick?: (username: string) => string; // Add this prop for profile navigation
}

export function CommunityCard({ content, user, timestamp, onCommentClick, onProfileClick }: CommunityCardProps) {
  const isKingdomInsight = content.type === 'kingdom_insight';
  const [selectedReactions, setSelectedReactions] = useState<Record<string, boolean>>({
    love: false,
    star: false,
    flame: false
  });

  const toggleReaction = (type: 'love' | 'star' | 'flame') => {
    setSelectedReactions(prev => ({
      ...prev,
      [type]: !prev[type]
    }));
  };

  const profileUrl = user.username && onProfileClick ? onProfileClick(user.username) : '#';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        type: "spring",
        stiffness: 100,
        damping: 20,
        mass: 0.5
      }}
      className="min-w-[300px] md:min-w-[400px] px-4 relative"
    >
      <Card className={`overflow-hidden h-[60vh] flex flex-col ${
        isKingdomInsight ? 'border-2 border-amber-500 shadow-lg shadow-amber-500/20' : ''
      }`}>
        <div className="p-4 flex items-center gap-3 border-b">
          {isKingdomInsight ? (
            <div className="h-8 w-8 rounded-full bg-amber-50 flex items-center justify-center">
              <CrownLogo />
            </div>
          ) : (
            <Link href={profileUrl}>
              <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all">
                <img src={getAvatarUrl(user.name)} alt={user.name} loading="lazy" decoding="async"/>
              </Avatar>
            </Link>
          )}
          <div className="flex flex-col flex-1">
            <div className="flex items-center gap-2">
              <Link href={profileUrl}>
                <span className="font-medium text-sm cursor-pointer hover:text-primary transition-colors">{user.name}</span>
              </Link>
              {user.inBreakoutRoom && (
                <div className="flex items-center">
                  <motion.div
                    className="h-1.5 w-1.5 rounded-full bg-rose-500"
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      repeat: Infinity,
                      repeatType: "reverse",
                      duration: 1
                    }}
                  />
                  <span className="ml-1 text-[10px] font-medium text-rose-500">
                    {user.inBreakoutRoom}
                  </span>
                </div>
              )}
            </div>
            {timestamp && (
              <span className="text-xs text-gray-500">
                {new Date(timestamp).toLocaleString()}
              </span>
            )}
          </div>
        </div>
        <div className="relative flex-1 overflow-hidden">
          {content.type === 'text' && (
            <motion.div
              className="h-full flex items-center justify-center relative overflow-hidden p-6"
              initial={{ background: getRandomGradient() }}
              animate={{
                background: [
                  getRandomGradient(),
                  getRandomGradient().replace('135deg', '225deg'),
                  getRandomGradient().replace('135deg', '315deg'),
                  getRandomGradient().replace('135deg', '45deg'),
                ],
              }}
              transition={{
                duration: 20,
                repeat: Infinity,
                repeatType: "reverse",
              }}
            >
              <motion.div
                className="absolute inset-0 opacity-10"
                initial={{ backgroundSize: "100% 100%" }}
                animate={{ backgroundSize: ["100% 100%", "120% 120%"] }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
              />
              <div className="relative z-10 w-full h-full flex items-center justify-center">
                <div className="w-full max-h-full overflow-y-auto px-4 py-2 scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/20">
                  <motion.div
                    className="text-white space-y-4"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 100,
                      damping: 20,
                    }}
                  >
                    {content.data.split('\n\n').map((paragraph, index) => (
                      <p
                        key={index}
                        className="text-base sm:text-lg font-medium leading-relaxed break-words"
                        style={{
                          textShadow: '0 2px 4px rgba(0,0,0,0.1)',
                          fontSize: 'clamp(1rem, 1.5vw, 1.25rem)',
                        }}
                      >
                        {paragraph}
                      </p>
                    ))}
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
          {(content.type === 'image' || content.type === 'kingdom_insight') && (
            <div className="absolute inset-0">
              <img
                src={content.data}
                alt="Post content"
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
              {content.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white text-sm md:text-base leading-relaxed"
                  >
                    {content.caption}
                  </motion.p>
                </div>
              )}
            </div>
          )}
          {content.type === 'video' && (
            <div className="absolute inset-0">
              <video
                src={content.data}
                controls
                autoPlay
                muted
                loop
                className="w-full h-full object-cover"
              />
              {content.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-white text-sm md:text-base leading-relaxed"
                  >
                    {content.caption}
                  </motion.p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between bg-card">
          <div className="flex gap-6">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`transition-colors ${
                selectedReactions.love
                  ? 'text-red-500'
                  : 'text-gray-600 hover:text-red-500'
              }`}
              onClick={() => toggleReaction('love')}
            >
              <Heart className={`h-5 w-5 ${selectedReactions.love ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`transition-colors ${
                selectedReactions.star
                  ? 'text-amber-500'
                  : 'text-gray-600 hover:text-amber-500'
              }`}
              onClick={() => toggleReaction('star')}
            >
              <Star className={`h-5 w-5 ${selectedReactions.star ? 'fill-current' : ''}`} />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={`transition-colors ${
                selectedReactions.flame
                  ? 'text-blue-500'
                  : 'text-gray-600 hover:text-blue-500'
              }`}
              onClick={() => toggleReaction('flame')}
            >
              <Flame className={`h-5 w-5 ${selectedReactions.flame ? 'fill-current' : ''}`} />
            </motion.button>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="text-gray-600 hover:text-primary transition-colors relative"
            onClick={onCommentClick}
          >
            <MessageCircle className="h-5 w-5" />
          </motion.button>
        </div>
      </Card>
    </motion.div>
  );
}

const gradients = [
  // Purple-Pink (Original)
  "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
  // Blue-Teal
  "linear-gradient(135deg, #3b82f6 0%, #0d9488 100%)",
  // Orange-Rose
  "linear-gradient(135deg, #f97316 0%, #e11d48 100%)",
  // Green-Blue
  "linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)",
  // Amber-Orange
  "linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)"
];

const getRandomGradient = () => {
  const index = Math.floor(Math.random() * gradients.length);
  return gradients[index];
};

const CrownLogo = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="text-amber-500"
  >
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
  </svg>
);