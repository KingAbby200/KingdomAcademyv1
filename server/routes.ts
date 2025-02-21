import type { Express } from "express";
import { createServer, type Server } from "http";
import * as express from 'express';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { storage as dbStorage } from './storage';
import { storage as firebaseStorage } from './firebase';
import {
  insertOrganizationSchema,
  insertKingdomKeySchema,
  insertEventSchema,
  insertResourceSchema,
  insertUserSchema,
  insertUserDeviceSchema,
  insertPaymentIdentifierSchema
} from "@shared/schema";
import { SubscriptionService } from './services/subscription';
import { storage } from './storage';
import { requireAuth, requireAdmin } from './middleware/security';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

// File upload configuration
const fileUploadConfig = {
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  abortOnLimit: true,
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  safeFileNames: true,
  preserveExtension: true
};

// Allowed file types
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];

interface Room {
  id: string;
  title: string;
  description: string;
  category: string;
  privacy: 'public' | 'private';
  scheduledFor: Date;
  participantCount: number;
  host: string | null;
  status: "live" | "upcoming";
}

const rooms = new Map<string, Room>();

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable trust proxy
  app.set('trust proxy', 1);

  app.use(cors());
  app.use(express.json());
  app.use(fileUpload(fileUploadConfig));
  const server = createServer(app);

  // Public routes
  app.post("/api/users/initialize", async (req, res) => {
    try {
      const { uuid, recoveryCode, deviceId, deviceInfo } = req.body;
      const existingUser = await dbStorage.getUserByUUID(uuid);
      if (existingUser) {
        await dbStorage.updateUserLastActive(existingUser.id);
        await dbStorage.upsertUserDevice({
          userId: existingUser.id,
          deviceId,
          deviceType: deviceInfo.platform.toLowerCase(),
        });
        return res.json(existingUser);
      }

      const userData = {
        uuid,
        recoveryCode,
        name: `User_${uuid.slice(0, 6)}`,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uuid}`,
        title: "New Member",
        isAnonymous: true,
        metadata: { deviceInfo },
      };

      const newUser = await dbStorage.createUser(userData);
      await dbStorage.createUserDevice({
        userId: newUser.id,
        deviceId,
        deviceType: deviceInfo.platform.toLowerCase(),
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error('Error initializing user:', error);
      res.status(500).json({ error: "Failed to initialize user" });
    }
  });

  app.post("/api/users/recover", async (req, res) => {
    try {
      const { recoveryCode, deviceId, deviceInfo } = req.body;

      const user = await dbStorage.getUserByRecoveryCode(recoveryCode);
      if (!user) {
        return res.status(404).json({ error: "Invalid recovery code" });
      }

      // Update last active and add new device
      await dbStorage.updateUserLastActive(user.id);
      await dbStorage.upsertUserDevice({
        userId: user.id,
        deviceId,
        deviceType: deviceInfo.platform.toLowerCase(),
      });

      res.json(user);
    } catch (error) {
      console.error('Error recovering user:', error);
      res.status(500).json({ error: "Failed to recover user" });
    }
  });

  app.post("/api/users/link-payment", async (req, res) => {
    try {
      const { uuid, paymentId, provider } = req.body;

      const user = await dbStorage.getUserByUUID(uuid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Deactivate any existing payment identifiers for this provider
      await dbStorage.deactivatePaymentIdentifiers(user.id, provider);

      // Create new payment identifier
      await dbStorage.createPaymentIdentifier({
        userId: user.id,
        paymentId,
        provider,
        isActive: true,
      });

      // Update user to non-anonymous if they were anonymous
      if (user.isAnonymous) {
        await dbStorage.updateUserAnonymousStatus(user.id, false);
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error linking payment:', error);
      res.status(500).json({ error: "Failed to link payment identifier" });
    }
  });


  // Protected routes
  app.post("/api/rooms", requireAuth, express.json(), (req, res) => {
    const { title, description, category, privacy, scheduledFor, goLiveNow } = req.body;

    if (!title || !description || !category || !privacy) {
      return res.status(400).json({
        error: "Missing required fields",
        details: {
          title: !title ? "Title is required" : null,
          description: !description ? "Description is required" : null,
          category: !category ? "Category is required" : null,
          privacy: !privacy ? "Privacy setting is required" : null,
        }
      });
    }

    const validCategories = ['Leadership & Business', 'Networking & Mentorship', 'Prayer & Prophecy', 'Bible Study'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: "Invalid room category" });
    }

    if (!goLiveNow && scheduledFor) {
      const scheduledDate = new Date(scheduledFor);
      if (scheduledDate < new Date()) {
        return res.status(400).json({ error: "Room cannot be scheduled in the past" });
      }
    }

    const roomId = `room-${Date.now()}`;
    const room: Room = {
      id: roomId,
      title,
      description,
      category,
      privacy,
      scheduledFor: goLiveNow ? new Date() : new Date(scheduledFor),
      participantCount: 0,
      host: req.session.userId, // Added host ID from session
      status: goLiveNow ? "live" : "upcoming"
    };

    rooms.set(roomId, room);
    console.log(`New room created: ${roomId} - ${title} in category ${category} - Status: ${room.status}`);

    res.status(201).json(room);
  });

  app.get("/api/rooms", requireAuth, (req, res) => {
    const { category } = req.query;
    let activeRooms = Array.from(rooms.values());

    if (category) {
      activeRooms = activeRooms.filter(room => room.category === category);
    }

    activeRooms = activeRooms.map(room => ({
      ...room,
      status: room.scheduledFor <= new Date() ? "live" : "upcoming"
    }));

    console.log(`Returning ${activeRooms.length} active rooms${category ? ` for category ${category}` : ''}`);
    res.json(activeRooms);
  });

  // File upload validation middleware
  const validateFileUpload = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.files) {
      return res.status(400).json({ error: "No files were uploaded" });
    }

    const files = req.files as fileUpload.FileArray;

    for (const key in files) {
      const file = files[key];
      if (Array.isArray(file)) {
        return res.status(400).json({ error: "Multiple files not supported" });
      }

      if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
        return res.status(400).json({
          error: "Invalid file type",
          allowedTypes: ALLOWED_FILE_TYPES
        });
      }
    }

    next();
  };

  // Protected resource routes with file upload validation
  app.post("/api/resources", requireAuth, validateFileUpload, async (req, res) => {
    try {
      let mediaUrl = '';
      let coverArtUrl = '';

      const files = req.files as fileUpload.FileArray;

      if (files.media) {
        const mediaFile = files.media as fileUpload.UploadedFile;
        const mediaRef = firebaseStorage.ref(`resources/${Date.now()}-${mediaFile.name}`);
        await mediaRef.put(mediaFile.data);
        mediaUrl = await mediaRef.getDownloadURL();
      }

      if (files.coverArt) {
        const coverArtFile = files.coverArt as fileUpload.UploadedFile;
        const coverArtRef = firebaseStorage.ref(`resources/${Date.now()}-${coverArtFile.name}`);
        await coverArtRef.put(coverArtFile.data);
        coverArtUrl = await coverArtRef.getDownloadURL();
      }

      const data = insertResourceSchema.parse({
        ...req.body,
        mediaUrl,
        coverArtUrl,
        userId: req.session.userId //Added userId from session
      });

      const resource = await dbStorage.createResource(data);
      res.status(201).json(resource);
    } catch (error) {
      console.error('Error creating resource:', error);
      res.status(400).json({ error: "Invalid resource data" });
    }
  });

  app.get("/api/resources", requireAuth, async (req, res) => {
    const { type, category } = req.query;

    if (type) {
      const resources = await dbStorage.getResourcesByType(type as string);
      res.json(resources);
    } else if (category) {
      const resources = await dbStorage.getResourcesByCategory(category as string);
      res.json(resources);
    } else {
      res.status(400).json({ error: "Must specify type or category" });
    }
  });

  app.get("/api/resources/featured", requireAuth, async (req, res) => {
    try {
      const resources = await dbStorage.getFeaturedResources();
      res.json(resources);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch featured resources" });
    }
  });

  app.post("/api/resources/:id/feature", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { featured } = req.body;
      await dbStorage.setResourceFeatured(id, featured);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to update resource featured status" });
    }
  });

  // Organization routes
  app.post("/api/organizations", requireAuth, async (req, res) => {
    try {
      const data = insertOrganizationSchema.parse(req.body);
      const organization = await dbStorage.createOrganization(data);
      res.status(201).json(organization);
    } catch (error) {
      res.status(400).json({ error: "Invalid organization data" });
    }
  });

  app.post("/api/organizations/:id/feature", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await dbStorage.setFeaturedOrganization(id);
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Failed to set featured organization" });
    }
  });

  // Kingdom Keys routes
  app.post("/api/kingdom-keys", requireAuth, async (req, res) => {
    try {
      const data = insertKingdomKeySchema.parse(req.body);
      const key = await dbStorage.createKingdomKey(data);
      res.status(201).json(key);
    } catch (error) {
      res.status(400).json({ error: "Invalid kingdom key data" });
    }
  });

  app.get("/api/kingdom-keys", requireAuth, async (req, res) => {
    const keys = await dbStorage.getKingdomKeys();
    res.json(keys);
  });

  // Events routes
  app.post("/api/events", requireAuth, async (req, res) => {
    try {
      const data = insertEventSchema.parse(req.body);
      const event = await dbStorage.createEvent(data);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid event data" });
    }
  });

  app.get("/api/events/upcoming", requireAuth, async (req, res) => {
    const events = await dbStorage.getUpcomingEvents();
    res.json(events);
  });

  // Add subscription routes
  app.post("/api/subscriptions/trial", requireAuth, async (req, res) => {
    try {
      const { userId, paymentType } = req.body;
      if (!userId || !paymentType) {
        return res.status(400).json({ error: "User ID and payment type are required" });
      }

      if (!['apple_pay', 'google_pay', 'card'].includes(paymentType)) {
        return res.status(400).json({ error: "Invalid payment type" });
      }

      const subscriptionData = await SubscriptionService.createTrialSubscription(userId, paymentType);
      const subscription = await storage.createSubscription(subscriptionData);

      res.status(201).json(subscription);
    } catch (error) {
      console.error("Failed to create trial subscription:", error);
      res.status(500).json({ error: "Failed to create trial subscription" });
    }
  });

  app.post("/api/subscriptions", requireAuth, async (req, res) => {
    try {
      const { userId, paymentMethodId, paymentType } = req.body;

      if (!userId || !paymentMethodId || !paymentType) {
        return res.status(400).json({ error: "User ID, payment method ID, and payment type are required" });
      }

      if (!['apple_pay', 'google_pay', 'card'].includes(paymentType)) {
        return res.status(400).json({ error: "Invalid payment type" });
      }

      const stripeSubscription = await SubscriptionService.createStripeSubscription(
        userId,
        paymentMethodId,
        paymentType
      );

      const subscription = await storage.createSubscription({
        userId,
        status: 'active',
        trialEndsAt: new Date(stripeSubscription.trial_end! * 1000),
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        paymentType,
        isTrialUsed: true
      });

      res.status(201).json(subscription);
    } catch (error) {
      console.error("Failed to create subscription:", error);
      res.status(500).json({ error: "Failed to create subscription" });
    }
  });

  app.get("/api/subscriptions/trial-days/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const remainingDays = await SubscriptionService.getRemainingTrialDays(userId);

      res.json({ remainingDays });
    } catch (error) {
      console.error("Failed to get remaining trial days:", error);
      res.status(500).json({ error: "Failed to get remaining trial days" });
    }
  });

  app.post("/api/subscriptions/:id/cancel", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.cancelSubscription(id);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      res.status(500).json({ error: "Failed to cancel subscription" });
    }
  });

  app.get("/api/subscriptions/:userId", requireAuth, async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const subscription = await storage.getSubscription(userId);

      if (!subscription) {
        return res.status(404).json({ error: "No active subscription found" });
      }

      res.json(subscription);
    } catch (error) {
      console.error("Failed to get subscription:", error);
      res.status(500).json({ error: "Failed to get subscription" });
    }
  });

  // Add these routes before the return server statement
  app.get("/api/profile/:username", async (req, res) => {
    try {
      const username = req.params.username;
      let user;

      // Try to get user by UUID first (for Firebase auth users)
      user = await dbStorage.getUserByUUID(username);

      // If not found by UUID, try username
      if (!user) {
        user = await dbStorage.getUserByUsername(username);
      }

      if (!user) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Return formatted profile data
      res.json({
        id: user.id,
        name: user.name,
        username: user.username,
        title: user.title,
        avatar: user.avatar,
        bio: user.metadata?.bio || "",
        website: user.metadata?.website || "",
        welcomeVideo: user.metadata?.welcomeVideo,
        videoThumbnail: user.metadata?.videoThumbnail,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile/:username", requireAuth, async (req, res) => {
    try {
      const username = req.params.username;
      let user = await dbStorage.getUserByUUID(username);

      // If not found by UUID, try username
      if (!user) {
        user = await dbStorage.getUserByUsername(username);
      }

      if (!user) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Only allow users to update their own profile
      if (req.session.userId !== user.id) {
        return res.status(403).json({ error: "Not authorized to update this profile" });
      }

      const { name, title, bio, website, welcomeVideo } = req.body;

      // Update user's metadata with new profile information
      const updatedMetadata = {
        ...(user.metadata || {}),
        bio,
        website,
        welcomeVideo,
      };

      await dbStorage.updateUser(user.id, {
        name,
        title,
        metadata: updatedMetadata,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/profile/:username/media", requireAuth, validateFileUpload, async (req, res) => {
    try {
      const username = req.params.username;
      const user = await dbStorage.getUserByUsername(username);

      if (!user) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Only allow users to update their own profile media
      if (!req.user || user.username !== req.user.username) {
        return res.status(403).json({ error: "Not authorized to update this profile" });
      }

      const files = req.files as fileUpload.FileArray;
      let avatarUrl = user.avatar;
      let videoThumbnailUrl = user.metadata?.videoThumbnail;

      if (files.avatar) {
        const avatarFile = files.avatar as fileUpload.UploadedFile;
        const avatarRef = firebaseStorage.ref(`avatars/${user.id}-${Date.now()}`);
        await avatarRef.put(avatarFile.data);
        avatarUrl = await avatarRef.getDownloadURL();
      }

      if (files.video) {
        const videoFile = files.video as fileUpload.UploadedFile;
        const videoRef = firebaseStorage.ref(`videos/${user.id}-${Date.now()}`);
        await videoRef.put(videoFile.data);
        const videoUrl = await videoRef.getDownloadURL();

        // Update user's metadata with new media URLs
        const updatedMetadata = {
          ...user.metadata,
          welcomeVideo: videoUrl,
          videoThumbnail: videoThumbnailUrl,
        };

        await dbStorage.updateUser(user.id, {
          avatar: avatarUrl,
          metadata: updatedMetadata,
        });
      }

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating profile media:', error);
      res.status(500).json({ error: "Failed to update profile media" });
    }
  });

  app.get("/api/profile/:id", async (req, res) => {
    try {
      const id = req.params.id;
      let user = null;

      // Try to get user by UUID first (for Firebase auth users)
      user = await dbStorage.getUserByUUID(id);

      // If not found by UUID, try getting by username
      if (!user) {
        user = await dbStorage.getUserByUsername(id);
      }

      if (!user) {
        console.log(`Profile not found for id: ${id}`);
        return res.status(404).json({ error: "Profile not found" });
      }

      // Return formatted profile data
      res.json({
        id: user.id,
        name: user.name,
        username: user.username,
        title: user.title || "New Member",
        avatar: user.avatar,
        bio: user.metadata?.bio || "",
        website: user.metadata?.website || "",
        welcomeVideo: user.metadata?.welcomeVideo || "",
        videoThumbnail: user.metadata?.videoThumbnail || "",
        inBreakoutRoom: user.metadata?.inBreakoutRoom || null,
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/profile/:id", requireAuth, async (req, res) => {
    try {
      const id = req.params.id;
      let user = await dbStorage.getUserByUUID(id);

      if (!user) {
        user = await dbStorage.getUserByUsername(id);
      }

      if (!user) {
        return res.status(404).json({ error: "Profile not found" });
      }

      // Only allow users to update their own profile
      if (req.session?.userId !== user.id) {
        return res.status(403).json({ error: "Not authorized to update this profile" });
      }

      const { name, title, bio, website, welcomeVideo } = req.body;

      // Update user's metadata with new profile information
      const updatedMetadata = {
        ...(user.metadata || {}),
        bio: bio || user.metadata?.bio,
        website: website || user.metadata?.website,
        welcomeVideo: welcomeVideo || user.metadata?.welcomeVideo,
      };

      await dbStorage.updateUser(user.id, {
        name: name || user.name,
        title: title || user.title,
        metadata: updatedMetadata,
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  return server;
}