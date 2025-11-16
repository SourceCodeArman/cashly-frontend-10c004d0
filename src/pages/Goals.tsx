import { useQuery, useMutation } from '@tanstack/react-query';
import { goalService } from '@/services/goalService';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/lib/utils';
import { Plus, Target, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function Goals() {
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    target_date: '',
  });

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: goalService.getGoals,
  });

  const createMutation = useMutation({
    mutationFn: goalService.createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal created successfully!');
      setIsCreateOpen(false);
      setFormData({ name: '', target_amount: '', target_date: '' });
    },
    onError: () => {
      toast.error('Failed to create goal');
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name: formData.name,
      target_amount: parseFloat(formData.target_amount),
      target_date: formData.target_date,
    });
  };

  const activeGoals = goals?.filter((g) => g.status === 'active') || [];
  const completedGoals = goals?.filter((g) => g.status === 'completed') || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Savings Goals</h1>
          <p className="text-muted-foreground mt-1">Track and achieve your financial goals</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-accent">
              <Plus className="mr-2 h-4 w-4" />
              New Goal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>Set a new savings goal to track your progress</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Goal Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Emergency Fund"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_amount">Target Amount</Label>
                <Input
                  id="target_amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={formData.target_amount}
                  onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="target_date">Target Date</Label>
                <Input
                  id="target_date"
                  type="date"
                  value={formData.target_date}
                  onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-gradient-accent" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Goal'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {activeGoals.length === 0 && completedGoals.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No goals yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first savings goal to start tracking
            </p>
            <Button onClick={() => setIsCreateOpen(true)} className="bg-gradient-accent">
              <Plus className="mr-2 h-4 w-4" />
              Create Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {activeGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Active Goals</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {activeGoals.map((goal) => {
                  const progress = (goal.current_amount / goal.target_amount) * 100;
                  return (
                    <Card
                      key={goal.id}
                      className="border-border shadow-soft hover:shadow-md transition-all cursor-pointer"
                      onClick={() => navigate(`/goals/${goal.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg">{goal.name}</CardTitle>
                            <CardDescription>
                              Target: {new Date(goal.target_date).toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-accent" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{progress.toFixed(1)}%</span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        <div className="flex justify-between items-end">
                          <div>
                            <p className="text-sm text-muted-foreground">Current</p>
                            <p className="text-xl font-bold text-accent">
                              {formatCurrency(goal.current_amount)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Target</p>
                            <p className="text-lg font-semibold">
                              {formatCurrency(goal.target_amount)}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {completedGoals.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Completed Goals</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {completedGoals.map((goal) => (
                  <Card key={goal.id} className="border-success/30 bg-success/5">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {goal.name}
                        <span className="text-sm font-normal text-success">✓ Completed</span>
                      </CardTitle>
                      <CardDescription>
                        Completed: {new Date(goal.updated_at).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-success">
                        {formatCurrency(goal.target_amount)}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
