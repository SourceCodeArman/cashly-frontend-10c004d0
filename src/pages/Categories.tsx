import { useQuery } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag } from 'lucide-react';

export default function Categories() {
  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: categoryService.getCategories,
  });

  const defaultCategories = categories?.filter((c) => c.is_system_category) || [];
  const customCategories = categories?.filter((c) => !c.is_system_category) || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold">Categories</h1>
        <p className="text-muted-foreground mt-1">Organize your transactions with categories</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Default Categories</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {defaultCategories.map((category) => (
              <Card key={category.category_id} className="border-border shadow-soft">
                <CardContent className="flex items-center gap-3 p-4">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <Tag className="h-5 w-5" style={{ color: category.color }} />
                  </div>
                  <div>
                    <p className="font-medium">{category.name}</p>
                    <Badge variant="secondary" className="mt-1">
                      Default
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {customCategories.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Custom Categories</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {customCategories.map((category) => (
                <Card key={category.category_id} className="border-border shadow-soft">
                  <CardContent className="flex items-center gap-3 p-4">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      <Tag className="h-5 w-5" style={{ color: category.color }} />
                    </div>
                    <p className="font-medium">{category.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
