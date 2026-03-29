'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smile, Zap, AlertCircle, Ghost, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { confirmLogEntry } from '@/ai/flows/confirm-log-entry';

const checkInSymptoms = [
  { type: 'Mood', icon: Smile, color: 'text-yellow-600 bg-yellow-100' },
  { type: 'Energy', icon: Zap, color: 'text-emerald-600 bg-emerald-100' },
  { type: 'Pain', icon: AlertCircle, color: 'text-red-600 bg-red-100' },
  { type: 'Stress', icon: Ghost, color: 'text-purple-600 bg-purple-100' },
];

export default function SymptomTracker() {
  const [selected, setSelected] = useState<string[]>([]);
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  const toggleSymptom = (type: string) => {
    setSelected(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleLog = async () => {
    if (selected.length === 0) return;
    setIsLogging(true);
    
    try {
      const primarySymptom = selected[0];
      const response = await confirmLogEntry({
        logType: primarySymptom,
        logValue: 4,
        logStreak: 1, 
        isFirstLog: false,
        targetLanguage: 'English'
      });

      toast({
        title: "I hear you.",
        description: response.confirmation,
      });
      setSelected([]);
    } catch (error) {
      console.error('Failed to log symptoms', error);
      toast({
        variant: "destructive",
        title: "Logging failed",
        description: "I'm having trouble saving your notes right now.",
      });
    } finally {
      setIsLogging(false);
    }
  };

  return (
    <Card className="shadow-md border-primary/5 rounded-[2rem] bg-white overflow-hidden">
      <CardHeader className="pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-black tracking-tight">How are you feeling?</CardTitle>
          <CardDescription className="text-xs font-medium">A quick check-in for Nitya to note your state.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 mb-6">
          {checkInSymptoms.map((s) => (
            <button
              key={s.type}
              onClick={() => toggleSymptom(s.type)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-3xl transition-all border",
                selected.includes(s.type) 
                  ? "bg-primary border-primary scale-95 shadow-inner" 
                  : "bg-card border-muted hover:border-primary/20"
              )}
            >
              <div className={cn(
                "p-2.5 rounded-2xl transition-colors",
                selected.includes(s.type) ? "bg-white/20 text-white" : s.color
              )}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[10px] font-black uppercase tracking-tight",
                selected.includes(s.type) ? "text-white" : "text-muted-foreground"
              )}>
                {s.type}
              </span>
            </button>
          ))}
        </div>
        <Button 
          className="w-full h-14 rounded-3xl font-black uppercase tracking-widest text-xs shadow-lg hover:shadow-xl transition-all" 
          disabled={selected.length === 0 || isLogging}
          onClick={handleLog}
        >
          {isLogging ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : selected.length > 0 ? (
            `Log ${selected.length} Patterns`
          ) : (
            'Tap to Select'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
