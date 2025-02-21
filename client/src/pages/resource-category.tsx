import { useParams, useLocation } from "wouter";
import { NavigationBar } from "@/components/NavigationBar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, ArrowLeft, Headphones, Book } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useRealtimeUpdates } from "@/hooks/use-realtime-updates";

// Types for the resource items
interface BaseResourceItem {
  id: string;
  title: string;
  thumbnail: string;
}

interface VideoItem extends BaseResourceItem {
  type: 'video';
  author: string;
  duration: string;
}

interface BlogItem extends BaseResourceItem {
  type: 'blog';
  author: string;
  readTime: string;
}

interface PodcastItem extends BaseResourceItem {
  type: 'podcast';
  host: string;
  duration: string;
}

interface BibleItem extends BaseResourceItem {
  type: 'bible';
  author: string;
  readTime: string;
}

type ResourceItem = VideoItem | BlogItem | PodcastItem | BibleItem;

interface CategorySection {
  title: string;
  items: ResourceItem[];
}

interface ResourceType {
  title: string;
  description: string;
  type: 'video' | 'blog' | 'podcast' | 'bible';
  categories: CategorySection[];
}

interface DevotionalType {
  title: string;
  items: never[];
}

type ResourcesByCategory = {
  'kingdom-insights': ResourceType;
  'bible': ResourceType;
  podcasts: ResourceType;
  devotionals: DevotionalType;
};

export default function ResourceCategory() {
  const { category } = useParams();
  const [, navigate] = useLocation();
  const queryKey = ['/api/resources', category];
  const { refresh } = useRealtimeUpdates(queryKey);

  const { data: resourceData, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const response = await fetch(`/api/resources/${category}`);
      if (!response.ok) throw new Error('Failed to fetch resources');
      return response.json();
    },
    enabled: category !== 'bible' && category !== 'devotionals'
  });

  useEffect(() => {
    if (category === "bible") {
      navigate("/bible");
      return;
    }
    if (category === "devotionals") {
      navigate("/devotional");
    }
  }, [category, navigate]);

  if (!resourceData) {
    return <div>Category not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        <Link href="/resources">
          <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resources
          </Button>
        </Link>

        <h1 className="text-2xl font-semibold mb-6">{resourceData.title}</h1>

        <PullToRefresh onRefresh={refresh}>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading resources...</p>
            </div>
          ) : (
            <div className="space-y-8">
              {resourceData.categories?.map((category) => (
                <div key={category.title} className="overflow-hidden">
                  <h2 className="text-lg font-medium mb-4 sticky top-0 bg-background z-10 pb-2">
                    {category.title}
                  </h2>

                  {resourceData.type === 'video' ? (
                    <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[calc(100vh-20rem)] pb-4 -mx-4 px-4 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                      {category.items.map((item) => (
                        <motion.div
                          key={item.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          className="aspect-[9/16]"
                        >
                          <Card className="overflow-hidden h-full">
                            <div className="relative h-full">
                              <img
                                src={item.thumbnail}
                                alt={item.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-3">
                                <h3 className="text-white font-medium text-sm mb-1">{item.title}</h3>
                                {'author' in item && <p className="text-white/80 text-xs">{item.author}</p>}
                                {'duration' in item && <span className="text-white/60 text-xs">{item.duration}</span>}
                              </div>
                              <Button
                                size="icon"
                                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-primary/80 text-primary-foreground hover:bg-primary/90"
                              >
                                <Play className="h-6 w-6" />
                              </Button>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
                      <div className="flex gap-4">
                        {category.items.map((item) => (
                          <motion.div
                            key={item.id}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="flex-shrink-0 w-[160px]"
                          >
                            <Card className="overflow-hidden">
                              <div className="relative aspect-square">
                                <img
                                  src={item.thumbnail}
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                                <div className="absolute bottom-0 left-0 right-0 p-3">
                                  <h3 className="text-white font-medium text-sm mb-1 line-clamp-2">
                                    {item.title}
                                  </h3>
                                  <p className="text-white/80 text-xs">
                                    {item.type === 'podcast' ? item.host : 'author' in item ? item.author : ''}
                                  </p>
                                  {('duration' in item || 'readTime' in item) && (
                                    <div className="flex items-center gap-2 mt-1">
                                      {item.type === 'podcast' ? (
                                        <Headphones className="h-3 w-3 text-white/60" />
                                      ) : (
                                        <Book className="h-3 w-3 text-white/60" />
                                      )}
                                      <span className="text-white/60 text-xs">
                                        {'duration' in item ? item.duration : 'readTime' in item ? item.readTime : ''}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </PullToRefresh>
      </div>
      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}