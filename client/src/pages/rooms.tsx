import { motion } from "framer-motion";
import { Users, Crown, BookOpen, Users2, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { NavigationBar } from "@/components/NavigationBar";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { useState, useEffect } from 'react';
import { toast } from "@/hooks/use-toast";
import { getAvatarUrl } from "@/lib/utils";

interface Room {
  id: string;
  title: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  scheduledFor: string;
  participantCount: number;
  host: {
    id: string;
    name: string;
    avatar: string;
    title: string;
    username: string;
  } | null;
}

interface RoomCategory {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: typeof Users;
  gradient: string;
}

export const roomCategories: RoomCategory[] = [
  {
    id: "leadership",
    title: "Kingdom Leadership Lab",
    description: "Marketplace leaders, entrepreneurs, and visionaries discussing leadership strategies and faith-driven impact.",
    category: "Leadership & Business",
    icon: Crown,
    gradient: "from-purple-500 to-indigo-600",
  },
  {
    id: "networking",
    title: "Kingdom Connect",
    description: "Network, collaborate, and receive mentorship with Kingdom-minded professionals.",
    category: "Networking & Mentorship",
    icon: Users2,
    gradient: "from-orange-500 to-rose-600",
  },
  {
    id: "prayer",
    title: "Prayer & Prophetic Hub",
    description: "Live prayer, intercession, and prophetic encouragement for personal breakthrough.",
    category: "Prayer & Prophecy",
    icon: Users,
    gradient: "from-blue-500 to-cyan-600",
  },
  {
    id: "bible",
    title: "Deep Dive Bible Study",
    description: "In-depth scripture exploration, discipleship discussions, and Kingdom revelation.",
    category: "Bible Study",
    icon: BookOpen,
    gradient: "from-emerald-500 to-teal-600",
  },
];

export default function RoomsPage() {
  const [, navigate] = useLocation();
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch('/api/rooms');
        if (!response.ok) throw new Error('Failed to fetch rooms');
        const data = await response.json();
        setRooms(data);
      } catch (error) {
        console.error('Error fetching rooms:', error);
        toast({
          title: "Error",
          description: "Failed to load rooms. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleJoinRoom = async (roomId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    if (joiningRoom) return;

    try {
      setJoiningRoom(true);
      console.log('Attempting to join room:', roomId);

      // Generate a guest user
      const guestName = `Guest ${Math.floor(Math.random() * 1000)}`;
      const response = await fetch(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: guestName,
          avatar: getAvatarUrl(guestName),
          title: "Guest User",
          username: `guest_${Math.floor(Math.random() * 1000)}`
        }),
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

  // Get all live rooms (rooms happening now)
  const liveRooms = rooms.filter(room => {
    const roomDate = new Date(room.scheduledFor);
    const now = new Date();
    // Consider a room "live" if it's scheduled within the last hour
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    return roomDate >= hourAgo && roomDate <= now;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading rooms...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        {/* Header with Create Room button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold">Kingdom Rooms</h1>
            <Button
              onClick={() => navigate("/create-room")}
              className="bg-gradient-to-r from-[#A76F6F] to-[#2D4356] hover:from-[#A76F6F]/90 hover:to-[#2D4356]/90 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Create Room
            </Button>
          </div>
          <p className="text-muted-foreground">
            Step into purpose-driven spaces designed to equip, empower, and connect Kingdom leaders in the marketplace
          </p>
        </motion.div>

        {/* Live Rooms Section */}
        {liveRooms.length > 0 && (
          <div className="mb-12">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              Live Now
            </h2>
            <div className="overflow-x-auto pb-4 -mx-4 px-4 hide-scrollbar">
              <div className="flex gap-4">
                {liveRooms.map((room, index) => (
                  <motion.div
                    key={room.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{
                      opacity: 1,
                      x: 0,
                      transition: { delay: index * 0.1 }
                    }}
                    className="flex-shrink-0 w-[300px]"
                  >
                    <Card
                      className="overflow-hidden hover:shadow-lg transition-shadow h-[160px] group cursor-pointer"
                      onClick={() => handleJoinRoom(room.id)}
                    >
                      <div className="h-full p-4 flex flex-col">
                        <div className="flex items-center gap-2 mb-3">
                          <div className="flex items-center gap-1.5 bg-red-500 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-white">
                            <div className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            Live
                          </div>
                          <span className="text-xs bg-secondary px-2.5 py-1 rounded-full">
                            {room.category}
                          </span>
                        </div>
                        <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors">
                          {room.title}
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          {room.host ? `Hosted by ${room.host.name}` : 'No host yet'}
                        </p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span className="text-sm">{room.participantCount} listening</span>
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
          </div>
        )}

        {/* Room Categories */}
        <div className="space-y-4">
          {roomCategories.map((category, index) => {
            const Icon = category.icon;
            const categoryRooms = rooms.filter(room => room.category === category.category);
            const liveCount = categoryRooms.filter(room => {
              const roomDate = new Date(room.scheduledFor);
              const now = new Date();
              const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);
              return roomDate >= hourAgo && roomDate <= now;
            }).length;
            const upcomingCount = categoryRooms.filter(room => {
              const roomDate = new Date(room.scheduledFor);
              const now = new Date();
              return roomDate > now;
            }).length;

            return (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: index * 0.1 }
                }}
                onClick={() => navigate(`/category/${category.id}`)}
                className="cursor-pointer"
              >
                <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
                  <div className={`bg-gradient-to-r ${category.gradient} p-6 text-white`}>
                    <div className="flex items-start gap-4">
                      <div className="bg-white/20 rounded-xl p-3">
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <span className="inline-block px-3 py-1 rounded-full bg-white/20 text-sm mb-3">
                          {category.category}
                        </span>
                        <h3 className="text-xl font-bold mb-2">{category.title}</h3>
                        <p className="text-white/90 leading-relaxed mb-4">
                          {category.description}
                        </p>
                        <div className="flex items-center gap-3">
                          {liveCount > 0 && (
                            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                              <Users className="h-4 w-4" />
                              <span className="text-sm">{liveCount} Live Now</span>
                            </div>
                          )}
                          {upcomingCount > 0 && (
                            <div className="flex items-center gap-2 bg-white/20 rounded-full px-3 py-1">
                              <Users className="h-4 w-4" />
                              <span className="text-sm">{upcomingCount} Upcoming</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>

      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}