import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link as LinkIcon, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

interface PlaidAccount {
  id: string;
  name: string;
  mask: string | null;
  type: string;
  subtype: string | null;
}

export function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAccountSelection, setShowAccountSelection] = useState(false);
  const [availableAccounts, setAvailableAccounts] = useState<PlaidAccount[]>([]);
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());
  const [publicToken, setPublicToken] = useState<string | null>(null);

  useEffect(() => {
    const createLinkToken = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('create-link-token');
        
        if (error) throw error;
        
        if (data?.link_token) {
          setLinkToken(data.link_token);
        }
      } catch (error) {
        console.error('Error creating link token:', error);
        toast.error('Failed to initialize Plaid connection');
      }
    };

    createLinkToken();
  }, []);

  const onSuccessCallback = useCallback(async (token: string, metadata: any) => {
    setPublicToken(token);
    
    // Extract accounts from metadata
    const accounts: PlaidAccount[] = metadata.accounts.map((acc: any) => ({
      id: acc.id,
      name: acc.name,
      mask: acc.mask,
      type: acc.type,
      subtype: acc.subtype,
    }));
    
    setAvailableAccounts(accounts);
    setSelectedAccounts(new Set(accounts.map(acc => acc.id))); // Select all by default
    setShowAccountSelection(true);
  }, []);

  const handleConfirmSelection = async () => {
    if (!publicToken || selectedAccounts.size === 0) {
      toast.error('Please select at least one account');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('exchange-public-token', {
        body: { 
          publicToken,
          selectedAccountIds: Array.from(selectedAccounts)
        },
      });

      if (error) throw error;

      toast.success(`Successfully linked ${data.accounts_count} account(s) with ${data.transactions_synced || 0} transaction(s)!`);
      setShowAccountSelection(false);
      onSuccess?.();
    } catch (error) {
      console.error('Error exchanging token:', error);
      toast.error('Failed to link account');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAccount = (accountId: string) => {
    setSelectedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  const config = {
    token: linkToken,
    onSuccess: onSuccessCallback,
    onExit: (err: any) => {
      if (err) {
        console.error('Plaid Link error:', err);
        toast.error('Failed to complete bank connection');
      }
    },
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <>
      <Button
        onClick={() => open()}
        disabled={!ready || isLoading || !linkToken}
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Connecting...
          </>
        ) : (
          <>
            <LinkIcon className="h-4 w-4 mr-2" />
            Connect Bank Account
          </>
        )}
      </Button>

      <Dialog open={showAccountSelection} onOpenChange={setShowAccountSelection}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Select Accounts to Link</DialogTitle>
            <DialogDescription>
              Choose which accounts you want to connect to your financial dashboard
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {availableAccounts.map((account) => (
              <div key={account.id} className="flex items-center space-x-3">
                <Checkbox
                  id={account.id}
                  checked={selectedAccounts.has(account.id)}
                  onCheckedChange={() => toggleAccount(account.id)}
                />
                <Label
                  htmlFor={account.id}
                  className="flex-1 cursor-pointer"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{account.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {account.subtype || account.type}
                        {account.mask && ` ••${account.mask}`}
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            ))}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowAccountSelection(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmSelection}
              disabled={isLoading || selectedAccounts.size === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Linking...
                </>
              ) : (
                `Link ${selectedAccounts.size} Account${selectedAccounts.size !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
