import { useQuery, useMutation } from '@tanstack/react-query';
import { accountService } from '@/services/accountService';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Plus, RefreshCw, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { usePlaidLink } from 'react-plaid-link';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Accounts() {
  const navigate = useNavigate();
  const [linkToken, setLinkToken] = useState<string | null>(null);

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: accountService.getAccounts,
  });

  const linkTokenMutation = useMutation({
    mutationFn: accountService.createLinkToken,
    onSuccess: (data) => {
      setLinkToken(data.link_token);
    },
    onError: () => {
      toast.error('Failed to create link token');
    },
  });

  const connectMutation = useMutation({
    mutationFn: accountService.connectAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account connected successfully!');
    },
    onError: () => {
      toast.error('Failed to connect account');
    },
  });

  const syncMutation = useMutation({
    mutationFn: accountService.syncAccount,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success('Account synced successfully!');
    },
    onError: () => {
      toast.error('Failed to sync account');
    },
  });

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: (publicToken, metadata) => {
      connectMutation.mutate({
        public_token: publicToken,
        institution_id: metadata.institution?.institution_id || '',
        institution_name: metadata.institution?.name || '',
        accounts: metadata.accounts.map((acc) => ({
          id: acc.id,
          name: acc.name,
          type: acc.type,
          subtype: acc.subtype,
          mask: acc.mask || '',
        })),
      });
    },
  });

  const handleConnectAccount = () => {
    linkTokenMutation.mutate();
  };

  if (linkToken && ready) {
    open();
  }

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
        <Button onClick={handleConnectAccount} className="bg-gradient-primary">
          <Plus className="mr-2 h-4 w-4" />
          Connect Account
        </Button>
      </div>

      {!accounts || accounts.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LinkIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No accounts connected</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Connect your first bank account to get started
            </p>
            <Button onClick={handleConnectAccount} className="bg-gradient-primary">
              <Plus className="mr-2 h-4 w-4" />
              Connect Account
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <Card
              key={account.id}
              className="border-border shadow-soft hover:shadow-md transition-all cursor-pointer"
              onClick={() => navigate(`/accounts/${account.id}`)}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{account.name}</CardTitle>
                    <CardDescription className="mt-1">
                      {account.institution_name}
                      {account.mask && ` •••• ${account.mask}`}
                    </CardDescription>
                  </div>
                  <Badge variant={account.is_active ? 'default' : 'secondary'} className="ml-2">
                    {account.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(account.current_balance)}
                  </p>
                </div>
                {account.available_balance !== null && (
                  <div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-lg font-semibold">
                      {formatCurrency(account.available_balance)}
                    </p>
                  </div>
                )}
                <div className="pt-2 border-t border-border flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Last synced: {new Date(account.last_synced_at).toLocaleDateString()}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      syncMutation.mutate(account.id);
                    }}
                    disabled={syncMutation.isPending}
                  >
                    <RefreshCw className="h-3 w-3" />
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
