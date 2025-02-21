import { useState } from 'react';
import { NavigationBar } from '@/components/NavigationBar';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';

interface Conversation {
  id: string;
  participants: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    title: string;
  }[];
  lastMessage: {
    text: string;
    timestamp: string;
  };
  unread: boolean;
}

export default function MessengerPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/conversations');
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    }
  });

  const filteredConversations = conversations.filter(
    conversation => 
      conversation.participants.some(participant =>
        participant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        participant.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Conversations List */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading conversations...</p>
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg font-medium mb-2">No conversations found</p>
                <p className="text-muted-foreground">
                  {conversations.length === 0 
                    ? "Start connecting with other members!"
                    : "Try adjusting your search terms"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conversation) => (
                <Link key={conversation.id} href={`/messages/${conversation.id}`}>
                  <Card className="p-4 hover:bg-accent/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-3">
                      <img
                        src={conversation.participants[0].avatar}
                        alt={conversation.participants[0].name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="truncate">
                            <h3 className="font-medium text-sm">
                              {conversation.participants[0].name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.participants[0].title}
                            </p>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground">
                              {conversation.lastMessage.timestamp}
                            </span>
                            {conversation.unread && (
                              <span className="w-2 h-2 rounded-full bg-primary mt-1" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {conversation.lastMessage.text}
                        </p>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}