import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ArrowLeft, Upload, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NavigationBar } from "@/components/NavigationBar";
import { Avatar } from "@/components/ui/avatar";
import { getAvatarUrl } from '@/lib/avatar';
import { SubscriptionManager } from "@/components/SubscriptionManager";
import { auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  bio: z.string().min(10, "Bio must be at least 10 characters"),
  website: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  welcomeVideo: z.string().url("Please enter a valid video URL").optional().or(z.literal("")),
});

type FormValues = z.infer<typeof formSchema>;

export default function EditProfilePage() {
  const [, navigate] = useLocation();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>("");
  const [user] = useAuthState(auth);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      title: "",
      bio: "",
      website: "",
      welcomeVideo: "",
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.uid) {
        navigate('/'); // Redirect to home if no user
        return;
      }

      try {
        const response = await fetch(`/api/profile/${user.uid}`);
        if (!response.ok) throw new Error('Failed to load profile');

        const profile = await response.json();
        setAvatarPreview(profile.avatar || getAvatarUrl(profile.name));

        form.reset({
          name: profile.name || "",
          title: profile.title || "",
          bio: profile.bio || "",
          website: profile.website || "",
          welcomeVideo: profile.welcomeVideo || "",
        });
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive"
        });
      }
    };

    loadProfile();
  }, [user?.uid, form.reset, toast, navigate]);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        setAvatarFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setAvatarPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload an image file",
          variant: "destructive"
        });
      }
    }
  };

  const handleVideoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
      } else {
        toast({
          title: "Invalid File",
          description: "Please upload a video file",
          variant: "destructive"
        });
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    if (!user?.uid) {
      toast({
        title: "Error",
        description: "You must be logged in to update your profile",
        variant: "destructive"
      });
      return;
    }

    try {
      // First update the basic profile data
      const response = await fetch(`/api/profile/${user.uid}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update profile');

      // If we have files to upload, do it in a separate request
      if (avatarFile || videoFile) {
        const formData = new FormData();
        if (avatarFile) formData.append('avatar', avatarFile);
        if (videoFile) formData.append('video', videoFile);

        const uploadResponse = await fetch(`/api/profile/${user.uid}/media`, {
          method: 'POST',
          body: formData,
        });

        if (!uploadResponse.ok) throw new Error('Failed to upload media');
      }

      // Invalidate queries to refresh the data
      await queryClient.invalidateQueries({ queryKey: ['profile', user.uid] });

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });

      navigate(`/profile/${user.uid}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      });
    }
  };

  if (!user?.uid) return null; // Don't render anything if not logged in

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        <Button 
          variant="ghost" 
          className="mb-6 -ml-2 text-muted-foreground"
          onClick={() => navigate(`/profile/${user.uid}`)}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground mt-2">
            Update your profile information
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Profile Picture Upload */}
          <div className="mb-8 flex flex-col items-center">
            <div className="relative">
              <Avatar className="h-32 w-32 ring-4 ring-primary/10">
                <img src={avatarPreview} alt="Profile" className="object-cover" />
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full cursor-pointer hover:bg-primary/90 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Click the camera icon to update your profile picture
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your full name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Your professional title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell us about yourself..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="website"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input placeholder="https://your-website.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full">
                Save Changes
              </Button>
            </form>
          </Form>

          {/* Subscription Management Section */}
          <div className="mt-8 pt-8 border-t">
            <h2 className="text-xl font-semibold mb-4">Subscription Management</h2>
            <SubscriptionManager userId={user.uid} />
          </div>
        </motion.div>
      </div>

      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}