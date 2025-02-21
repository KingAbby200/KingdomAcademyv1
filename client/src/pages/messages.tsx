import { useEffect, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Paperclip, Mic, Image, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar } from "@/components/ui/avatar";
import { AudioRecorder } from 'react-audio-voice-recorder';
import { useLocation, useParams } from "wouter";
import { collection, query, where, orderBy, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

interface Message {
  id: string;
  text: string;
  timestamp: any;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  read: boolean;
}

interface FileAttachment {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name: string;
  preview?: string;
}

export default function MessagesPage() {
  const { username } = useParams();
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [, setLocation] = useLocation();
  const [user] = useAuthState(auth);

  // Fetch recipient user data
  const { data: recipientUser, isLoading: loadingUser } = useQuery({
    queryKey: ['user', username],
    queryFn: async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;
      return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
    },
    enabled: !!username
  });

  // Fetch messages
  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', username],
    queryFn: async () => {
      if (!user || !recipientUser) return [];

      const messagesRef = collection(db, 'messages');
      const q = query(
        messagesRef,
        where('participants', 'array-contains', user.uid),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
    },
    enabled: !!user && !!recipientUser
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: { text: string; attachments?: FileAttachment[] }) => {
      if (!user || !recipientUser) throw new Error('Missing user data');

      const messageRef = await addDoc(collection(db, 'messages'), {
        text: messageData.text,
        senderId: user.uid,
        senderName: user.displayName,
        senderAvatar: user.photoURL,
        recipientId: recipientUser.id,
        timestamp: serverTimestamp(),
        attachments: messageData.attachments || [],
        read: false,
        participants: [user.uid, recipientUser.id]
      });

      return messageRef;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', username] });
    }
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() && attachments.length === 0) return;

    await sendMessageMutation.mutateAsync({
      text: newMessage.trim(),
      attachments
    });

    setNewMessage("");
    setAttachments([]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      const isImage = file.type.startsWith('image/');
      reader.onload = () => {
        const newAttachment: FileAttachment = {
          type: isImage ? 'image' : 'file',
          url: reader.result as string,
          name: file.name,
          preview: isImage ? reader.result as string : undefined
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleVoiceRecording = (blob: Blob) => {
    const reader = new FileReader();
    reader.onload = () => {
      setAttachments(prev => [...prev, {
        type: 'audio',
        url: reader.result as string,
        name: 'Voice Message'
      }]);
    };
    reader.readAsDataURL(blob);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (loadingUser) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!recipientUser) {
    return <div className="flex items-center justify-center h-screen">User not found</div>;
  }

  return (
    <div className="h-screen bg-[#FCF5E5] flex flex-col">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-sm shadow-sm border-b border-[#A76F6F]/10 py-3 px-4 flex items-center gap-3 fixed top-0 left-0 right-0 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setLocation('/messenger')}
          className="h-10 w-10 rounded-full hover:bg-[#A76F6F]/10"
        >
          <ArrowLeft className="h-5 w-5 text-[#2D4356]" />
        </Button>
        <Avatar className="h-10 w-10 ring-2 ring-[#A76F6F]/20">
          <img src={recipientUser.avatar} alt={recipientUser.name} />
        </Avatar>
        <div>
          <h2 className="text-[#2D4356] font-medium">{recipientUser.name}</h2>
          <p className="text-sm text-[#435B66]/70">{recipientUser.title}</p>
        </div>
      </div>

      {/* Messages Area */}
      <ScrollArea className="flex-1 pt-20 pb-20 px-4">
        <div className="max-w-2xl mx-auto space-y-4">
          {loadingMessages ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading messages...</p>
            </div>
          ) : (
            messages.map((message) => (
              <div 
                key={message.id} 
                className={`flex ${message.senderId === user?.uid ? "justify-end" : "justify-start"}`}
              >
                <div className={`bg-white/90 rounded-2xl rounded-tl-sm px-4 py-2 shadow-sm max-w-[70%] ${
                  message.senderId === user?.uid 
                    ? "bg-gradient-to-r from-[#A76F6F] to-[#8B5E5E] text-white rounded-tr-sm" 
                    : ""
                }`}>
                  <p className={`${message.senderId === user?.uid ? "text-white" : "text-[#2D4356]"}`}>
                    {message.text}
                  </p>
                  <span className={`text-xs ${
                    message.senderId === user?.uid ? "text-white/70" : "text-[#435B66]/50"
                  } mt-1 block`}>
                    {new Date(message.timestamp?.toDate()).toLocaleTimeString()} 
                    {message.read ? ' (Read)' : ''}
                  </span>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Message Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-[#A76F6F]/10 py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <div className="flex-1 bg-white rounded-full shadow-inner border border-[#A76F6F]/20">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="border-0 focus:ring-0 rounded-full bg-transparent px-6 py-3 placeholder-[#435B66]/50"
              />
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
            />

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => fileInputRef.current?.click()}
                className="h-12 w-12 rounded-full hover:bg-[#A76F6F]/10 transition-colors duration-200"
              >
                <Paperclip className="h-5 w-5 text-[#A76F6F]" />
              </Button>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e) => handleFileSelect(e as any);
                  input.click();
                }}
                className="h-12 w-12 rounded-full hover:bg-[#A76F6F]/10 transition-colors duration-200"
              >
                <Image className="h-5 w-5 text-[#A76F6F]" />
              </Button>

              <AudioRecorder
                onRecordingComplete={handleVoiceRecording}
                downloadOnSavePress={false}
                classes={{
                  AudioRecorderClass: "h-12 w-12 rounded-full hover:bg-[#A76F6F]/10 flex items-center justify-center transition-colors duration-200"
                }}
              />

              <Button
                type="submit"
                className="h-12 w-12 rounded-full p-0 bg-gradient-to-r from-[#A76F6F] to-[#8B5E5E] hover:from-[#8B5E5E] hover:to-[#A76F6F] shadow transition-all duration-200 hover:scale-105"
                disabled={sendMessageMutation.isPending}
              >
                {sendMessageMutation.isPending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <Send className="h-5 w-5 text-white" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}