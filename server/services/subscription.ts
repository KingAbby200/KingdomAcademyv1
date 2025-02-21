import Stripe from 'stripe';
import { db } from '../db';
import { subscriptions, type InsertSubscription } from '@shared/schema';
import { eq } from 'drizzle-orm';

const TRIAL_PERIOD_DAYS = 3;
const MONTHLY_PRICE_USD = 999; // $9.99 in cents

// Initialize Stripe only if secret key is available
let stripe: Stripe | undefined;
if (process.env.STRIPE_SECRET_KEY) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  });
}

export class SubscriptionService {
  static async createTrialSubscription(userId: number, paymentType: 'apple_pay' | 'google_pay' | 'card'): Promise<InsertSubscription> {
    try {
      // Check if user has already used trial
      const [existingSubscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));

      if (existingSubscription?.isTrialUsed) {
        throw new Error('Trial period has already been used');
      }

      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + TRIAL_PERIOD_DAYS);

      const subscription: InsertSubscription = {
        userId,
        status: 'trialing',
        trialEndsAt: trialEnd,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnd,
        cancelAtPeriodEnd: false,
        paymentType,
        isTrialUsed: true
      };

      return subscription;
    } catch (error) {
      console.error('Error creating trial subscription:', error);
      throw error;
    }
  }

  static async createStripeSubscription(userId: number, paymentMethodId: string, paymentType: 'apple_pay' | 'google_pay' | 'card'): Promise<Stripe.Subscription> {
    if (!stripe) {
      throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY.');
    }

    try {
      // Get or create customer
      const [existingCustomer] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));

      let customerId: string;

      if (existingCustomer?.stripeCustomerId) {
        customerId = existingCustomer.stripeCustomerId;
      } else {
        const customer = await stripe.customers.create({
          payment_method: paymentMethodId,
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });
        customerId = customer.id;
      }

      // Create subscription with trial period
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: process.env.STRIPE_PRICE_ID }],
        trial_period_days: TRIAL_PERIOD_DAYS,
        payment_settings: {
          payment_method_types: [paymentType === 'card' ? 'card' : paymentType],
          save_default_payment_method: 'on_subscription',
        },
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent'],
      });

      return subscription;
    } catch (error) {
      console.error('Error creating Stripe subscription:', error);
      throw error;
    }
  }

  static async cancelSubscription(id: number): Promise<void> {
    try {
      await db
        .update(subscriptions)
        .set({
          cancelAtPeriodEnd: true,
          canceledAt: new Date(),
        })
        .where(eq(subscriptions.id, id));
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  static async getRemainingTrialDays(userId: number): Promise<number | null> {
    try {
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId));

      if (!subscription || subscription.status !== 'trialing') {
        return null;
      }

      const now = new Date();
      const trialEnd = new Date(subscription.trialEndsAt);
      const remainingDays = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      return Math.max(0, remainingDays);
    } catch (error) {
      console.error('Error getting remaining trial days:', error);
      throw error;
    }
  }
}
