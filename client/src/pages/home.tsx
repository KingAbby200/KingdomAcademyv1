import { useCallback, useState, useEffect } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { CommunityCard } from '@/components/CommunityCard';
import { KingdomKeyTab } from '@/components/KingdomKeyTab';
import { EventsTab } from '@/components/EventsTab';
import { NavigationBar } from '@/components/NavigationBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreatePostButton } from '@/components/CreatePostButton';
import { CommentModal } from '@/components/CommentModal';
import { motion } from 'framer-motion';
import { Crown } from '@/components/icons/Crown';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Post {
  id: string;
  content: {
    type: 'text' | 'image' | 'video' | 'kingdom_insight';
    data: string;
    thumbnail?: string;
    caption?: string;
    gradient?: string;
  };
  user: {
    name: string;
    avatar: string;
    inBreakoutRoom: string | null;
    username?: string;
  };
  timestamp: number;
}

export default function Home() {
  const [openTab, setOpenTab] = useState<'kingdom' | 'events' | null>(null);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [crownClicks, setCrownClicks] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const { toast } = useToast();
  const [location, navigate] = useLocation();
  const [activeCommentPost, setActiveCommentPost] = useState<null | {
    postId: string;
    comments: Array<{
      id: string;
      text: string;
      user: {
        name: string;
        avatar: string;
      };
      likes: number;
      replies?: any[];
      timestamp: number;
      reactions: {
        love: number;
        amen: number;
        blessed: number;
      };
      userReaction?: 'love' | 'amen' | 'blessed';
    }>;
    onAddComment: (text: string, parentId?: string) => void;
    onLikeComment: (commentId: string, reaction: 'love' | 'amen' | 'blessed') => void;
  }>(null);

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: false,
    loop: false
  });

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['/api/posts'],
    queryFn: async () => {
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('timestamp', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
    }
  });

  const handleAddComment = useCallback((postId: string) => (text: string, parentId?: string) => {
    setActiveCommentPost((current) => {
      if (!current || current.postId !== postId) return current;

      const newComment = {
        id: Date.now().toString(),
        text,
        user: {
          name: "You",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=current",
        },
        likes: 0,
        timestamp: Date.now(),
        reactions: {
          love: 0,
          amen: 0,
          blessed: 0
        },
        userReaction: undefined
      };

      return {
        ...current,
        comments: [newComment, ...current.comments]
      };
    });
  }, []);

  const handleLikeComment = useCallback((postId: string) => (commentId: string, reaction: 'love' | 'amen' | 'blessed') => {
    setActiveCommentPost((current) => {
      if (!current || current.postId !== postId) return current;

      return {
        ...current,
        comments: current.comments.map(comment => {
          if (comment.id === commentId) {
            const updatedReactions = { ...comment.reactions };
            if (comment.userReaction) {
              updatedReactions[comment.userReaction]--;
            }
            updatedReactions[reaction]++;

            return {
              ...comment,
              reactions: updatedReactions,
              userReaction: reaction
            };
          }
          return comment;
        })
      };
    });
  }, []);

  const handleCrownClick = useCallback(() => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime > 1000) {
      setCrownClicks(1);
    } else {
      setCrownClicks(prev => prev + 1);
    }

    setLastClickTime(currentTime);

    if (crownClicks + 1 === 5) {
      setShowAdminModal(true);
      setCrownClicks(0);
    }
  }, [crownClicks, lastClickTime]);

  const handleAdminAccess = useCallback(() => {
    if (adminPassword === 'kingdom2025') {
      setShowAdminModal(false);
      setAdminPassword('');
      navigate('/admin');
      toast({
        title: "Access Granted",
        description: "Welcome to the admin panel",
      });
    } else {
      toast({
        title: "Access Denied",
        description: "Incorrect password",
        variant: "destructive"
      });
      setAdminPassword('');
    }
  }, [adminPassword, navigate, toast]);

  // Check for create=true in URL when component mounts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('create') === 'true') {
      setIsCreatePostOpen(true);
      // Remove the create parameter from URL
      navigate('/home', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-40 h-28 bg-background/80 backdrop-blur-sm">
        <div className="relative max-w-3xl mx-auto px-4">
          <div className="flex flex-col items-center justify-center h-28 gap-1">
            <div className="flex items-center gap-2">
              <div className="flex-shrink-0 w-[140px] relative z-50">
                <KingdomKeyTab
                  isOpen={openTab === 'kingdom'}
                  onToggle={() => setOpenTab(openTab === 'kingdom' ? null : 'kingdom')}
                />
              </div>

              <motion.button
                className="relative bg-gradient-to-r from-amber-500 to-yellow-600 p-3 rounded-xl shadow-xl mx-2 z-40"
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.9 }}
                initial={{ y: 0 }}
                animate={{
                  y: [0, -4, 0],
                  transition: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                onClick={handleCrownClick}
              >
                <Crown className="h-5 w-5 text-white" />
              </motion.button>

              <div className="flex-shrink-0 w-[140px] relative z-50">
                <EventsTab
                  isOpen={openTab === 'events'}
                  onToggle={() => setOpenTab(openTab === 'events' ? null : 'events')}
                />
              </div>
            </div>
            <span className="text-xs font-medium bg-gradient-to-r from-amber-500 to-yellow-600 bg-clip-text text-transparent">
              Kingdom Academy
            </span>
          </div>
        </div>
      </div>

      <div className="relative w-full pt-32">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg font-medium mb-2">No posts yet</p>
            <p className="text-muted-foreground">Be the first to share something!</p>
          </div>
        ) : (
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {posts.map((post: Post) => (
                <CommunityCard
                  key={post.id}
                  content={post.content}
                  user={post.user}
                  timestamp={post.timestamp}
                  onCommentClick={() => setActiveCommentPost({
                    postId: post.id,
                    comments: [],
                    onAddComment: handleAddComment(post.id),
                    onLikeComment: handleLikeComment(post.id)
                  })}
                  onProfileClick={(username) => `/profile/${username}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <Dialog open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen}>
        <CreatePostButton />
      </Dialog>

      {activeCommentPost && (
        <CommentModal
          isOpen={true}
          onClose={() => setActiveCommentPost(null)}
          comments={activeCommentPost.comments}
          onAddComment={activeCommentPost.onAddComment}
          onLikeComment={activeCommentPost.onLikeComment}
        />
      )}

      <NavigationBar onCreatePost={() => setIsCreatePostOpen(true)} />

      <Dialog open={showAdminModal} onOpenChange={setShowAdminModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admin Access</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              type="password"
              placeholder="Enter admin password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdminAccess()}
            />
            <Button onClick={handleAdminAccess}>
              Access Admin Panel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}