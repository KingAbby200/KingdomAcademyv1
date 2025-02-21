import { pgTable, text, serial, integer, boolean, timestamp, jsonb, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Extend users table with anonymous user support
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uuid: text("uuid").notNull().unique(), // Device-specific UUID
  username: text("username").unique(), // Optional for anonymous users
  password: text("password"), // Optional for anonymous users
  name: text("name").notNull(),
  avatar: text("avatar").notNull(),
  title: text("title").notNull(),
  recoveryCode: text("recovery_code").unique(), // 6-digit recovery code
  isAnonymous: boolean("is_anonymous").default(true).notNull(),
  lastActiveAt: timestamp("last_active_at").defaultNow().notNull(),
  metadata: jsonb("metadata").default({}).notNull(), // Store device info, preferences, etc.
});

// User Devices table for cross-device sync
export const userDevices = pgTable("user_devices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  deviceId: text("device_id").notNull(),
  deviceType: text("device_type").notNull(), // web, ios, android
  lastSyncAt: timestamp("last_sync_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Payment tracking table
export const paymentIdentifiers = pgTable("payment_identifiers", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  provider: text("provider").notNull(), // stripe, apple_pay, google_pay
  paymentId: text("payment_id").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Define attachment schema
const attachmentSchema = z.object({
  type: z.enum(['image', 'video', 'audio', 'file']),
  url: z.string(),
  name: z.string(),
  preview: z.string().optional(),
});

export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  participant1Id: integer("participant1_id").references(() => users.id).notNull(),
  participant2Id: integer("participant2_id").references(() => users.id).notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").references(() => conversations.id).notNull(),
  senderId: integer("sender_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  attachments: jsonb("attachments").default([]).notNull(),
});

// Schema for inserting users
export const insertUserSchema = createInsertSchema(users)
  .omit({
    id: true,
  })
  .extend({
    metadata: z.object({
      deviceInfo: z.object({
        platform: z.string(),
        browser: z.string().optional(),
        version: z.string(),
      }).optional(),
      preferences: z.record(z.unknown()).optional(),
    }).optional(),
  });

// Schema for inserting messages with attachments
export const insertMessageSchema = createInsertSchema(messages).extend({
  attachments: z.array(attachmentSchema).optional(),
}).pick({
  conversationId: true,
  senderId: true,
  content: true,
  attachments: true,
});

// Schema for creating conversations
export const insertConversationSchema = createInsertSchema(conversations).pick({
  participant1Id: true,
  participant2Id: true,
});

// New tables for admin content
export const organizations = pgTable("organizations", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const kingdomKeys = pgTable("kingdom_keys", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  scheduledFor: timestamp("scheduled_for").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const resources = pgTable("resources", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'insight' | 'podcast' | 'devotional'
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  author: text("author").notNull(),
  duration: text("duration"),
  mediaUrl: text("media_url"), // For video/audio content
  coverArtUrl: text("cover_art_url").notNull(),
  // Additional fields for devotionals
  scripture: text("scripture"),
  reflection: text("reflection"),
  prayer: text("prayer"),
  isFeatured: boolean("is_featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Insert schemas
export const insertOrganizationSchema = createInsertSchema(organizations).omit({
  id: true,
  createdAt: true
});

export const insertKingdomKeySchema = createInsertSchema(kingdomKeys).omit({
  id: true,
  createdAt: true
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true
});

export const insertResourceSchema = createInsertSchema(resources).omit({
  id: true,
  createdAt: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Attachment = z.infer<typeof attachmentSchema>;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = z.infer<typeof insertOrganizationSchema>;

export type KingdomKey = typeof kingdomKeys.$inferSelect;
export type InsertKingdomKey = z.infer<typeof insertKingdomKeySchema>;

export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;

export type Resource = typeof resources.$inferSelect;
export type InsertResource = z.infer<typeof insertResourceSchema>;

// New marketplace schema
export const marketplaceListings = pgTable("marketplace_listings", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // business, entertainment, education, ministry, government, other
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  location: text("location").notNull(),
  country: text("country").notNull(),
  tags: text("tags").array().notNull(),
  verified: boolean("verified").default(false).notNull(),
  featured: boolean("featured").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  // Additional fields for specific listing types
  website: text("website"),
  socialMedia: jsonb("social_media"),
  logo: text("logo"),
  coverImage: text("cover_image"),
  gallery: text("gallery").array(),
  contactPerson: text("contact_person"),
});

// Schema for inserting marketplace listings
export const insertMarketplaceListingSchema = createInsertSchema(marketplaceListings)
  .omit({
    id: true,
    verified: true,
    featured: true,
    createdAt: true,
    updatedAt: true,
  })
  .extend({
    tags: z.array(z.string()),
    socialMedia: z.object({
      facebook: z.string().optional(),
      twitter: z.string().optional(),
      linkedin: z.string().optional(),
      instagram: z.string().optional(),
    }).optional(),
    gallery: z.array(z.string()).optional(),
  });

// Export types
export type MarketplaceListing = typeof marketplaceListings.$inferSelect;
export type InsertMarketplaceListing = z.infer<typeof insertMarketplaceListingSchema>;


// New subscription-related tables
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").notNull(), // 'trialing', 'active', 'cancelled', 'expired'
  trialEndsAt: timestamp("trial_ends_at").notNull(),
  currentPeriodStart: timestamp("current_period_start").notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false).notNull(),
  canceledAt: timestamp("canceled_at"),
  endedAt: timestamp("ended_at"),
  paymentType: text("payment_type").notNull(), // 'apple_pay', 'google_pay', 'card'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isTrialUsed: boolean("is_trial_used").default(false).notNull(),
});

export const paymentMethods = pgTable("payment_methods", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // 'apple_pay', 'google_pay', 'card'
  provider: text("provider").notNull(), // 'stripe', 'apple', 'google'
  lastFour: text("last_four"),
  expiryMonth: integer("expiry_month"),
  expiryYear: integer("expiry_year"),
  isDefault: boolean("is_default").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Create insert schemas
export const insertSubscriptionSchema = createInsertSchema(subscriptions)
  .omit({
    id: true,
    createdAt: true,
    canceledAt: true,
    endedAt: true,
  })
  .extend({
    paymentType: z.enum(['apple_pay', 'google_pay', 'card']),
  });

export const insertPaymentMethodSchema = createInsertSchema(paymentMethods)
  .omit({
    id: true,
    createdAt: true,
  })
  .extend({
    type: z.enum(['apple_pay', 'google_pay', 'card']),
    provider: z.enum(['stripe', 'apple', 'google']),
  });

// Export types
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type InsertPaymentMethod = z.infer<typeof insertPaymentMethodSchema>;

// Add new insert schemas
export const insertUserDeviceSchema = createInsertSchema(userDevices).omit({
  id: true,
  createdAt: true,
  lastSyncAt: true,
});

export const insertPaymentIdentifierSchema = createInsertSchema(paymentIdentifiers).omit({
  id: true,
  createdAt: true,
});

export type UserDevice = typeof userDevices.$inferSelect;
export type InsertUserDevice = z.infer<typeof insertUserDeviceSchema>;
export type PaymentIdentifier = typeof paymentIdentifiers.$inferSelect;
export type InsertPaymentIdentifier = z.infer<typeof insertPaymentIdentifierSchema>;
