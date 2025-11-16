import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscriptionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard, RefreshCw, Settings, Calendar, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuthStore } from '@/store/authStore';
import { useEffect, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Subscription() {
  const { user, refreshUser } = useAuthStore();
  const queryClient = useQueryClient();
  const currentTier = user?.subscription_tier || 'free';
  const [prorateDialog, setProrateDialog] = useState<{
    isOpen: boolean;
    tierName: string;
    priceId: string;
    newPrice: number;
    isUpgrade: boolean;
  }>({
    isOpen: false,
    tierName: '',
    priceId: '',
    newPrice: 0,
    isUpgrade: false,
  });

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

  // Refresh user when returning from Stripe checkout
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      // Wait a bit for Stripe webhook to process
      setTimeout(() => {
        refetchStatus();
        refreshUser();
      }, 2000);
    }
  }, [refetchStatus, refreshUser]);

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

  const updateMutation = useMutation({
    mutationFn: async (priceId: string) => {
      const result = await subscriptionService.updateSubscriptionPlan(priceId);
      return result;
    },
    onSuccess: (data) => {
      toast.success(
        data.proratedAmount > 0 
          ? `Subscription updated! You'll be charged ${formatCurrency(data.proratedAmount)} today.`
          : `Subscription updated! Your new rate starts on ${new Date(data.nextBillingDate).toLocaleDateString()}.`
      );
      refetchStatus();
      refreshUser();
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
      setProrateDialog({ ...prorateDialog, isOpen: false });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update subscription');
    },
  });

  const getButtonText = (tierId: string) => {
    if (currentTier === tierId) {
      return 'Current Plan';
    }
    if (tierId === 'free') {
      return 'Downgrade to Free';
    }
    
    const tierPrices = { free: 0, pro: 9.99, premium: 19.99 };
    const currentPrice = tierPrices[currentTier as keyof typeof tierPrices] || 0;
    const newPrice = tierPrices[tierId as keyof typeof tierPrices] || 0;
    
    if (newPrice > currentPrice) {
      return `Upgrade to ${tierId === 'pro' ? 'Pro' : 'Premium'}`;
    } else {
      return `Switch to ${tierId === 'pro' ? 'Pro' : 'Premium'}`;
    }
  };

  const isButtonDisabled = (tierId: string) => {
    return currentTier === tierId;
  };

  const handleSubscribe = async (tierId: string, priceId: string, tierName: string, price: number) => {
    // If user has no subscription or is on free tier, use checkout
    if (currentTier === 'free' || !subscriptionStatus?.subscribed) {
      if (tierId === 'free') {
        toast.info('You are already on the free plan');
        return;
      }
      checkoutMutation.mutate(priceId);
      return;
    }

    // If downgrading to free, use customer portal
    if (tierId === 'free') {
      portalMutation.mutate();
      return;
    }

    // For upgrades/downgrades between paid plans, show proration dialog
    const tierPrices = { free: 0, pro: 9.99, premium: 19.99 };
    const currentPrice = tierPrices[currentTier as keyof typeof tierPrices] || 0;
    const isUpgrade = price > currentPrice;

    setProrateDialog({
      isOpen: true,
      tierName,
      priceId,
      newPrice: price,
      isUpgrade,
    });
  };

  const confirmPlanChange = () => {
    updateMutation.mutate(prorateDialog.priceId);
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
            {currentSubscription.current_period_end && (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-primary" />
                  Subscription Period
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Renews on:</span>
                  <span className="text-sm font-medium">
                    {new Date(currentSubscription.current_period_end).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Days remaining:</span>
                  <span className="text-sm font-medium">
                    {Math.max(0, Math.ceil((new Date(currentSubscription.current_period_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                  </span>
                </div>
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
            {subscriptionStatus.subscription_end ? (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-primary" />
                  Subscription Period
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Renews on:</span>
                  <span className="text-sm font-medium">
                    {new Date(subscriptionStatus.subscription_end).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Days remaining:</span>
                  <span className="text-sm font-medium">
                    {Math.max(0, Math.ceil((new Date(subscriptionStatus.subscription_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))} days
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Subscription Period
                </div>
                <p className="text-sm text-muted-foreground">
                  {subscriptionStatus.tier === 'free' 
                    ? 'No expiration - free plan' 
                    : 'Active subscription with no expiration date'}
                </p>
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
                onClick={() => handleSubscribe(tier.id, tier.price_id, tier.name, tier.price)}
                disabled={isButtonDisabled(tier.id) || checkoutMutation.isPending || portalMutation.isPending || updateMutation.isPending}
              >
                {(checkoutMutation.isPending || portalMutation.isPending || updateMutation.isPending) ? 'Loading...' : getButtonText(tier.id)}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Proration Confirmation Dialog */}
      <AlertDialog open={prorateDialog.isOpen} onOpenChange={(open) => setProrateDialog({ ...prorateDialog, isOpen: open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {prorateDialog.isUpgrade ? (
                <ArrowUpCircle className="h-5 w-5 text-success" />
              ) : (
                <ArrowDownCircle className="h-5 w-5 text-primary" />
              )}
              Confirm Plan Change
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-4">
              <p>
                You're about to {prorateDialog.isUpgrade ? 'upgrade' : 'switch'} to the <strong>{prorateDialog.tierName}</strong> plan 
                ({formatCurrency(prorateDialog.newPrice)}/month).
              </p>
              
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <h4 className="font-medium text-sm text-foreground">What happens next:</h4>
                <ul className="text-sm space-y-1.5 text-muted-foreground">
                  {prorateDialog.isUpgrade ? (
                    <>
                      <li>• Your plan will be upgraded immediately</li>
                      <li>• You'll be charged a prorated amount for the remainder of your billing period</li>
                      <li>• Starting next billing cycle, you'll pay {formatCurrency(prorateDialog.newPrice)}/month</li>
                    </>
                  ) : (
                    <>
                      <li>• Your plan will be changed immediately</li>
                      <li>• You may receive a credit for the unused portion of your current plan</li>
                      <li>• Starting next billing cycle, you'll pay {formatCurrency(prorateDialog.newPrice)}/month</li>
                    </>
                  )}
                </ul>
              </div>

              <p className="text-xs text-muted-foreground">
                Stripe will automatically calculate the prorated amount based on the remaining days in your billing period.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmPlanChange}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Processing...' : 'Confirm Change'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
