import { useQuery, useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { transactionService } from '@/services/transactionService';
import { categoryService } from '@/services/categoryService';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export default function Transactions() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['transactions', page, categoryFilter],
    queryFn: () =>
      transactionService.getTransactions({
        page,
        page_size: 20,
        category: categoryFilter === 'all' ? undefined : categoryFilter,
      }),
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  });

  const { data: stats } = useQuery({
    queryKey: ['transaction-stats'],
    queryFn: () => transactionService.getStats(),
  });

  const categorizeMutation = useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string }) =>
      transactionService.categorizeTransaction(id, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['transaction-stats'] });
      toast.success('Transaction categorized successfully!');
    },
  });

  const filteredTransactions = transactionsData?.results.filter((t) =>
    (t.merchant_name || t.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Transactions</h1>
        <p className="text-muted-foreground mt-1">View and manage your financial transactions</p>
      </div>

      {stats && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-border shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Spending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">
                {formatCurrency(stats.expense_total)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-success">
                {formatCurrency(stats.income_total)}
              </p>
            </CardContent>
          </Card>
          <Card className="border-border shadow-soft">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-primary">{stats.total_count}</p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="border-border shadow-soft">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Transactions</CardTitle>
              <CardDescription>Browse your transaction history</CardDescription>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.category_id} value={cat.category_id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions?.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-secondary/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{transaction.name}</p>
                    {transaction.pending && <Badge variant="secondary">Pending</Badge>}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                    <span>{formatDate(transaction.date)}</span>
                    {transaction.category && (
                      <span className="text-primary">{transaction.category}</span>
                    )}
                    {transaction.merchant_name && <span>{transaction.merchant_name}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Select
                    value={transaction.category || ''}
                    onValueChange={(value) =>
                      categorizeMutation.mutate({ id: transaction.id, categoryId: value })
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div
                    className={`text-lg font-semibold w-24 text-right ${
                      transaction.amount < 0 ? 'text-destructive' : 'text-success'
                    }`}
                  >
                    {transaction.amount < 0 ? '-' : '+'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {transactionsData && (transactionsData.next || transactionsData.previous) && (
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!transactionsData.previous}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">Page {page}</span>
              <Button
                variant="outline"
                onClick={() => setPage((p) => p + 1)}
                disabled={!transactionsData.next}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
