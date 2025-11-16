import { useQuery, useMutation } from '@tanstack/react-query';
import { accountService } from '@/services/accountService';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { RefreshCw, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { PlaidLink } from '@/components/PlaidLink';
import { supabase } from '@/integrations/supabase/client';

export default function Accounts() {
  const navigate = useNavigate();

  const { data: accounts, isLoading, refetch } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAccounts,
  });

  const syncMutation = useMutation({
    mutationFn: async (accountId: string) => {
      const { data, error } = await supabase.functions.invoke('sync-transactions', {
        body: { accountId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Synced ${data.transactions_synced} transaction(s)!`);
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
    },
    onError: () => {
      toast.error('Failed to sync transactions');
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Accounts</h1>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground mt-1">Manage your connected bank accounts</p>
        </div>
        <PlaidLink onSuccess={() => refetch()} />
      </div>

      {!accounts || accounts.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LinkIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your bank accounts to start tracking your finances
            </p>
            <PlaidLink onSuccess={() => refetch()} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card key={account.account_id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{account.custom_name || account.institution_name}</CardTitle>
                    <CardDescription className="mt-1">
                      {account.account_number_masked ? `•••• ${account.account_number_masked}` : account.account_type}
                    </CardDescription>
                  </div>
                  <Badge variant={account.is_active ? 'default' : 'secondary'}>
                    {account.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold">{formatCurrency(account.balance || 0)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Current Balance</p>
                </div>
                
                <div className="flex gap-2">
                  {account.plaid_access_token && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => syncMutation.mutate(account.account_id)}
                      disabled={syncMutation.isPending}
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
                      Sync
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => navigate(`/transactions?account=${account.account_id}`)}
                  >
                    View Transactions
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
