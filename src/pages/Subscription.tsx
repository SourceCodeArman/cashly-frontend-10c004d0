import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscriptionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, RefreshCw, Settings } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useEffect } from 'react';

export default function Subscription() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const currentTier = user?.subscription_tier || 'free';

  const { data: config } = useQuery({
    queryKey: ['subscription-config'],
    queryFn: subscriptionService.getConfig,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: subscriptionService.getSubscriptions,
  });

  const { data: subscriptionStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['subscription-status'],
    queryFn: subscriptionService.checkSubscription,
  });

  // Check subscription status on mount and periodically
  useEffect(() => {
    refetchStatus();
    const interval = setInterval(() => {
      refetchStatus();
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [refetchStatus]);

  const currentSubscription = subscriptions?.[0];

  const checkoutMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const result = await subscriptionService.createCheckoutSession(priceId);
      return result;
    },
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start checkout');
    },
  });

  const portalMutation = useMutation({
    mutationFn: subscriptionService.openCustomerPortal,
    onSuccess: (data) => {
      if (data.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to open customer portal');
    },
  });

  const getButtonText = (tierId: string) => {
    if (currentTier === tierId) {
      return 'Current Plan';
    }
    if (tierId === 'free') {
      return 'Downgrade to Free';
    }
    return `Upgrade to ${tierId === 'pro' ? 'Pro' : 'Premium'}`;
  };

  const isButtonDisabled = (tierId: string) => {
    return currentTier === tierId;
  };

  const handleSubscribe = async (tierId: string, priceId: string) => {
    if (tierId === 'free') {
      // Open customer portal for downgrades
      portalMutation.mutate();
    } else {
      checkoutMutation.mutate(priceId);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Upgrade to unlock advanced features and take control of your finances
        </p>
      </div>

      {currentSubscription && (
        <Card className="max-w-md mx-auto border-primary shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Plan:</span>
              <Badge>{currentSubscription.plan}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                {currentSubscription.status}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Renews:</span>
              <span>{new Date(currentSubscription.current_period_end).toLocaleDateString()}</span>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      {subscriptionStatus && subscriptionStatus.subscribed && !currentSubscription && (
        <Card className="max-w-md mx-auto border-primary shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Tier:</span>
              <Badge>{subscriptionStatus.tier}</Badge>
            </div>
            {subscriptionStatus.subscription_end && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Renews:</span>
                <span>{new Date(subscriptionStatus.subscription_end).toLocaleDateString()}</span>
              </div>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              <Settings className="h-4 w-4 mr-2" />
              Manage Subscription
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetchStatus()}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {(config?.tiers ?? []).map((tier, index) => (
          <Card
            key={tier.id}
            className={`flex flex-col border-border shadow-soft hover:shadow-md transition-all ${
              index === 1 ? 'border-primary ring-2 ring-primary/20' : ''
            } ${currentTier === tier.id ? 'ring-2 ring-success' : ''}`}
          >
            <CardHeader>
              <div className="flex justify-between items-start min-h-[32px]">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                <div className="flex flex-col gap-1 items-end">
                  {index === 1 && (
                    <Badge className="bg-gradient-primary">Popular</Badge>
                  )}
                  {currentTier === tier.id && (
                    <Badge variant="outline" className="border-success text-success">Active</Badge>
                  )}
                </div>
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">{formatCurrency(tier.price)}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 space-y-4">
              <ul className="space-y-2 flex-1">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${index === 1 ? 'bg-gradient-primary' : ''}`}
                variant={index === 1 ? 'default' : 'outline'}
                onClick={() => handleSubscribe(tier.id, tier.price_id)}
                disabled={isButtonDisabled(tier.id) || checkoutMutation.isPending || portalMutation.isPending}
              >
                {checkoutMutation.isPending || portalMutation.isPending ? 'Loading...' : getButtonText(tier.id)}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
