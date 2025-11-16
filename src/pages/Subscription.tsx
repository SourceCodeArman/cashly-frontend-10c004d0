import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '@/services/subscriptionService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { loadStripe } from '@stripe/stripe-js';
import { toast } from 'sonner';

export default function Subscription() {
  const { data: config } = useQuery({
    queryKey: ['subscription-config'],
    queryFn: subscriptionService.getConfig,
  });

  const { data: subscriptions } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: subscriptionService.getSubscriptions,
  });

  const currentSubscription = subscriptions?.[0];

  const handleSubscribe = async (priceId: string) => {
    try {
      if (!config?.publishable_key) {
        toast.error('Payment configuration not available');
        return;
      }

      const response = await subscriptionService.createSubscription({ price_id: priceId });
      
      const stripe = await loadStripe(config.publishable_key);
      if (!stripe) {
        toast.error('Failed to load payment system');
        return;
      }

      // @ts-ignore - redirectToCheckout exists but types may not match
      const result = await stripe.redirectToCheckout({ sessionId: response.sessionId });
      
      if (result && result.error) {
        toast.error(result.error.message || 'Failed to start checkout');
      }
    } catch (error) {
      toast.error('Failed to start checkout');
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
          <CardContent className="space-y-2">
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
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3 max-w-5xl mx-auto">
        {config?.tiers.map((tier, index) => (
          <Card
            key={tier.id}
            className={`border-border shadow-soft hover:shadow-md transition-all ${
              index === 1 ? 'border-primary ring-2 ring-primary/20' : ''
            }`}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-xl">{tier.name}</CardTitle>
                {index === 1 && (
                  <Badge className="bg-gradient-primary">Popular</Badge>
                )}
              </div>
              <div className="mt-4">
                <span className="text-4xl font-bold">{formatCurrency(tier.price)}</span>
                <span className="text-muted-foreground">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-success" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${index === 1 ? 'bg-gradient-primary' : ''}`}
                variant={index === 1 ? 'default' : 'outline'}
                onClick={() => handleSubscribe(tier.price_id)}
                disabled={currentSubscription?.plan === tier.name}
              >
                {currentSubscription?.plan === tier.name ? 'Current Plan' : 'Subscribe'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
