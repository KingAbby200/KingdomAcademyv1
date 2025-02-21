import { useRoute, Link } from "wouter";
import { Card } from "@/components/ui/card";
import { NavigationBar } from "@/components/NavigationBar";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { topics, type Topic } from "./devotional";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Devotional {
  id: string;
  title: string;
  description: string;
  content: string;
  scripture: string;
  reflection: string;
  prayer: string;
  topicId: string;
}

export default function DevotionalDetail() {
  const [, params] = useRoute<{ topicId: string; devotionalId: string }>("/devotional/:topicId/:devotionalId");

  if (!params) return null;

  const topic = topics.find((t: Topic) => t.id === params.topicId);

  const { data: devotional, isLoading } = useQuery({
    queryKey: ['devotional', params.devotionalId],
    queryFn: async () => {
      const devotionalRef = doc(db, 'devotionals', params.devotionalId);
      const snapshot = await getDoc(devotionalRef);
      if (!snapshot.exists()) return null;
      return {
        id: snapshot.id,
        ...snapshot.data()
      } as Devotional;
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!topic || !devotional) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Devotional Not Found</h1>
          <Link href="/devotional">
            <Button>Return to Devotionals</Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = topic.icon;

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <Link href="/devotional">
          <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Devotionals
          </Button>
        </Link>

        <Card className="overflow-hidden">
          <div className={`bg-gradient-to-r ${topic.gradient} p-6 text-white`}>
            <div className="flex items-start gap-4">
              <div className="bg-white/20 rounded-xl p-3">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-sm mb-2">
                  {topic.title}
                </span>
                <h1 className="text-2xl font-bold">{devotional.title}</h1>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <h2 className="font-semibold text-lg mb-2">Scripture</h2>
              <p className="text-muted-foreground">{devotional.scripture}</p>
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-2">Reflection</h2>
              <p className="text-muted-foreground leading-relaxed">{devotional.reflection}</p>
            </div>
            <div>
              <h2 className="font-semibold text-lg mb-2">Prayer</h2>
              <p className="text-muted-foreground leading-relaxed">{devotional.prayer}</p>
            </div>
          </div>
        </Card>
      </div>
      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}