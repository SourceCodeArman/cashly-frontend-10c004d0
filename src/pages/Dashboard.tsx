import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboardService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardService.getDashboard,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back! Here's your financial overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-border shadow-soft hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(data?.account_balance.total || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-soft hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Income</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(data?.monthly_spending?.by_category?.reduce((sum, cat) => sum + (cat.amount || 0), 0) || 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-soft hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Spending</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {formatCurrency(data?.monthly_spending.total || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
            <CardDescription>Your spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data?.monthly_spending?.by_category?.map((cat, i) => ({ date: cat.name, amount: cat.amount || 0 })) || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                />
                <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-border shadow-soft">
          <CardHeader>
            <CardTitle>Savings Goals</CardTitle>
            <CardDescription>Track your progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="font-medium">Total Saved</p>
                  <p className="text-sm text-muted-foreground">
                    {data?.goals?.filter(g => g.is_active)?.length || 0} active goals
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-accent">
                  {formatCurrency(data?.goals?.reduce((sum, g) => sum + parseFloat(g.current_amount.toString()), 0) || 0)}
                </p>
                <p className="text-sm text-muted-foreground">
                  of {formatCurrency(data?.goals?.reduce((sum, g) => sum + parseFloat(g.target_amount.toString()), 0) || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border shadow-soft">
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>Your latest financial activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.recent_transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.transaction_id} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                <div>
                  <p className="font-medium">{transaction.merchant_name || transaction.description}</p>
                  <p className="text-sm text-muted-foreground">{new Date(transaction.date).toLocaleDateString()}</p>
                </div>
                <div className={`text-lg font-semibold ${transaction.amount < 0 ? 'text-destructive' : 'text-success'}`}>
                  {transaction.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(transaction.amount))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
