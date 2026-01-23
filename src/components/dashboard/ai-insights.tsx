'use client';

import { useEffect, useState } from 'react';
import { Wand2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchPersonalizedInsights } from '@/app/actions';

export default function AiInsights() {
  const [insights, setInsights] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getInsights() {
      setLoading(true);
      const result = await fetchPersonalizedInsights();
      setInsights(result);
      setLoading(false);
    }
    getInsights();
  }, []);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      );
    }

    const insightItems = insights.split('\n').filter(item => item.trim().startsWith('*') || item.trim().startsWith('-'));

    return (
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            {insightItems.map((item, index) => (
                <li key={index}>{item.replace(/[-*]\s*/, '')}</li>
            ))}
        </ul>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">AI-Powered Insights</CardTitle>
        <Wand2 className="h-5 w-5 text-primary" />
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
