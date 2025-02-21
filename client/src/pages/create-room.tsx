import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, Users, Lock, Globe, Search, X } from "lucide-react";
import { format, set } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { roomCategories } from "./rooms";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const createRoomSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  privacy: z.enum(["public", "private"]),
  goLiveNow: z.boolean().default(false),
  scheduledFor: z.date().optional(),
  invitedParticipants: z.array(z.string()).optional(),
});

type CreateRoomValues = z.infer<typeof createRoomSchema>;

interface User {
  id: string;
  name: string;
  avatar: string;
}

export default function CreateRoomPage() {
  const [, navigate] = useLocation();
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['/api/users', searchQuery],
    queryFn: async () => {
      const response = await fetch(`/api/users${searchQuery ? `?q=${encodeURIComponent(searchQuery)}` : ''}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
    enabled: searchOpen
  });

  const form = useForm<CreateRoomValues>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      privacy: "public",
      invitedParticipants: [],
      goLiveNow: false,
      scheduledFor: new Date(),
    },
  });

  const goLiveNow = form.watch("goLiveNow");

  const onSubmit = async (data: CreateRoomValues) => {
    try {
      const response = await fetch("/api/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          scheduledFor: data.goLiveNow ? new Date() : data.scheduledFor,
          invitedParticipants: selectedUsers.map(user => user.id),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Error creating room",
          description: errorData.error || "Failed to create room",
          variant: "destructive",
        });
        return;
      }

      const room = await response.json();
      toast({
        title: "Success",
        description: "Room created successfully",
      });

      // If going live now, redirect to room directly
      if (data.goLiveNow) {
        navigate(`/room/${room.id}`);
      } else {
        // Otherwise, navigate to the category page
        navigate(`/category/${roomCategories.find(cat => cat.category === room.category)?.id}`);
      }
    } catch (error) {
      console.error("Failed to create room:", error);
      toast({
        title: "Error",
        description: "Failed to create room. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            className="mb-4 -ml-2 text-[#2D4356]"
            onClick={() => navigate("/rooms")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Rooms
          </Button>

          <div className="bg-gradient-to-br from-[#A76F6F] to-[#435B66] p-8 rounded-t-2xl">
            <div className="text-center text-white">
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl font-serif font-bold mb-3"
              >
                Create Room
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-white/90 max-w-md mx-auto"
              >
                Design a dedicated space for fellowship, learning, and spiritual growth
              </motion.p>
            </div>
          </div>

          <Card className="bg-white/90 backdrop-blur-sm border-[#A76F6F]/30 rounded-b-2xl">
            <div className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Room Title */}
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#2D4356] font-serif text-lg">Room Title</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter room title..."
                            className="border-[#A76F6F]/30 focus:border-[#A76F6F] focus:ring-[#A76F6F] h-12 text-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Room Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#2D4356] font-serif text-lg">Purpose & Vision</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Share the purpose and vision of this space..."
                            className="border-[#A76F6F]/30 focus:border-[#A76F6F] focus:ring-[#A76F6F] h-12 text-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Room Category */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#2D4356] font-serif text-lg">Room Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="border-[#A76F6F]/30 focus:border-[#A76F6F] focus:ring-[#A76F6F] h-12">
                              <SelectValue placeholder="Select a room type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {roomCategories.map((category) => (
                              <SelectItem
                                key={category.id}
                                value={category.category}
                                className="font-serif"
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${category.gradient}`} />
                                  {category.title}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-6">
                    {/* Privacy Settings */}
                    <FormField
                      control={form.control}
                      name="privacy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#2D4356] font-serif text-lg">Privacy</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="border-[#A76F6F]/30 focus:border-[#A76F6F] focus:ring-[#A76F6F] h-12">
                                <SelectValue placeholder="Select privacy setting" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="public">
                                <div className="flex items-center gap-2">
                                  <Globe className="h-4 w-4 text-[#435B66]" />
                                  <span>Public Space</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="private">
                                <div className="flex items-center gap-2">
                                  <Lock className="h-4 w-4 text-[#435B66]" />
                                  <span>Private Space</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Go Live Toggle */}
                    <FormField
                      control={form.control}
                      name="goLiveNow"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[#2D4356] font-serif text-lg">Room Timing</FormLabel>
                          <div className="flex items-center justify-between rounded-lg border border-[#A76F6F]/30 p-4">
                            <div className="space-y-0.5">
                              <FormLabel>Go Live Now</FormLabel>
                              <FormDescription>
                                Start your room immediately
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Schedule Date/Time - Only show if not going live now */}
                  {!goLiveNow && (
                    <FormField
                      control={form.control}
                      name="scheduledFor"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel className="text-[#2D4356] font-serif text-lg">Schedule For</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "w-full pl-3 text-left font-normal h-12 border-[#A76F6F]/30 hover:bg-[#A76F6F]/5",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  <Calendar className="mr-2 h-4 w-4" />
                                  <span className="truncate">
                                    {field.value ? (
                                      format(field.value, "PPP 'at' h:mm a")
                                    ) : (
                                      "Pick date and time"
                                    )}
                                  </span>
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <div className="p-3">
                                <CalendarComponent
                                  mode="single"
                                  selected={field.value}
                                  onSelect={(date) => {
                                    if (date) {
                                      const currentTime = field.value || new Date();
                                      const newDate = set(date, {
                                        hours: currentTime.getHours(),
                                        minutes: currentTime.getMinutes()
                                      });
                                      field.onChange(newDate);
                                    }
                                  }}
                                  initialFocus
                                />
                                <div className="mt-4 border-t border-[#A76F6F]/20 pt-4">
                                  <div className="flex items-center justify-between">
                                    <Label className="text-[#2D4356] font-serif">Time</Label>
                                    <div className="flex items-center space-x-2">
                                      <Select
                                        value={format(field.value || new Date(), "h")}
                                        onValueChange={(hour) => {
                                          const currentDate = field.value || new Date();
                                          const isPM = format(currentDate, "a") === "PM";
                                          const newHour = parseInt(hour) + (isPM ? 12 : 0);
                                          const newDate = set(currentDate, {
                                            hours: newHour === 24 ? 12 : newHour,
                                          });
                                          field.onChange(newDate);
                                        }}
                                      >
                                        <SelectTrigger className="w-[70px]">
                                          <SelectValue placeholder="Hour" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Array.from({ length: 12 }).map((_, i) => (
                                            <SelectItem
                                              key={i + 1}
                                              value={(i + 1).toString()}
                                            >
                                              {(i + 1).toString()}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <span className="text-[#2D4356]">:</span>
                                      <Select
                                        value={format(field.value || new Date(), "mm")}
                                        onValueChange={(minute) => {
                                          const newDate = set(field.value || new Date(), {
                                            minutes: parseInt(minute),
                                          });
                                          field.onChange(newDate);
                                        }}
                                      >
                                        <SelectTrigger className="w-[70px]">
                                          <SelectValue placeholder="Min" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Array.from({ length: 60 }).map((_, i) => (
                                            <SelectItem key={i} value={i.toString().padStart(2, "0")}>
                                              {i.toString().padStart(2, "0")}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <Select
                                        value={format(field.value || new Date(), "a")}
                                        onValueChange={(period) => {
                                          const currentDate = field.value || new Date();
                                          const currentHour = currentDate.getHours();
                                          const newHour = period === "PM"
                                            ? (currentHour % 12) + 12
                                            : currentHour % 12;
                                          const newDate = set(currentDate, {
                                            hours: newHour,
                                          });
                                          field.onChange(newDate);
                                        }}
                                      >
                                        <SelectTrigger className="w-[70px]">
                                          <SelectValue placeholder="AM/PM" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="AM">AM</SelectItem>
                                          <SelectItem value="PM">PM</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Invite Users (only shown for private rooms) */}
                  {form.watch("privacy") === "private" && (
                    <FormItem>
                      <FormLabel className="text-[#2D4356] font-serif text-lg">Invite Users</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                className="w-full justify-between border-[#A76F6F]/30 hover:bg-[#A76F6F]/5 h-12"
                              >
                                <span className="flex items-center gap-2">
                                  <Search className="h-4 w-4" />
                                  Search users...
                                </span>
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-0" align="start">
                              <Command>
                                <CommandInput
                                  placeholder="Search users..."
                                  value={searchQuery}
                                  onValueChange={setSearchQuery}
                                />
                                <CommandEmpty>No users found.</CommandEmpty>
                                <CommandGroup>
                                  {loadingUsers ? (
                                    <div className="p-4 text-center">
                                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary mx-auto" />
                                    </div>
                                  ) : (
                                    users
                                      .filter(user => !selectedUsers.some(selected => selected.id === user.id))
                                      .map(user => (
                                        <CommandItem
                                          key={user.id}
                                          onSelect={() => {
                                            setSelectedUsers(prev => [...prev, user]);
                                            setSearchOpen(false);
                                            setSearchQuery("");
                                          }}
                                          className="flex items-center gap-2 p-2"
                                        >
                                          <Avatar>
                                            <img
                                              src={user.avatar}
                                              alt={user.name}
                                              className="h-8 w-8 rounded-full"
                                            />
                                          </Avatar>
                                          <span>{user.name}</span>
                                        </CommandItem>
                                      ))
                                  )}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>

                          {/* Selected Users */}
                          {selectedUsers.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {selectedUsers.map(user => (
                                <Badge
                                  key={user.id}
                                  variant="secondary"
                                  className="flex items-center gap-1 py-1 px-2"
                                >
                                  <img
                                    src={user.avatar}
                                    alt={user.name}
                                    className="h-4 w-4 rounded-full"
                                  />
                                  {user.name}
                                  <button
                                    type="button"
                                    onClick={() => setSelectedUsers(prev => prev.filter(u => u.id !== user.id))}
                                    className="ml-1 hover:bg-[#A76F6F]/10 rounded-full p-1"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormDescription className="text-[#435B66]">
                        Search and select users to invite to this private room
                      </FormDescription>
                    </FormItem>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#A76F6F] to-[#435B66] hover:from-[#A76F6F]/90 hover:to-[#435B66]/90 text-white font-serif h-12 text-lg"
                  >
                    {goLiveNow ? "Go Live Now" : "Create Room"}
                  </Button>
                </form>
              </Form>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}