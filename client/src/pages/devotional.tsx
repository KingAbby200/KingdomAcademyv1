import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { NavigationBar } from '@/components/NavigationBar';
import { Headphones, Crown, Lightbulb, Mountain, Coins, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Topics remain the same, but without mock devotionals
export const topics = [
  {
    id: 'hearing-god',
    title: 'Hearing God',
    icon: Headphones,
    description: 'Develop a deeper connection with God through prayer, meditation, and spiritual discernment.',
    gradient: 'from-indigo-500 to-purple-500',
  },
  {
    id: 'kingdom-leadership',
    title: 'Kingdom Leadership',
    icon: Crown,
    description: 'Learn biblical principles of servant leadership and Kingdom-minded business practices.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'purpose-vision',
    title: 'Purpose & Vision',
    icon: Lightbulb,
    description: 'Discover your God-given purpose and develop a clear vision for your life and business.',
    gradient: 'from-amber-500 to-orange-500',
  },
  {
    id: 'overcoming-obstacles',
    title: 'Overcoming Obstacles',
    icon: Mountain,
    description: 'Find strength and wisdom to overcome challenges in business and life through faith.',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    id: 'wealth-stewardship',
    title: 'Wealth & Stewardship',
    icon: Coins,
    description: 'Learn biblical principles of financial management and Kingdom-focused wealth creation.',
    gradient: 'from-rose-500 to-pink-500',
  }
] as const;

export type Topic = (typeof topics)[number];

interface Devotional {
  id: string;
  title: string;
  description: string;
  topicId: string;
}

export default function DevotionalPage() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  // Fetch devotionals for the selected topic
  const { data: devotionals = [], isLoading } = useQuery({
    queryKey: ['devotionals', selectedTopic],
    queryFn: async () => {
      if (!selectedTopic) return [];

      const devotionalsRef = collection(db, 'devotionals');
      const q = query(devotionalsRef, where('topicId', '==', selectedTopic));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Devotional[];
    },
    enabled: !!selectedTopic
  });

  const handleTopicClick = (topicId: string) => {
    setSelectedTopic(selectedTopic === topicId ? null : topicId);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Main content container with increased bottom padding */}
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
        <Link href="/resources">
          <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Resources
          </Button>
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Daily Devotionals</h1>
          <p className="text-muted-foreground">
            Strengthen your faith and business practice with biblical wisdom
          </p>
        </div>

        <div className="space-y-4">
          {topics.map((topic) => {
            const Icon = topic.icon;
            const isSelected = selectedTopic === topic.id;

            return (
              <Card
                key={topic.id}
                className={`overflow-hidden cursor-pointer transition-all ${
                  isSelected ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => handleTopicClick(topic.id)}
              >
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${topic.gradient} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold mb-1">{topic.title}</h2>
                      <p className="text-muted-foreground text-sm">{topic.description}</p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="mt-4 pt-4 border-t">
                      {isLoading ? (
                        <div className="flex justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                        </div>
                      ) : devotionals.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No devotionals available for this topic yet.</p>
                        </div>
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
                          {devotionals.map((devotional) => (
                            <Link
                              key={devotional.id}
                              href={`/devotional/${topic.id}/${devotional.id}`}
                            >
                              <div
                                className="p-3 rounded-lg bg-secondary/20 hover:bg-secondary/30 transition-colors cursor-pointer"
                              >
                                <h3 className="font-medium text-primary mb-1">
                                  {devotional.title}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {devotional.description}
                                </p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}