
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smile, Zap, AlertCircle, Ghost, Loader2, Target, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { confirmLogEntry } from '@/ai/flows/confirm-log-entry';
import { CheckInDialog } from './check-in-dialog';

export default function SymptomTracker({ profile }: { profile?: any }) {
  const [isOpen, setIsOpen] = useState(false);

  const isMale = profile?.gender === 'Male';

  const checkInSymptoms = [
    { type: 'Mood', icon: Smile, color: 'text-yellow-600 bg-yellow-100' },
    { type: 'Energy', icon: Zap, color: 'text-emerald-600 bg-emerald-100' },
    { 
      type: isMale ? 'Focus' : 'Pain', 
      icon: isMale ? Target : AlertCircle, 
      color: isMale ? 'text-blue-600 bg-blue-100' : 'text-red-600 bg-red-100' 
    },
    { type: 'Stress', icon: Ghost, color: 'text-purple-600 bg-purple-100' },
  ];

  return (
    <>
      <Card className="shadow-md border-primary/5 rounded-[2rem] bg-white overflow-hidden group hover:border-primary/20 transition-all cursor-pointer" onClick={() => setIsOpen(true)}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="text-xl font-black tracking-tight">How are you feeling?</CardTitle>
              <CardDescription className="text-xs font-medium">Share a moment with Jeiva.</CardDescription>
            </div>
            <div className="bg-primary/5 p-3 rounded-2xl text-primary group-hover:scale-110 transition-transform">
              <Plus className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-3">
            {checkInSymptoms.map((s) => (
              <div
                key={s.type}
                className="flex flex-col items-center gap-2 p-3 rounded-3xl bg-card border border-muted opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0 transition-all"
              >
                <div className={cn("p-2.5 rounded-2xl", s.color)}>
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-tight text-muted-foreground">
                  {s.type}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <CheckInDialog 
        open={isOpen} 
        onOpenChange={setIsOpen} 
        profile={profile} 
        language="English" 
      />
    </>
  );
}
