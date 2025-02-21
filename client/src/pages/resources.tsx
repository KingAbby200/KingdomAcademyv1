import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Play,
  Book,
  Headphones,
  BookOpen,
  GraduationCap,
  ScrollText,
  TrendingUp,
  MessageSquare,
  ThumbsUp,
  MessageCircle,
  Send
} from "lucide-react";
import { NavigationBar } from "@/components/NavigationBar";
import { Link } from "wouter";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter
} from "@/components/ui/drawer";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  collection, 
  query, 
  where,
  orderBy, 
  limit, 
  getDocs, 
  addDoc, 
  doc,
  updateDoc,
  increment,
  serverTimestamp 
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

// Categories
const categories = [
  {
    id: "kingdom-insights",
    title: "Kingdom Insights",
    icon: ScrollText,
    color: "from-[#818cf8] to-[#4f46e5]",
    description: "Short video insights on faith and business"
  },
  {
    id: "bible",
    title: "Bible",
    icon: BookOpen,
    color: "from-[#60a5fa] to-[#2563eb]",
    description: "Read and study the Word of God",
    route: "/bible"
  },
  {
    id: "devotionals",
    title: "Devotionals",
    icon: Book,
    color: "from-[#4ade80] to-[#16a34a]",
    description: "Daily spiritual guidance",
    route: "/devotional"
  },
  {
    id: "podcasts",
    title: "Podcasts",
    icon: Headphones,
    color: "from-[#fbbf24] to-[#d97706]",
    description: "Audio content for spiritual growth"
  }
];

