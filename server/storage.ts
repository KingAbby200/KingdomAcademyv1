import { 
  users, type User, type InsertUser,
  organizations, type Organization, type InsertOrganization,
  kingdomKeys, type KingdomKey, type InsertKingdomKey,
  events, type Event, type InsertEvent,
  resources, type Resource, type InsertResource,
  subscriptions, type Subscription, type InsertSubscription,
  paymentMethods, type PaymentMethod, type InsertPaymentMethod,
  userDevices, type UserDevice, type InsertUserDevice,
  paymentIdentifiers, type PaymentIdentifier, type InsertPaymentIdentifier
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getUserByUUID(uuid: string): Promise<User | undefined>;
  getUserByRecoveryCode(code: string): Promise<User | undefined>;
  updateUserLastActive(id: number): Promise<void>;
  updateUserAnonymousStatus(id: number, isAnonymous: boolean): Promise<void>;
  updateUser(id: number, updates: Partial<Omit<InsertUser, 'uuid'>>): Promise<void>; // Added updateUser method

  // User Device methods
  createUserDevice(device: InsertUserDevice): Promise<UserDevice>;
  upsertUserDevice(device: InsertUserDevice): Promise<UserDevice>;
  getUserDevices(userId: number): Promise<UserDevice[]>;

  // Payment Identifier methods
  createPaymentIdentifier(identifier: InsertPaymentIdentifier): Promise<PaymentIdentifier>;
  deactivatePaymentIdentifiers(userId: number, provider: string): Promise<void>;
  getActivePaymentIdentifier(userId: number, provider: string): Promise<PaymentIdentifier | undefined>;

  // Organization methods
  createOrganization(org: InsertOrganization): Promise<Organization>;
  getFeaturedOrganization(): Promise<Organization | undefined>;
  setFeaturedOrganization(id: number): Promise<void>;

  // Kingdom Key methods
  createKingdomKey(key: InsertKingdomKey): Promise<KingdomKey>;
  getKingdomKeys(): Promise<KingdomKey[]>;

  // Event methods
  createEvent(event: InsertEvent): Promise<Event>;
  getUpcomingEvents(): Promise<Event[]>;

  // Resource methods
  createResource(resource: InsertResource): Promise<Resource>;
  getResourcesByType(type: string): Promise<Resource[]>;
  getResourcesByCategory(category: string): Promise<Resource[]>;
  getFeaturedResources(): Promise<Resource[]>;
  setResourceFeatured(id: number, featured: boolean): Promise<void>;

  // Subscription methods
  createSubscription(sub: InsertSubscription): Promise<Subscription>;
  getSubscription(userId: number): Promise<Subscription | undefined>;
  updateSubscriptionStatus(id: number, status: string): Promise<void>;
  cancelSubscription(id: number): Promise<void>;

  // Payment methods
  addPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod>;
  getPaymentMethods(userId: number): Promise<PaymentMethod[]>;
  setDefaultPaymentMethod(id: number): Promise<void>;
  removePaymentMethod(id: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private organizations: Map<number, Organization>;
  private kingdomKeys: Map<number, KingdomKey>;
  private events: Map<number, Event>;
  private resources: Map<number, Resource>;
  private subscriptions: Map<number, Subscription>;
  private paymentMethods: Map<number, PaymentMethod>;
  private userDevices: Map<number, UserDevice>;
  private paymentIdentifiers: Map<number, PaymentIdentifier>;
  private currentId: number;

  constructor() {
    this.users = new Map();
    this.organizations = new Map();
    this.kingdomKeys = new Map();
    this.events = new Map();
    this.resources = new Map();
    this.subscriptions = new Map();
    this.paymentMethods = new Map();
    this.userDevices = new Map();
    this.paymentIdentifiers = new Map();
    this.currentId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUserByUUID(uuid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.uuid === uuid,
    );
  }

  async getUserByRecoveryCode(code: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.recoveryCode === code,
    );
  }

  async updateUserLastActive(id: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.lastActiveAt = new Date();
      this.users.set(id, user);
    }
  }

  async updateUserAnonymousStatus(id: number, isAnonymous: boolean): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      user.isAnonymous = isAnonymous;
      this.users.set(id, user);
    }
  }

  // Organization methods
  async createOrganization(org: InsertOrganization): Promise<Organization> {
    const id = this.currentId++;
    const organization: Organization = { 
      ...org, 
      id, 
      isFeatured: false,
      createdAt: new Date()
    };
    this.organizations.set(id, organization);
    return organization;
  }

  async getFeaturedOrganization(): Promise<Organization | undefined> {
    return Array.from(this.organizations.values()).find(org => org.isFeatured);
  }

  async setFeaturedOrganization(id: number): Promise<void> {
    // First, unset any currently featured organization
    for (const org of this.organizations.values()) {
      if (org.isFeatured) {
        org.isFeatured = false;
      }
    }
    // Then set the new featured organization
    const org = this.organizations.get(id);
    if (org) {
      org.isFeatured = true;
    }
  }

  // Kingdom Key methods
  async createKingdomKey(key: InsertKingdomKey): Promise<KingdomKey> {
    const id = this.currentId++;
    const kingdomKey: KingdomKey = { 
      ...key, 
      id,
      createdAt: new Date()
    };
    this.kingdomKeys.set(id, kingdomKey);
    return kingdomKey;
  }

  async getKingdomKeys(): Promise<KingdomKey[]> {
    return Array.from(this.kingdomKeys.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  // Event methods
  async createEvent(event: InsertEvent): Promise<Event> {
    const id = this.currentId++;
    const newEvent: Event = { 
      ...event, 
      id,
      createdAt: new Date()
    };
    this.events.set(id, newEvent);
    return newEvent;
  }

  async getUpcomingEvents(): Promise<Event[]> {
    const now = new Date();
    return Array.from(this.events.values())
      .filter(event => event.scheduledFor > now)
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  // Resource methods
  async createResource(resource: InsertResource): Promise<Resource> {
    const id = this.currentId++;
    const newResource: Resource = { 
      ...resource, 
      id,
      isFeatured: false,
      createdAt: new Date()
    };
    this.resources.set(id, newResource);
    return newResource;
  }

  async getResourcesByType(type: string): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.type === type)
      .sort((a, b) => {
        // Sort featured resources first, then by creation date
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
      });
  }

  async getResourcesByCategory(category: string): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.category === category)
      .sort((a, b) => {
        // Sort featured resources first, then by creation date
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
      });
  }

  async getFeaturedResources(): Promise<Resource[]> {
    return Array.from(this.resources.values())
      .filter(resource => resource.isFeatured)
      .sort((a, b) => (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0));
  }

  async setResourceFeatured(id: number, featured: boolean): Promise<void> {
    const resource = this.resources.get(id);
    if (resource) {
      resource.isFeatured = featured;
      this.resources.set(id, resource);
    }
  }

  // Subscription methods
  async createSubscription(sub: InsertSubscription): Promise<Subscription> {
    const id = this.currentId++;
    const subscription: Subscription = {
      ...sub,
      id,
      createdAt: new Date(),
    };
    this.subscriptions.set(id, subscription);
    return subscription;
  }

  async getSubscription(userId: number): Promise<Subscription | undefined> {
    return Array.from(this.subscriptions.values()).find(
      (sub) => sub.userId === userId && sub.endedAt === null
    );
  }

  async updateSubscriptionStatus(id: number, status: string): Promise<void> {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.status = status;
      this.subscriptions.set(id, subscription);
    }
  }

  async cancelSubscription(id: number): Promise<void> {
    const subscription = this.subscriptions.get(id);
    if (subscription) {
      subscription.cancelAtPeriodEnd = true;
      subscription.canceledAt = new Date();
      this.subscriptions.set(id, subscription);
    }
  }

  // Payment methods
  async addPaymentMethod(method: InsertPaymentMethod): Promise<PaymentMethod> {
    const id = this.currentId++;
    const paymentMethod: PaymentMethod = {
      ...method,
      id,
      createdAt: new Date()
    };
    this.paymentMethods.set(id, paymentMethod);

    // If this is the first payment method, make it default
    const userMethods = await this.getPaymentMethods(method.userId);
    if (userMethods.length === 1) {
      await this.setDefaultPaymentMethod(id);
    }

    return paymentMethod;
  }

  async getPaymentMethods(userId: number): Promise<PaymentMethod[]> {
    return Array.from(this.paymentMethods.values())
      .filter(method => method.userId === userId);
  }

  async setDefaultPaymentMethod(id: number): Promise<void> {
    const method = this.paymentMethods.get(id);
    if (method) {
      // First, unset any existing default
      for (const m of this.paymentMethods.values()) {
        if (m.userId === method.userId) {
          m.isDefault = false;
          this.paymentMethods.set(m.id, m);
        }
      }
      // Then set the new default
      method.isDefault = true;
      this.paymentMethods.set(id, method);
    }
  }

  async removePaymentMethod(id: number): Promise<void> {
    this.paymentMethods.delete(id);
  }

  // User Device Methods
  async createUserDevice(device: InsertUserDevice): Promise<UserDevice> {
    const id = this.currentId++;
    const userDevice: UserDevice = {
      ...device,
      id,
      lastSyncAt: new Date(),
      createdAt: new Date(),
    };
    this.userDevices.set(id, userDevice);
    return userDevice;
  }

  async upsertUserDevice(device: InsertUserDevice): Promise<UserDevice> {
    const existingDevice = Array.from(this.userDevices.values()).find(
      (d) => d.userId === device.userId && d.deviceId === device.deviceId,
    );

    if (existingDevice) {
      existingDevice.lastSyncAt = new Date();
      this.userDevices.set(existingDevice.id, existingDevice);
      return existingDevice;
    }

    return this.createUserDevice(device);
  }

  async getUserDevices(userId: number): Promise<UserDevice[]> {
    return Array.from(this.userDevices.values())
      .filter((device) => device.userId === userId)
      .sort((a, b) => b.lastSyncAt.getTime() - a.lastSyncAt.getTime());
  }

  // Payment Identifier Methods
  async createPaymentIdentifier(identifier: InsertPaymentIdentifier): Promise<PaymentIdentifier> {
    const id = this.currentId++;
    const paymentIdentifier: PaymentIdentifier = {
      ...identifier,
      id,
      createdAt: new Date(),
    };
    this.paymentIdentifiers.set(id, paymentIdentifier);
    return paymentIdentifier;
  }

  async deactivatePaymentIdentifiers(userId: number, provider: string): Promise<void> {
    for (const [id, identifier] of this.paymentIdentifiers.entries()) {
      if (identifier.userId === userId && identifier.provider === provider) {
        identifier.isActive = false;
        this.paymentIdentifiers.set(id, identifier);
      }
    }
  }

  async getActivePaymentIdentifier(userId: number, provider: string): Promise<PaymentIdentifier | undefined> {
    return Array.from(this.paymentIdentifiers.values()).find(
      (identifier) => 
        identifier.userId === userId && 
        identifier.provider === provider && 
        identifier.isActive
    );
  }

  async updateUser(id: number, updates: Partial<Omit<InsertUser, 'uuid'>>): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, {
        ...user,
        ...updates,
        metadata: {
          ...user.metadata,
          ...updates.metadata,
        },
      });
    }
  }
}

export const storage = new MemStorage();