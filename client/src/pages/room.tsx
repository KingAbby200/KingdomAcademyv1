import "../lib/webrtc-polyfill";
import { useEffect, useRef, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Users, Hand, Mic, MicOff, MessageCircle, Crown, Video, VideoOff, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { getAvatarUrl } from "@/lib/avatar";
import { initializeSocket, getSocket, joinRoom, leaveRoom, sendRoomMessage } from "@/lib/socket";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  isHandRaised: boolean;
  isMuted: boolean;
  stream?: MediaStream;
  avatar?: string;
}

interface ChatMessage {
  id: string;
  participantId: string;
  participantName: string;
  text: string;
  timestamp: number;
}

export default function RoomPage() {
  console.log("RoomPage component mounting"); // Debug log
  const [, params] = useRoute<{ roomId: string }>("/room/:roomId");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [user, userLoading] = useAuthState(auth);

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Debug logs for state changes
  useEffect(() => {
    console.log("State update:", {
      userLoading,
      isConnecting,
      error,
      participantsCount: participants.length,
      currentParticipant: currentParticipant?.id
    });
  }, [userLoading, isConnecting, error, participants, currentParticipant]);

  // Scroll chat to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Socket.IO connection
  useEffect(() => {
    console.log("Starting socket initialization", { user, params }); // Debug log

    if (userLoading) {
      console.log("User still loading..."); // Debug log
      return;
    }

    if (!user) {
      console.log("No user found, setting error"); // Debug log
      setError("Please sign in to join a room");
      setIsConnecting(false);
      return;
    }

    if (!params?.roomId) {
      console.log("No room ID found, setting error"); // Debug log
      setError("Invalid room ID");
      setIsConnecting(false);
      return;
    }

    const initializeConnection = async () => {
      try {
        console.log("Initializing socket connection"); // Debug log
        setIsConnecting(true);
        const socket = await initializeSocket();
        console.log("Socket initialized successfully"); // Debug log

        // Join the room
        joinRoom(params.roomId);
        console.log("Joined room:", params.roomId); // Debug log

        socket.on("room:participants", ({ participants: roomParticipants }) => {
          console.log("Received participants update:", roomParticipants); // Debug log
          setParticipants(roomParticipants);
          // Set current participant
          const currentUser = roomParticipants.find(p => p.id === user.uid);
          if (currentUser) {
            setCurrentParticipant(currentUser);
          }
        });

        socket.on("message:room", ({ senderId, content }) => {
          console.log("Received room message:", { senderId, content }); // Debug log
          const sender = participants.find(p => p.id === senderId);
          if (sender) {
            setMessages(prev => [...prev, {
              id: `msg-${Date.now()}`,
              participantId: senderId,
              participantName: sender.name,
              text: content,
              timestamp: Date.now()
            }]);
          }
        });

        setIsConnecting(false);
        setError(null);
        setIsInitialized(true);
      } catch (error) {
        console.error("Socket connection error:", error);
        setError("Failed to connect to the room. Please try again.");
        setIsConnecting(false);
      }
    };

    initializeConnection();

    return () => {
      console.log("Cleaning up room connection"); // Debug log
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (params?.roomId) {
        leaveRoom(params.roomId);
      }
    };
  }, [user, userLoading, params?.roomId]);

  const handleLeaveRoom = () => {
    if (params?.roomId) {
      leaveRoom(params.roomId);
    }
    navigate("/rooms");
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params?.roomId || !newMessage.trim()) return;

    try {
      await sendRoomMessage(params.roomId, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message',
        variant: 'destructive'
      });
    }
  };

  const toggleHand = async () => {
    if (!currentParticipant || !params?.roomId) return;
    const socket = getSocket();
    socket.emit("participant:toggleHand", { roomId: params.roomId });
  };

  const toggleMute = async () => {
    if (!currentParticipant || !params?.roomId) return;
    const socket = getSocket();
    socket.emit("participant:toggleMute", { roomId: params.roomId });
  };

  const toggleVideo = () => {
    setIsVideoEnabled(!isVideoEnabled);
  };

  // Loading state
  if (userLoading || isConnecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {userLoading ? "Loading user..." : "Joining Room"}
          </h2>
          <p className="text-muted-foreground">Please wait...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Error</h1>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => navigate("/rooms")}>Return to Rooms</Button>
        </div>
      </div>
    );
  }

  // Invalid room state
  if (!params?.roomId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Invalid Room</h1>
          <Button onClick={() => navigate("/rooms")}>Return to Rooms</Button>
        </div>
      </div>
    );
  }

  // Not initialized yet
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Initializing Room</h2>
          <p className="text-muted-foreground">Setting up your room...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-7xl mx-auto px-4 pt-6 pb-24">
        {/* Room Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold mb-2 text-[#2D4356]">Kingdom Room</h1>
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Users className="h-5 w-5" />
            <span className="font-medium">{participants.length} Present</span>
          </div>
        </div>

        {/* Control Bar */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="bg-white/50 backdrop-blur-sm rounded-full p-2 flex justify-between items-center shadow-sm border border-[#435B66]/10">
            <Button
              variant={currentParticipant?.isHandRaised ? "default" : "ghost"}
              onClick={toggleHand}
              className="flex-1 gap-2 rounded-full px-4 py-6 bg-transparent hover:bg-[#435B66]/5 data-[state=open]:bg-[#435B66] data-[state=open]:text-white"
            >
              <Hand className="h-4 w-4" />
              <span className="hidden sm:inline">
                {currentParticipant?.isHandRaised ? "Lower Hand" : "Raise Hand"}
              </span>
            </Button>

            <div className="w-px h-8 bg-[#435B66]/10" />

            <Button
              variant={currentParticipant?.isMuted ? "default" : "ghost"}
              onClick={toggleMute}
              className="flex-1 gap-2 rounded-full px-4 py-6 bg-transparent hover:bg-[#435B66]/5 data-[state=open]:bg-[#435B66] data-[state=open]:text-white"
            >
              {currentParticipant?.isMuted ? (
                <MicOff className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {currentParticipant?.isMuted ? "Unmute" : "Mute"}
              </span>
            </Button>

            <div className="w-px h-8 bg-[#435B66]/10" />

            <Button
              variant={!isVideoEnabled ? "default" : "ghost"}
              onClick={toggleVideo}
              className="flex-1 gap-2 rounded-full px-4 py-6 bg-transparent hover:bg-[#435B66]/5 data-[state=open]:bg-[#435B66] data-[state=open]:text-white"
            >
              {!isVideoEnabled ? (
                <VideoOff className="h-4 w-4" />
              ) : (
                <Video className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {!isVideoEnabled ? "Start Video" : "Stop Video"}
              </span>
            </Button>

            <div className="w-px h-8 bg-[#435B66]/10" />

            <Button
              variant={isChatOpen ? "default" : "ghost"}
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="flex-1 gap-2 rounded-full px-4 py-6 bg-transparent hover:bg-[#435B66]/5 data-[state=open]:bg-[#435B66] data-[state=open]:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Chat</span>
            </Button>
          </div>
        </div>

        {/* Room Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`space-y-4 ${isChatOpen ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {/* Local Video */}
            <Card className="overflow-hidden aspect-video bg-[#435B66]/5 rounded-xl">
              <div className="relative w-full h-full">
                {isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#A76F6F]/5 to-[#435B66]/5 flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-20 h-20 rounded-full bg-[#A76F6F]/10 flex items-center justify-center mx-auto mb-3">
                        <img
                          src={getAvatarUrl(currentParticipant?.name || 'guest')}
                          alt={currentParticipant?.name || 'Guest'}
                          className="w-full h-full rounded-full"
                        />
                      </div>
                      <span className="text-[#435B66] font-medium">
                        Video Off
                      </span>
                    </div>
                  </div>
                )}

                {/* Status Indicators */}
                <div className="absolute top-4 right-4 flex gap-2">
                  {currentParticipant?.isHandRaised && (
                    <span className="bg-amber-500/80 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <Hand className="h-3 w-3" />
                      Hand Raised
                    </span>
                  )}
                  {currentParticipant?.isMuted && (
                    <span className="bg-red-500/80 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <MicOff className="h-3 w-3" />
                      Muted
                    </span>
                  )}
                </div>

                {/* Name Label */}
                <div className="absolute bottom-4 left-4">
                  <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    You {currentParticipant?.name ? `(${currentParticipant.name})` : ''}
                  </span>
                </div>
              </div>
            </Card>

            {/* Remote Participants */}
            {participants
              .filter(p => p.id !== currentParticipant?.id)
              .map((participant) => (
                <Card
                  key={participant.id}
                  className={`overflow-hidden aspect-video bg-[#435B66]/5 rounded-xl relative
                    ${participant.isHost
                    ? 'border-[#A76F6F] shadow-[0_0_0_1px] shadow-[#A76F6F]/50'
                    : 'border-gray-100 hover:border-[#A76F6F]/30'}`}
                >
                  <div className="relative w-full h-full">
                    <div className="absolute inset-0 bg-gradient-to-br from-[#A76F6F]/5 to-[#435B66]/5 flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 rounded-full bg-[#A76F6F]/10 flex items-center justify-center mx-auto mb-3">
                          <img
                            src={getAvatarUrl(participant.name)}
                            alt={participant.name}
                            className="w-full h-full rounded-full"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Status Indicators */}
                    <div className="absolute top-4 right-4 flex gap-2">
                      {participant.isHandRaised && (
                        <span className="bg-amber-500/80 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <Hand className="h-3 w-3" />
                          Hand Raised
                        </span>
                      )}
                      {participant.isMuted && (
                        <span className="bg-red-500/80 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <MicOff className="h-3 w-3" />
                          Muted
                        </span>
                      )}
                    </div>

                    {/* Name and Role Labels */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-2">
                      <span className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                        {participant.name}
                      </span>
                      {participant.isHost && (
                        <span className="bg-[#A76F6F]/80 text-white px-3 py-1 rounded-full text-sm flex items-center gap-1">
                          <Crown className="h-3 w-3" />
                          Host
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
          </div>

          {/* Chat Panel */}
          {isChatOpen && (
            <Card
              className="h-[calc(100vh-300px)] flex flex-col border-[#A76F6F]/30 bg-white/80 backdrop-blur-sm"
              style={{
                position: 'fixed',
                top: '20%',
                right: '1rem',
                width: 'calc(100% - 2rem)',
                maxWidth: '400px',
                height: '60vh',
                zIndex: 50,
              }}
            >
              <div className="p-4 border-b border-[#A76F6F]/20 flex justify-between items-center">
                <h3 className="font-serif font-semibold text-[#2D4356]">Fellowship Chat</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsChatOpen(false)}
                  className="h-8 w-8 rounded-full hover:bg-[#435B66]/10"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-serif font-medium text-sm text-[#2D4356]">
                        {message.participantName}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {format(message.timestamp, 'h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm bg-[#435B66]/5 rounded-lg p-3">
                      {message.text}
                    </p>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>

              <form onSubmit={sendMessage} className="p-4 border-t border-[#A76F6F]/20">
                <div className="flex gap-2">
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Share your thoughts..."
                    className="flex-1 border-[#A76F6F]/30 focus:border-[#A76F6F] focus:ring-[#A76F6F]"
                  />
                  <Button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="bg-[#435B66] hover:bg-[#435B66]/90"
                  >
                    Send
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[#FAF9F6]/80 backdrop-blur-sm border-t border-[#A76F6F]/20">
        <div className="max-w-7xl mx-auto flex justify-end">
          <Button
            variant="outline"
            onClick={handleLeaveRoom}
            className="border-[#A76F6F] text-[#A76F6F] hover:bg-[#A76F6F]/10"
          >
            Leave Room
          </Button>
        </div>
      </div>
    </div>
  );
}

const ParticipantVideo = ({ participant }: { participant: Participant }) => (
  <video
    autoPlay
    playsInline
    className="w-full h-full object-cover rounded-lg"
    ref={(element) => {
      if (element && participant.stream) {
        element.srcObject = participant.stream;
      }
    }}
  />
);