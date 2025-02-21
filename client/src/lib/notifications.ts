import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { createElement } from "react";

// Store reminders in memory
interface ReminderTimeout {
  timeoutIds: NodeJS.Timeout[];
}

const activeReminders: Record<string, ReminderTimeout> = {};

export async function setRoomReminder(roomId: string, startTime: Date): Promise<boolean> {
  try {
    // If reminder exists, clear it
    if (activeReminders[roomId]) {
      clearRoomReminder(roomId);
      toast({
        title: "Reminder Removed",
        description: "Room reminder has been cancelled",
      });
      return false;
    }

    // Calculate time until room starts
    const timeUntilStart = startTime.getTime() - Date.now();
    const minutesUntilStart = Math.floor(timeUntilStart / (1000 * 60));
    const timeoutIds: NodeJS.Timeout[] = [];

    // Set timer for 30 minutes before
    if (minutesUntilStart > 30) {
      const thirtyMinTimeout = setTimeout(() => {
        toast({
          title: "Room Starting Soon",
          description: "Your room will begin in 30 minutes!",
          action: () => createElement(ToastAction, {
            altText: "View Room",
            onClick: () => window.location.href = `/room/${roomId}`,
            children: "View Room"
          })
        });
      }, timeUntilStart - (30 * 60 * 1000));
      timeoutIds.push(thirtyMinTimeout);
    }

    // Set timer for when room goes live
    const startTimeout = setTimeout(() => {
      toast({
        title: "Room is Live!",
        description: "Your room is starting now. Click to join!",
        action: () => createElement(ToastAction, {
          altText: "Join Now",
          onClick: () => window.location.href = `/room/${roomId}`,
          children: "Join Now"
        })
      });
      // Auto-clear reminder when room starts
      delete activeReminders[roomId];
    }, timeUntilStart);
    timeoutIds.push(startTimeout);

    // Store the timeouts
    activeReminders[roomId] = { timeoutIds };

    // Immediate confirmation toast
    toast({
      title: "Reminder Set",
      description: "We'll notify you when the room is about to start",
      action: () => createElement(ToastAction, {
        altText: "View Room",
        variant: "secondary",
        onClick: () => window.location.href = `/room/${roomId}`,
        children: "View Room"
      })
    });

    return true;
  } catch (error) {
    console.error("Failed to set reminder:", error);
    toast({
      title: "Error",
      description: "Failed to set reminder",
      variant: "destructive",
    });
    return false;
  }
}

function clearRoomReminder(roomId: string): void {
  const reminder = activeReminders[roomId];
  if (reminder) {
    reminder.timeoutIds.forEach(timeoutId => clearTimeout(timeoutId));
    delete activeReminders[roomId];
  }
}