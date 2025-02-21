import { useState } from 'react';
import { useLocation } from 'wouter';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { Calendar as CalendarIcon,
         Key as KeyIcon,
         BookOpen,
         Video,
         Headphones,
         ArrowLeft,
         Star } from 'lucide-react';

// Mock organizations data - This would come from your API in production
const organizations = [
  { id: '1', name: 'Kingdom Business Solutions', category: 'business' },
  { id: '2', name: 'Faith Media Productions', category: 'entertainment' },
  { id: '3', name: 'Grace Educational Institute', category: 'education' },
  { id: '4', name: 'Harvest Ministry Network', category: 'ministry' },
];

// Mock resources data -  This would come from your API in production
const resources = [
  { id: 1, title: 'Resource A', type: 'insight' },
  { id: 2, title: 'Resource B', type: 'podcast' },
  { id: 3, title: 'Resource C', type: 'devotional' },
  { id: 4, title: 'Resource D', type: 'insight' },
  { id: 5, title: 'Resource E', type: 'podcast' },
];

interface Resource {
  id: number;
  title: string;
  type: 'insight' | 'podcast' | 'devotional';
}


export default function AdminPanel() {
  const [, navigate] = useLocation();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  // Featured Organization Management
  const [selectedOrganization, setSelectedOrganization] = useState<string>('');

  // Kingdom Keys Management
  const [keyTitle, setKeyTitle] = useState('');
  const [keyDescription, setKeyDescription] = useState('');

  // Kingdom Events Management
  const [eventTitle, setEventTitle] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventTime, setEventTime] = useState('09:00');

  // Resources Management
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceDescription, setResourceDescription] = useState('');
  const [resourceType, setResourceType] = useState<'insight' | 'podcast' | 'devotional'>('insight');
  const [insightDestination, setInsightDestination] = useState<'community' | 'resource'>('community');
  const [resourceVideo, setResourceVideo] = useState<File | null>(null);
  const [resourceAudio, setResourceAudio] = useState<File | null>(null);
  const [resourceCoverArt, setResourceCoverArt] = useState<File | null>(null);
  const [resourceCategory, setResourceCategory] = useState('hearing-god');
  const [resourceAuthor, setResourceAuthor] = useState('');
  const [resourceDuration, setResourceDuration] = useState('');
  const [devotionalScripture, setDevotionalScripture] = useState('');
  const [devotionalReflection, setDevotionalReflection] = useState('');
  const [devotionalPrayer, setDevotionalPrayer] = useState('');
  const [scheduleDate, setScheduleDate] = useState<Date | undefined>(new Date());
  const [scheduleTime, setScheduleTime] = useState('12:00');
  const [selectedResource, setSelectedResource] = useState('');
  const [resources, setResources] = useState<Resource[]>([]);


  const handleSetFeatured = () => {
    if (!selectedOrganization) {
      toast({
        title: "Error",
        description: "Please select an organization to feature",
        variant: "destructive"
      });
      return;
    }

    // Here you would typically make an API call to update the featured organization
    toast({
      title: "Organization Featured",
      description: "The selected organization is now featured on the marketplace",
    });
  };

  const handleSetFeaturedResource = async () => {
    if (!selectedResource) {
      toast({
        title: "Error",
        description: "Please select a resource to feature",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`/api/resources/${selectedResource}/feature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ featured: true })
      });

      if (!response.ok) throw new Error('Failed to update resource');

      toast({
        title: "Resource Featured",
        description: "The selected resource is now featured on the resources page",
      });
    } catch (error) {
      console.error('Error featuring resource:', error);
      toast({
        title: "Error",
        description: "Failed to set resource as featured",
        variant: "destructive"
      });
    }
  };

  const handleSubmitKey = () => {
    toast({
      title: "Kingdom Key Added",
      description: "The new Kingdom Key has been successfully added.",
    });
  };

  const handleSubmitEvent = () => {
    toast({
      title: "Event Added",
      description: "The new event has been successfully added to the calendar.",
    });
  };

  const handleSubmitResource = () => {
    if (resourceType === 'insight') {
      if (!resourceVideo) {
        toast({
          title: "Missing Video",
          description: "Please upload a video for the Kingdom Insight.",
          variant: "destructive"
        });
        return;
      }

      if (insightDestination === 'community') {
        // Create a post in the community feed
        const scheduledDateTime = scheduleDate ? new Date(
          scheduleDate.setHours(
            parseInt(scheduleTime.split(':')[0]),
            parseInt(scheduleTime.split(':')[1])
          )
        ) : null;

        console.log("Creating community post:", {
          type: 'video',
          text: resourceTitle,
          description: resourceDescription,
          file: resourceVideo,
          thumbnail: resourceCoverArt,
          postType: 'kingdom_insight',
          scheduledFor: scheduledDateTime
        });

        toast({
          title: "Community Insight Posted",
          description: `Video will be posted on ${format(scheduledDateTime!, 'PPP')} at ${scheduleTime}`,
        });
        return;
      } else {
        //handle resource
      }
    }

    if (resourceType === 'podcast' && !resourceAudio) {
      toast({
        title: "Missing Audio",
        description: "Please upload an audio file for the Podcast.",
        variant: "destructive"
      });
      return;
    }

    if (!resourceCoverArt) {
      toast({
        title: "Missing Cover Art",
        description: "Please upload cover art for the resource.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Resource Added",
      description: `New ${resourceType} has been added to the resources page.`,
    });
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <Button 
        variant="ghost" 
        className="mb-4 -ml-2 text-muted-foreground"
        onClick={() => navigate('/home')}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Home
      </Button>

      <h1 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent">
        Kingdom Admin Panel
      </h1>

      <Tabs defaultValue="featured" className="w-full">
        <div className="border-b mb-8">
          <TabsList className="flex flex-wrap w-full h-auto p-0 bg-transparent">
            <TabsTrigger value="featured" className="flex items-center gap-2 px-4 py-3 text-base font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent min-w-[140px] justify-center">
              <Star className="w-4 h-4" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="keys" className="flex items-center gap-2 px-4 py-3 text-base font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent min-w-[140px] justify-center">
              <KeyIcon className="w-4 h-4" />
              Kingdom Keys
            </TabsTrigger>
            <TabsTrigger value="events" className="flex items-center gap-2 px-4 py-3 text-base font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent min-w-[140px] justify-center">
              <CalendarIcon className="w-4 h-4" />
              Events
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2 px-4 py-3 text-base font-medium data-[state=active]:text-primary data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none bg-transparent min-w-[140px] justify-center">
              <BookOpen className="w-4 h-4" />
              Resources
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="featured">
          <Card className="p-6">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-semibold mb-4">Set Featured Organization</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="organization">Select Organization</Label>
                    <Select
                      value={selectedOrganization}
                      onValueChange={setSelectedOrganization}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose an organization to feature" />
                      </SelectTrigger>
                      <SelectContent>
                        {organizations.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.name} - {org.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleSetFeatured} className="w-full">
                    <Star className="mr-2 h-4 w-4" />
                    Set as Featured Organization
                  </Button>
                </div>
              </div>

              <div className="border-t pt-8">
                <h2 className="text-2xl font-semibold mb-4">Set Featured Resource</h2>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="resourceType">Resource Type</Label>
                    <Select
                      value={resourceType}
                      onValueChange={(value: 'insight' | 'podcast' | 'devotional') => {
                        setResourceType(value);
                        setSelectedResource(''); // Reset selected resource when type changes
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select resource type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="insight">Kingdom Insight</SelectItem>
                        <SelectItem value="podcast">Podcast Episode</SelectItem>
                        <SelectItem value="devotional">Daily Devotional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="resource">Select Resource</Label>
                    <Select
                      value={selectedResource}
                      onValueChange={setSelectedResource}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a resource to feature" />
                      </SelectTrigger>
                      <SelectContent>
                        {resources
                          .filter(resource => resource.type === resourceType)
                          .map((resource) => (
                            <SelectItem key={resource.id} value={resource.id.toString()}>
                              {resource.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    onClick={handleSetFeaturedResource} 
                    className="w-full"
                    disabled={!selectedResource}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Set as Featured Resource
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="keys">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Add New Kingdom Key</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="keyTitle">Title</Label>
                <Input
                  id="keyTitle"
                  value={keyTitle}
                  onChange={(e) => setKeyTitle(e.target.value)}
                  placeholder="Enter key title"
                />
              </div>
              <div>
                <Label htmlFor="keyDescription">Description</Label>
                <Textarea
                  id="keyDescription"
                  value={keyDescription}
                  onChange={(e) => setKeyDescription(e.target.value)}
                  placeholder="Enter key description"
                  rows={4}
                />
              </div>
              <Button onClick={handleSubmitKey} className="w-full">
                Add Kingdom Key
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Schedule New Event</h2>
            <div className="grid gap-6">
              <div>
                <Label htmlFor="eventTitle">Event Title</Label>
                <Input
                  id="eventTitle"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Enter event title"
                />
              </div>
              <div>
                <Label htmlFor="eventDescription">Event Description</Label>
                <Textarea
                  id="eventDescription"
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  placeholder="Enter event description"
                  rows={4}
                />
              </div>
              <div className="grid gap-4">
                <Label>Event Date</Label>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label htmlFor="eventTime">Event Time</Label>
                <Input
                  id="eventTime"
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                />
              </div>
              <Button onClick={handleSubmitEvent} className="w-full">
                Schedule Event
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">Add New Resource</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="resourceType">Resource Type</Label>
                <Select
                  value={resourceType}
                  onValueChange={(value: 'insight' | 'podcast' | 'devotional') => setResourceType(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select resource type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="insight">Kingdom Insight Video</SelectItem>
                    <SelectItem value="podcast">Podcast Episode</SelectItem>
                    <SelectItem value="devotional">Daily Devotional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {resourceType === 'insight' && (
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label>Content Destination</Label>
                    <div className="flex space-x-4">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={insightDestination === 'community'}
                          onChange={() => setInsightDestination('community')}
                          className="form-radio"
                        />
                        <span>Community Feed Post</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          checked={insightDestination === 'resource'}
                          onChange={() => setInsightDestination('resource')}
                          className="form-radio"
                        />
                        <span>Resource Page Content</span>
                      </label>
                    </div>
                  </div>

                  {insightDestination === 'community' && (
                    <>
                      <div className="grid gap-4">
                        <Label>Schedule Date</Label>
                        <Calendar
                          mode="single"
                          selected={scheduleDate}
                          onSelect={setScheduleDate}
                          className="rounded-md border"
                        />
                      </div>
                      <div>
                        <Label htmlFor="scheduleTime">Schedule Time</Label>
                        <Input
                          id="scheduleTime"
                          type="time"
                          value={scheduleTime}
                          onChange={(e) => setScheduleTime(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="resourceTitle">Title</Label>
                <Input
                  id="resourceTitle"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="Enter resource title"
                />
              </div>

              <div>
                <Label htmlFor="resourceDescription">Description</Label>
                <Textarea
                  id="resourceDescription"
                  value={resourceDescription}
                  onChange={(e) => setResourceDescription(e.target.value)}
                  placeholder="Enter resource description"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="resourceCategory">Category</Label>
                <Select
                  value={resourceCategory}
                  onValueChange={setResourceCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hearing-god">Hearing God</SelectItem>
                    <SelectItem value="kingdom-leadership">Kingdom Leadership</SelectItem>
                    <SelectItem value="purpose-vision">Purpose & Vision</SelectItem>
                    <SelectItem value="overcoming-obstacles">Overcoming Obstacles</SelectItem>
                    <SelectItem value="wealth-stewardship">Wealth & Stewardship</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="resourceAuthor">Author/Host</Label>
                <Input
                  id="resourceAuthor"
                  value={resourceAuthor}
                  onChange={(e) => setResourceAuthor(e.target.value)}
                  placeholder="Enter author or host name"
                />
              </div>

              <div>
                <Label htmlFor="resourceDuration">Duration</Label>
                <Input
                  id="resourceDuration"
                  value={resourceDuration}
                  onChange={(e) => setResourceDuration(e.target.value)}
                  placeholder="e.g., '45 min' or '2:30'"
                />
              </div>

              {resourceType === 'insight' ? (
                <div>
                  <Label htmlFor="resourceVideo">Upload Video (9:16 Aspect Ratio)</Label>
                  <Input
                    id="resourceVideo"
                    type="file"
                    accept="video/*"
                    onChange={(e) => setResourceVideo(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your video in vertical orientation (reel size)
                  </p>
                </div>
              ) : resourceType === 'podcast' ? (
                <div>
                  <Label htmlFor="resourceAudio">Upload Podcast Episode</Label>
                  <Input
                    id="resourceAudio"
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setResourceAudio(e.target.files?.[0] || null)}
                    className="cursor-pointer"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload your podcast episode (MP3 format recommended)
                  </p>
                </div>
              ) : (
                // Devotional specific fields
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="devotionalScripture">Scripture Reference</Label>
                    <Input
                      id="devotionalScripture"
                      value={devotionalScripture}
                      onChange={(e) => setDevotionalScripture(e.target.value)}
                      placeholder="e.g., John 3:16"
                      className="mb-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="devotionalReflection">Reflection</Label>
                    <Textarea
                      id="devotionalReflection"
                      value={devotionalReflection}
                      onChange={(e) => setDevotionalReflection(e.target.value)}
                      placeholder="Write your devotional reflection..."
                      rows={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="devotionalPrayer">Prayer</Label>
                    <Textarea
                      id="devotionalPrayer"
                      value={devotionalPrayer}
                      onChange={(e) => setDevotionalPrayer(e.target.value)}
                      placeholder="Write a prayer for this devotional..."
                      rows={4}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="resourceCoverArt">Upload Cover Art</Label>
                <Input
                  id="resourceCoverArt"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setResourceCoverArt(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Upload cover art for your {
                    resourceType === 'insight' ? 'video' :
                    resourceType === 'podcast' ? 'podcast' :
                    'devotional'
                  }
                </p>
              </div>

              <Button
                onClick={handleSubmitResource}
                className="w-full"
                disabled={
                  !resourceCoverArt ||
                  (resourceType === 'insight' && !resourceVideo) ||
                  (resourceType === 'podcast' && !resourceAudio)
                }
              >
                {resourceType === 'insight' ? (
                  <>
                    <Video className="mr-2 h-4 w-4" />
                    Add Kingdom Insight
                  </>
                ) : resourceType === 'podcast' ? (
                  <>
                    <Headphones className="mr-2 h-4 w-4" />
                    Add Podcast Episode
                  </>
                ) : (
                  <>
                    <BookOpen className="mr-2 h-4 w-4" />
                    Add Devotional
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}