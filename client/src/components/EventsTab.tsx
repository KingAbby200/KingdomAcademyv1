import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const CalendarIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    className="glow"
    style={{
      filter: "drop-shadow(0 0 8px rgba(255,215,0,0.5))"
    }}
  >
    <motion.path
      d="M19 4H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2zm-7 5h5v5h-5v-5z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={{ pathLength: 0 }}
      animate={{ pathLength: 1 }}
      transition={{
        duration: 2,
        repeat: Infinity,
        repeatType: "reverse",
        ease: "easeInOut"
      }}
    />
  </svg>
);

interface Event {
  id: string;
  title: string;
  date: string;
  description: string;
}

function Countdown({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();

      if (difference <= 0) {
        return "Starting now";
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);

      if (days > 0) {
        return `${days} day${days > 1 ? 's' : ''} away`;
      } else if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} away`;
      } else {
        return `${minutes} minute${minutes > 1 ? 's' : ''} away`;
      }
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000);

    setTimeLeft(calculateTimeLeft());
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <span className="text-amber-600 font-medium">{timeLeft}</span>
  );
}

interface EventsTabProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function EventsTab({ isOpen, onToggle, className }: EventsTabProps) {
  const [events, setEvents] = useState<Event[]>([]);
  const [reminders, setReminders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast({
          title: 'Error',
          description: 'Failed to load events. Please try again later.',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen, toast]);

  const scheduleNotification = async (event: Event) => {
    try {
      if (reminders.includes(event.id)) {
        setReminders(prev => prev.filter(id => id !== event.id));
        toast({
          title: "Reminder Removed",
          description: `Notifications for ${event.title} have been cancelled`,
        });
        return;
      }

      const eventTime = new Date(event.date).getTime();
      const reminderTime = eventTime - (30 * 60 * 1000); // 30 minutes before
      const now = Date.now();

      if (reminderTime > now) {
        setTimeout(() => {
          toast({
            title: "Event Starting Soon",
            description: `${event.title} starts in 30 minutes!`,
            duration: 10000,
          });
        }, reminderTime - now);
      }

      if (eventTime > now) {
        setTimeout(() => {
          toast({
            title: "Event Starting Now",
            description: `${event.title} is starting now!`,
            duration: 10000,
          });
        }, eventTime - now);
      }

      setReminders(prev => [...prev, event.id]);
      toast({
        title: "Reminder Set",
        description: `You'll be notified before ${event.title} starts`,
      });
    } catch (error) {
      console.error('Error scheduling notification:', error);
      toast({
        title: "Error",
        description: "Failed to set reminder",
        variant: "destructive"
      });
    }
  };

  const sortedEvents = [...events].sort((a, b) =>
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const nextEvent = sortedEvents.find(event =>
    new Date(event.date).getTime() > Date.now()
  );

  return (
    <>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={className}
      >
        <motion.div
          className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl p-[2px] shadow-xl hover:shadow-2xl transition-shadow cursor-pointer overflow-hidden"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToggle}
        >
          <div className="px-3 py-2 rounded-xl bg-black/20 backdrop-blur-md flex items-center gap-2 w-full">
            <motion.div
              animate={{
                rotate: isOpen ? 180 : 0
              }}
              transition={{ type: "spring", stiffness: 200 }}
              className="flex-shrink-0"
            >
              <CalendarIcon />
            </motion.div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs text-white font-bold whitespace-nowrap truncate">Kingdom Events</span>
              <span className="text-[10px] text-white/70 truncate">Upcoming Sessions</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60]"
            onClick={onToggle}
          >
            <div className="min-h-screen px-4 py-8 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
                className="w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Card className="bg-white/95 backdrop-blur-lg shadow-2xl border-t-2 border-t-amber-500">
                  <div className="p-6">
                    <div className="sticky top-0">
                      <h2 className="text-2xl font-bold text-center text-amber-600 mb-6">Kingdom Events</h2>
                      <p className="text-center text-gray-600 mb-8">Stay connected with upcoming gatherings</p>
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center p-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                      </div>
                    ) : events.length === 0 ? (
                      <div className="text-center p-8 text-gray-500">
                        <p>No upcoming events scheduled.</p>
                        <p className="text-sm mt-2">Check back later for new events!</p>
                      </div>
                    ) : (
                      <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                        {sortedEvents.map((event, index) => (
                          <motion.div
                            key={event.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`p-4 rounded-xl ${
                              event.id === nextEvent?.id
                                ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 shadow-lg'
                                : 'bg-white/80 border border-gray-100 hover:border-amber-100'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-4">
                              <h3 className="text-xl font-bold text-gray-800">{event.title}</h3>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`p-2 h-8 ${reminders.includes(event.id) ? 'text-amber-600' : 'text-gray-400'}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  scheduleNotification(event);
                                }}
                              >
                                <Bell className={`h-4 w-4 ${reminders.includes(event.id) ? 'fill-amber-600' : ''}`} />
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <div className="text-sm text-gray-600">
                                <div className="font-medium">Description:</div>
                                <p>{event.description}</p>
                              </div>
                              <div className="text-sm text-gray-600">
                                <div className="font-medium">Date & Time:</div>
                                <div>{format(new Date(event.date), 'EEEE, MMMM d, yyyy')}</div>
                                <div>{format(new Date(event.date), 'h:mm a')}</div>
                              </div>
                              {event.id === nextEvent?.id && (
                                <div className="mt-3 py-2 px-3 bg-amber-100 rounded-lg">
                                  <Countdown targetDate={event.date} />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}