export default function Resources() {
  const [isInsightDrawerOpen, setIsInsightDrawerOpen] = useState(false);
  const [isCommentDrawerOpen, setIsCommentDrawerOpen] = useState(false);
  const [insight, setInsight] = useState("");
  const [selectedThread, setSelectedThread] = useState(null);
  const [comment, setComment] = useState("");
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  const queryClient = useQueryClient();
  const [user] = useAuthState(auth);

  // Fetch featured resource
  const { data: featuredResource, isLoading: loadingFeatured } = useQuery({
    queryKey: ['featured-resource'],
    queryFn: async () => {
      const resourcesRef = collection(db, 'resources');
      const q = query(resourcesRef, where('featured', '==', true), limit(1));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return {
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      };
    }
  });

  // Fetch discussion threads
  const { data: threads = [], isLoading: loadingThreads } = useQuery({
    queryKey: ['discussion-threads'],
    queryFn: async () => {
      const threadsRef = collection(db, 'posts');
      const q = query(threadsRef, orderBy('timestamp', 'desc'), limit(10));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
  });

  // Create new insight mutation
  const createInsightMutation = useMutation({
    mutationFn: async (insightText: string) => {
      if (!user) throw new Error('Must be logged in to post');

      const postRef = await addDoc(collection(db, 'posts'), {
        text: insightText,
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL,
        timestamp: serverTimestamp(),
        likes: 0,
        comments: []
      });

      return postRef;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-threads'] });
    }
  });

  // Add comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async ({ threadId, commentText }: { threadId: string; commentText: string }) => {
      if (!user) throw new Error('Must be logged in to comment');

      const commentRef = await addDoc(collection(db, `posts/${threadId}/comments`), {
        text: commentText,
        userId: user.uid,
        userName: user.displayName,
        userAvatar: user.photoURL,
        timestamp: serverTimestamp()
      });

      return commentRef;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discussion-threads'] });
    }
  });

  const handleLike = async (threadId: string) => {
    // Toggle like in UI immediately for better UX
    setLikedPosts(prev => ({
      ...prev,
      [threadId]: !prev[threadId]
    }));

    try {
      const threadRef = doc(db, 'posts', threadId);
      await updateDoc(threadRef, {
        likes: increment(likedPosts[threadId] ? -1 : 1)
      });
      queryClient.invalidateQueries({ queryKey: ['discussion-threads'] });
    } catch (error) {
      // Revert UI state if the operation fails
      setLikedPosts(prev => ({
        ...prev,
        [threadId]: !prev[threadId]
      }));
      console.error('Error updating like:', error);
    }
  };

  const handleShareInsight = async () => {
    if (!insight.trim()) return;

    try {
      await createInsightMutation.mutateAsync(insight);
      setInsight("");
      setIsInsightDrawerOpen(false);
    } catch (error) {
      console.error('Error sharing insight:', error);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !selectedThread) return;

    try {
      await addCommentMutation.mutateAsync({
        threadId: selectedThread.id,
        commentText: comment
      });
      setComment("");
      setIsCommentDrawerOpen(false);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main Container */}
      <div className="max-w-md mx-auto px-4 pt-4 pb-24">
        {/* Featured Resource */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Featured</h2>
          </div>
          {loadingFeatured ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading featured resource...</p>
            </div>
          ) : featuredResource ? (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="overflow-hidden">
                <div className="relative h-36">
                  <img
                    src={featuredResource.thumbnail}
                    alt={featuredResource.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/20" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
                        {featuredResource.type}
                      </span>
                    </div>
                    <h3 className="text-white font-semibold text-lg">{featuredResource.title}</h3>
                    <p className="text-white/80 text-sm">{featuredResource.author}</p>
                  </div>
                </div>
              </Card>
            </motion.div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No featured resource available</p>
            </div>
          )}
        </section>

        {/* Categories Grid */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <ScrollText className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Categories</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={category.route || `/resources/${category.id}`}
              >
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card className="p-4 h-24 flex flex-col justify-between overflow-hidden relative">
                    <category.icon className="h-6 w-6 text-white relative z-10" />
                    <h3 className="font-medium text-sm mt-2 text-white relative z-10">{category.title}</h3>
                    <div className={`absolute inset-0 bg-gradient-to-r ${category.color}`} />
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        </section>

        {/* Discussion Thread */}
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Community Insights</h2>
          </div>

          {/* Question Prompt Card */}
          <Card className="p-4 mb-4 bg-muted/50">
            <p className="text-sm font-medium text-muted-foreground">
              What's one insight, lesson, or revelation that stood out to you today? Share how it's impacting your faith, leadership, or daily life!
            </p>
            <Button
              className="w-full mt-3"
              variant="outline"
              onClick={() => setIsInsightDrawerOpen(true)}
            >
              Share Your Insight
            </Button>
          </Card>

          {/* Discussion Threads */}
          <div className="space-y-4">
            {loadingThreads ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading community insights...</p>
              </div>
            ) : threads.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Be the first to share an insight!</p>
              </div>
            ) : (
              threads.map((thread) => (
                <Card key={thread.id} className="p-4">
                  <div className="flex gap-3">
                    <Link href={`/profile/${thread.userId}`}>
                      <img
                        src={thread.userAvatar}
                        alt={thread.userName}
                        className="w-10 h-10 rounded-full object-cover cursor-pointer"
                      />
                    </Link>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${thread.userId}`}>
                            <h3 className="font-medium text-sm hover:text-primary cursor-pointer">
                              {thread.userName}
                            </h3>
                          </Link>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {thread.timestamp?.toDate().toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm mt-1 text-muted-foreground">{thread.text}</p>

                      {/* Reaction Buttons */}
                      <div className="flex items-center gap-6 mt-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 px-3 hover:bg-primary/5 transition-colors ${
                            likedPosts[thread.id] ? 'text-primary' : ''
                          }`}
                          onClick={() => handleLike(thread.id)}
                        >
                          <ThumbsUp className={`h-4 w-4 mr-2 ${likedPosts[thread.id] ? 'fill-current' : ''}`} />
                          <span className="text-sm font-medium">
                            {thread.likes + (likedPosts[thread.id] ? 1 : 0)}
                          </span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-3 hover:bg-primary/5 transition-colors"
                          onClick={() => {
                            setSelectedThread(thread);
                            setIsCommentDrawerOpen(true);
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-2" />
                          <span className="text-sm font-medium">{thread.comments?.length || 0}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>

      {/* Share Insight Drawer */}
      <Drawer open={isInsightDrawerOpen} onOpenChange={setIsInsightDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader>
              <DrawerTitle>Share Your Insight</DrawerTitle>
            </DrawerHeader>
            <div className="p-4">
              <Textarea
                placeholder="Share what's on your heart..."
                className="min-h-[150px]"
                value={insight}
                onChange={(e) => setInsight(e.target.value)}
              />
            </div>
            <DrawerFooter>
              <Button 
                onClick={handleShareInsight} 
                className="w-full"
                disabled={createInsightMutation.isPending}
              >
                {createInsightMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Share
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Comments Drawer */}
      <Drawer open={isCommentDrawerOpen} onOpenChange={setIsCommentDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto w-full max-w-md">
            <DrawerHeader>
              <DrawerTitle>Comments</DrawerTitle>
            </DrawerHeader>
            <div className="px-4">
              {/* Original Post */}
              {selectedThread && (
                <div className="mb-4 pb-4 border-b">
                  <div className="flex gap-3">
                    <Link href={`/profile/${selectedThread.userId}`}>
                      <img
                        src={selectedThread.userAvatar}
                        alt={selectedThread.userName}
                        className="w-8 h-8 rounded-full object-cover cursor-pointer"
                      />
                    </Link>
                    <div>
                      <div className="flex items-center gap-2">
                        <Link href={`/profile/${selectedThread.userId}`}>
                          <h3 className="font-medium text-sm hover:text-primary cursor-pointer">
                            {selectedThread.userName}
                          </h3>
                        </Link>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{selectedThread.text}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {selectedThread?.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <Link href={`/profile/${comment.userId}`}>
                      <img
                        src={comment.userAvatar}
                        alt={comment.userName}
                        className="w-8 h-8 rounded-full object-cover cursor-pointer"
                      />
                    </Link>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <Link href={`/profile/${comment.userId}`}>
                            <h3 className="font-medium text-sm hover:text-primary cursor-pointer">
                              {comment.userName}
                            </h3>
                          </Link>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {comment.timestamp?.toDate().toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Comment Form */}
            <div className="p-4 mt-4 border-t">
              <Textarea
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="min-h-[100px]"
              />
              <Button 
                onClick={handleAddComment} 
                className="w-full mt-3"
                disabled={addCommentMutation.isPending}
              >
                {addCommentMutation.isPending ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Comment
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}