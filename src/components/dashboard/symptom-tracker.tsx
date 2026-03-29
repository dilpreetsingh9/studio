
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Smile, Zap, Activity, Ghost, Heart, Droplets, Brain, AlertCircle, Plus, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { acknowledgeSymptomLog } from '@/ai/flows/acknowledge-symptom-log';

const symptoms = [
  { type: 'Mood', icon: Smile, color: 'text-yellow-600 bg-yellow-100' },
  { type: 'Energy', icon: Zap, color: 'text-emerald-600 bg-emerald-100' },
  { type: 'Pain', icon: AlertCircle, color: 'text-red-600 bg-red-100' },
  { type: 'Acne', icon: Activity, color: 'text-orange-600 bg-orange-100' },
  { type: 'Libido', icon: Heart, color: 'text-pink-600 bg-pink-100' },
  { type: 'Sleep', icon: Brain, color: 'text-indigo-600 bg-indigo-100' },
  { type: 'Stress', icon: Ghost, color: 'text-purple-600 bg-purple-100' },
  { type: 'Digestion', icon: Droplets, color: 'text-blue-600 bg-blue-100' },
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
      // For MVP, we acknowledge the first selected symptom with full logic
      // In a real app, we'd log all and maybe get a summary acknowledgement
      const primarySymptom = selected[0];
      
      const response = await acknowledgeSymptomLog({
        signalType: primarySymptom,
        signalValue: 4, // Defaulting to high for demonstration of empathy
        threeDayPattern: false, // Mocked for now
        targetLanguage: 'English'
      });

      toast({
        title: "I hear you.",
        description: response.acknowledgement,
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
    <Card className="shadow-md border-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Daily Vitals & Symptoms</CardTitle>
            <CardDescription>Track how you feel throughout your cycle.</CardDescription>
          </div>
          <Button size="icon" variant="ghost" className="rounded-full">
            <Plus className="h-5 w-5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-3 mb-6">
          {symptoms.map((s) => (
            <button
              key={s.type}
              onClick={() => toggleSymptom(s.type)}
              className={cn(
                "flex flex-col items-center gap-2 p-3 rounded-2xl transition-all border",
                selected.includes(s.type) 
                  ? "bg-primary border-primary scale-95" 
                  : "bg-card border-muted hover:border-primary/50"
              )}
            >
              <div className={cn(
                "p-2 rounded-xl transition-colors",
                selected.includes(s.type) ? "bg-white/20 text-white" : s.color
              )}>
                <s.icon className="h-5 w-5" />
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-tighter",
                selected.includes(s.type) ? "text-white" : "text-muted-foreground"
              )}>
                {s.type}
              </span>
            </button>
          ))}
        </div>
        <Button 
          className="w-full h-12 rounded-2xl font-bold tracking-tight" 
          disabled={selected.length === 0 || isLogging}
          onClick={handleLog}
        >
          {isLogging ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : selected.length > 0 ? (
            `Log ${selected.length} Symptoms`
          ) : (
            'Select to Log'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
