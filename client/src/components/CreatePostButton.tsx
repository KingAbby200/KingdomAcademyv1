import { useState } from 'react';
import { Image, Video, Type } from 'lucide-react';
import { DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { addDoc, collection } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const gradients = [
  {
    name: 'Purple-Pink',
    value: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)'
  },
  {
    name: 'Blue-Teal',
    value: 'linear-gradient(135deg, #3b82f6 0%, #0d9488 100%)'
  },
  {
    name: 'Orange-Rose',
    value: 'linear-gradient(135deg, #f97316 0%, #e11d48 100%)'
  },
  {
    name: 'Green-Blue',
    value: 'linear-gradient(135deg, #22c55e 0%, #0ea5e9 100%)'
  },
  {
    name: 'Amber-Orange',
    value: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)'
  }
];

export function CreatePostButton() {
  const [selectedGradient, setSelectedGradient] = useState(gradients[0].value);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [postText, setPostText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const createPostMutation = useMutation({
    mutationFn: async ({ 
      type, 
      text, 
      file, 
      description, 
      thumbnail, 
      postType = 'regular',
      scheduledFor = null 
    }: { 
      type: 'text' | 'image' | 'video', 
      text: string, 
      file?: File | null,
      description?: string,
      thumbnail?: File | null,
      postType?: 'regular' | 'kingdom_insight',
      scheduledFor?: Date | null
    }) => {
      let mediaUrl = '';
      let thumbnailUrl = '';

      if (file) {
        const storageRef = ref(storage, `posts/${file.name}-${Date.now()}`);
        await uploadBytes(storageRef, file);
        mediaUrl = await getDownloadURL(storageRef);
      }

      if (thumbnail) {
        const thumbnailRef = ref(storage, `posts/thumbnails/${thumbnail.name}-${Date.now()}`);
        await uploadBytes(thumbnailRef, thumbnail);
        thumbnailUrl = await getDownloadURL(thumbnailRef);
      }

      const postsRef = collection(db, 'posts');
      const post = {
        content: {
          type,
          data: type === 'text' ? text : mediaUrl,
          caption: type !== 'text' ? text : undefined,
          description: description,
          thumbnail: thumbnailUrl,
          gradient: type === 'text' ? selectedGradient : undefined,
        },
        postType,
        scheduledFor: scheduledFor?.getTime() || null,
        user: {
          name: "Kingdom Academy",
          avatar: "/kingdom-academy-logo.svg",
          inBreakoutRoom: null,
          username: "kingdom_academy"
        },
        timestamp: Date.now()
      };

      await addDoc(postsRef, post);
    },
    onSuccess: () => {
      setMediaPreview(null);
      setPostText('');
      setSelectedFile(null);
      setSelectedThumbnail(null);
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['/api/posts'] });
      toast({
        title: "Success",
        description: "Your post has been created!"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      });
      console.error('Failed to create post:', error);
    }
  });

  const handleMediaChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setMediaPreview(url);
    }
  };

  const handleThumbnailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedThumbnail(file);
    }
  };

  const handleSubmit = (type: 'text' | 'image' | 'video') => {
    if (createPostMutation.isPending) return;

    createPostMutation.mutate({
      type,
      text: postText,
      file: type !== 'text' ? selectedFile : undefined,
      description: description,
      thumbnail: selectedThumbnail,
      postType: 'regular' // Default to 'regular' post type
    });
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Create Post</h2>
      </div>

      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="text" className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Text
          </TabsTrigger>
          <TabsTrigger value="image" className="flex items-center gap-2">
            <Image className="h-4 w-4" />
            Image
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video
          </TabsTrigger>
        </TabsList>

        <TabsContent value="text" className="space-y-4">
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Choose Background</Label>
              <div className="grid grid-cols-5 gap-2">
                {gradients.map((gradient) => (
                  <button
                    key={gradient.name}
                    className={`h-8 rounded-md transition-all ${
                      selectedGradient === gradient.value ? 'ring-2 ring-primary' : ''
                    }`}
                    style={{ background: gradient.value }}
                    onClick={() => setSelectedGradient(gradient.value)}
                  />
                ))}
              </div>
            </div>
            <Textarea
              placeholder="Share your thoughts..."
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              className="min-h-[150px]"
            />
            <Button 
              className="w-full" 
              onClick={() => handleSubmit('text')}
              disabled={!postText.trim() || createPostMutation.isPending}
            >
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="image">
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Upload Image</Label>
              <Input
                type="file"
                accept="image/*"
                onChange={handleMediaChange}
              />
              {mediaPreview && (
                <div className="relative aspect-video mt-2">
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="rounded-lg object-cover w-full h-full"
                  />
                </div>
              )}
            </div>
            <Textarea
              placeholder="Add a caption (optional)"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            <Button 
              className="w-full" 
              onClick={() => handleSubmit('image')}
              disabled={!mediaPreview || createPostMutation.isPending}
            >
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="video">
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Upload Video</Label>
              <Input
                type="file"
                accept="video/*"
                onChange={handleMediaChange}
              />
              {mediaPreview && (
                <div className="relative aspect-video mt-2">
                  <video
                    src={mediaPreview}
                    controls
                    className="rounded-lg w-full h-full"
                  />
                </div>
              )}
            </div>
            <Textarea
              placeholder="Add a caption (optional)"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            <Button 
              className="w-full" 
              onClick={() => handleSubmit('video')}
              disabled={!mediaPreview || createPostMutation.isPending}
            >
              {createPostMutation.isPending ? "Posting..." : "Post"}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </DialogContent>
  );
}