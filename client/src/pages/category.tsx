import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Users, Lock, Globe, Search, X, Bell } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from '@/components/ui/input';
import { NavigationBar } from "@/components/NavigationBar";
import { roomCategories } from "./rooms";
import { setRoomReminder } from "@/lib/notifications";
import { toast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface Room {
  id: string;
  title: string;
  host: string | null;
  status: "live" | "upcoming";
  participants?: number;
  scheduledFor?: string;
}

export default function CategoryPage() {
  const [, params] = useRoute('/category/:id');
  const [, navigate] = useLocation();
  const categoryId = params?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeReminders, setActiveReminders] = useState<Set<string>>(new Set());
  const [joiningRoom, setJoiningRoom] = useState(false);

  const category = roomCategories.find(cat => cat.id === categoryId);

  const { data: rooms = [], isLoading } = useQuery<Room[]>({
    queryKey: ['/api/rooms', categoryId],
    queryFn: async () => {
      const response = await fetch(`/api/rooms?category=${categoryId}`);
      if (!response.ok) throw new Error('Failed to fetch rooms');
      return response.json();
    }
  });

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Category Not Found</h1>
          <Button onClick={() => navigate("/rooms")}>Return to Rooms</Button>
        </div>
      </div>
    );
  }

  const filteredRooms = rooms.filter(room =>
    room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (room.host && room.host.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const liveRooms = filteredRooms.filter(room => room.status === "live");
  const upcomingRooms = filteredRooms.filter(room => room.status === "upcoming");

  const handleSetReminder = async (room: Room, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!room.scheduledFor) return;

    const isSet = await setRoomReminder(room.id, new Date(room.scheduledFor));
    setActiveReminders(prev => {
      const newSet = new Set(prev);
      if (isSet) {
        newSet.add(room.id);
      } else {
        newSet.delete(room.id);
      }
      return newSet;
    });
  };

  const handleJoinRoom = async (roomId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (joiningRoom) return;

    try {
      setJoiningRoom(true);
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to join room');
      }

      const data = await response.json();
      console.log('Successfully joined room:', data);
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error('Failed to join room:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to connect to the room",
        variant: "destructive",
      });
    } finally {
      setJoiningRoom(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4 -ml-2 text-muted-foreground"
            onClick={() => navigate("/rooms")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Button>

          <div className={`bg-gradient-to-r ${category.gradient} rounded-xl p-6 text-white mb-8`}>
            <div className="flex items-start gap-4">
              <div className="bg-white/20 rounded-xl p-3">
                <category.icon className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">{category.title}</h1>
                <p className="text-white/90">{category.description}</p>
              </div>
            </div>
          </div>

          <div className="relative mb-8">
            <Input
              type="text"
              placeholder={`Search ${category.title} rooms...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading rooms...</p>
          </div>
        ) : (
          <>
            {liveRooms.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                  Live Now
                </h2>
                <div className="space-y-4">
                  {liveRooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleJoinRoom(room.id)}
                      >
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1.5 bg-red-500 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                              <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                              Live
                            </div>
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{room.title}</h3>
                          {room.host && <p className="text-muted-foreground mb-4">Hosted by {room.host}</p>}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span className="text-sm">{room.participants || 0} listening</span>
                            </div>
                            <Button 
                              size="sm"
                              onClick={(e) => handleJoinRoom(room.id, e)}
                              disabled={joiningRoom}
                            >
                              {joiningRoom ? "Joining..." : "Join Now"}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {upcomingRooms.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Upcoming
                </h2>
                <div className="space-y-4">
                  {upcomingRooms.map((room, index) => (
                    <motion.div
                      key={room.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card
                        className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate(`/room/${room.id}`)}
                      >
                        <div className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="flex items-center gap-1.5 bg-secondary rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(room.scheduledFor!), 'MMM d, h:mm a')}
                            </div>
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{room.title}</h3>
                          {room.host && <p className="text-muted-foreground">Hosted by {room.host}</p>}
                          <div className="mt-4">
                            <Button
                              size="sm"
                              variant={activeReminders.has(room.id) ? "default" : "outline"}
                              onClick={(e) => handleSetReminder(room, e)}
                              className="gap-2"
                            >
                              {activeReminders.has(room.id) ? (
                                <>
                                  <Bell className="h-4 w-4 fill-current" />
                                  Reminder Set
                                </>
                              ) : (
                                <>
                                  <Bell className="h-4 w-4" />
                                  Set Reminder
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {filteredRooms.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {rooms.length === 0 
                    ? "No rooms available in this category yet. Be the first to create one!"
                    : "No rooms found matching your search."}
                </p>
              </div>
            )}
          </>
        )}
      </div>
      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}