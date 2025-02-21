import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Globe, Edit, Search } from 'lucide-react';
import { Link, useLocation, useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';
import { NavigationBar } from '@/components/NavigationBar';
import { getAvatarUrl } from '@/lib/utils';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useToast } from "@/hooks/use-toast";

interface ProfileData {
  id: string;
  name: string;
  username?: string;
  title: string;
  avatar?: string;
  bio: string;
  website?: string;
  welcomeVideo?: string;
  videoThumbnail?: string;
  inBreakoutRoom?: string | null;
}

export default function ProfilePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setLocation] = useLocation();
  const [, params] = useRoute('/profile/:id');
  const [user] = useAuthState(auth);
  const { toast } = useToast();

  // Use the route param if available, otherwise use the current user's ID
  const profileId = params?.id || user?.uid;

  const { data: profile, isLoading, error } = useQuery<ProfileData>({
    queryKey: ['/api/profile', profileId],
    enabled: !!profileId,
    retry: 1,
    onError: (error) => {
      console.error('Profile fetch error:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive"
      });
    }
  });

  useEffect(() => {
    if (!user && !params?.id) {
      setLocation('/');
    }
  }, [user, params?.id, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-destructive">Error loading profile. Please try again.</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center gap-4">
        <div className="text-muted-foreground">Profile not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <div className="max-w-2xl mx-auto p-4 pt-6">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <Avatar className="h-32 w-32 ring-4 ring-primary/10">
              <img 
                src={profile.avatar || getAvatarUrl(profile.name)} 
                alt={profile.name} 
                className="object-cover" 
              />
            </Avatar>
            {profile.inBreakoutRoom && (
              <div className="absolute bottom-0 right-0 bg-green-500 text-white text-xs px-3 py-1 rounded-full animate-pulse">
                Live in {profile.inBreakoutRoom}
              </div>
            )}
          </div>

          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">{profile.name}</h1>
            {profile.username && (
              <p className="text-muted-foreground">@{profile.username}</p>
            )}
            <p className="text-primary font-medium">{profile.title}</p>
          </div>

          <div className="flex gap-3 w-full max-w-xs justify-center">
            {user?.uid === profileId && (
              <Button 
                variant="outline"
                onClick={() => setLocation('/edit-profile')}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
            <div className="flex gap-2">
              {profile.website && (
                <Button variant="outline" asChild>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4" />
                  </a>
                </Button>
              )}
              <Button 
                variant="outline"
                onClick={() => setLocation('/search')}
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="w-full space-y-6">
            <div className="space-y-2">
              <h2 className="font-semibold">About</h2>
              <p className="text-muted-foreground">{profile.bio}</p>
            </div>

            {profile.welcomeVideo && (
              <div className="space-y-2">
                <h2 className="font-semibold">Welcome Message</h2>
                <div
                  className="relative aspect-video w-full rounded-lg overflow-hidden cursor-pointer"
                  onClick={() => setIsPlaying(!isPlaying)}
                >
                  {isPlaying ? (
                    <video
                      src={profile.welcomeVideo}
                      poster={profile.videoThumbnail}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="relative">
                      <img
                        src={profile.videoThumbnail}
                        alt="Video thumbnail"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center">
                          <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-primary border-b-8 border-b-transparent ml-1" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}