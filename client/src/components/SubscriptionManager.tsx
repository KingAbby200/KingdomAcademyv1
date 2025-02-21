import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Subscription {
  id: number;
  status: string;
  trialEndsAt: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  paymentType: 'apple_pay' | 'google_pay';
}

export function SubscriptionManager({ userId }: { userId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  const { data: subscription, isLoading } = useQuery<Subscription>({
    queryKey: ['/api/subscriptions', userId],
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions/${userId}`);
      if (!response.ok) {
        // If subscription not found, user might be new - show trial info
        if (response.status === 404) {
          return {
            id: 0,
            status: 'new_user',
            trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days trial
            currentPeriodEnd: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            cancelAtPeriodEnd: false,
            paymentType: 'apple_pay'
          };
        }
        throw new Error('Failed to fetch subscription');
      }
      return response.json();
    }
  });

  const { data: trialDays } = useQuery<{ remainingDays: number | null }>({
    queryKey: ['/api/subscriptions/trial-days', userId],
    queryFn: async () => {
      const response = await fetch(`/api/subscriptions/trial-days/${userId}`);
      if (!response.ok) throw new Error('Failed to fetch trial days');
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Our Community!</CardTitle>
          <CardDescription>
            Start your 3-day trial today. After the trial period, your subscription will automatically continue at $9.99/month.
            Manage your subscription through your mobile device settings.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const isNewUser = subscription.status === 'new_user';
  const isTrialing = subscription.status === 'trialing';
  const endDate = new Date(subscription.currentPeriodEnd);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {isNewUser ? 'Start Your Journey' : 'Subscription Status'}
        </CardTitle>
        <CardDescription>
          {isNewUser
            ? 'Begin with a 3-day trial to explore all features. $9.99/month after trial.'
            : 'View your subscription details below'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Status</h3>
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${
              isTrialing ? 'bg-blue-500' : 'bg-green-500'
            }`} />
            <p className="text-sm text-muted-foreground">
              {isTrialing ? 'Trial Period' : 'Active'}
            </p>
          </div>
        </div>

        {isTrialing && trialDays?.remainingDays !== null && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Trial Period</h3>
            <p className="text-sm text-muted-foreground">
              {trialDays?.remainingDays} days remaining
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Your subscription will automatically continue at $9.99/month after the trial.
              Manage your subscription through your mobile device settings.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-sm font-medium">Payment Method</h3>
          <p className="text-sm text-muted-foreground capitalize">
            {subscription.paymentType.replace('_', ' ')}
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium">
            Next Billing Date
          </h3>
          <p className="text-sm text-muted-foreground">
            {endDate.toLocaleDateString()}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}