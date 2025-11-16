import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link as LinkIcon, Loader2 } from 'lucide-react';

interface PlaidLinkProps {
  onSuccess?: () => void;
}

export function PlaidLink({ onSuccess }: PlaidLinkProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  const onSuccessCallback = useCallback(async (publicToken: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('exchange-public-token', {
        body: { publicToken },
      });

      if (error) throw error;

      toast.success(`Successfully linked ${data.accounts_count} account(s) with ${data.transactions_synced || 0} transaction(s)!`);
      onSuccess?.();
    } catch (error) {
      console.error('Error exchanging token:', error);
      toast.error('Failed to link account');
    } finally {
      setIsLoading(false);
    }
  }, [onSuccess]);

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
  );
}
