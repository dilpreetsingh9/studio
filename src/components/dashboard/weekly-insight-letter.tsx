'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Sparkles, Loader2, Calendar, ArrowRight, Quote } from 'lucide-react';
import { generateWeeklyLetter, GenerateWeeklyLetterOutput } from '@/ai/flows/generate-weekly-letter';
import { patientData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function WeeklyInsightLetter({ profile, language = 'English' }: { profile: any; language?: string }) {
  const [letter, setLetter] = useState<GenerateWeeklyLetterOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const fetchWeeklyLetter = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      // Logic to determine week number and days active
      let daysActive = 7;
      let weekNumber = 1;
      
      if (profile.createdAt) {
        const createdDate = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
        const diffMs = new Date().getTime() - createdDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));
        weekNumber = Math.ceil((diffDays + 1) / 7);
        daysActive = Math.min(diffDays + 1, 7);
      }

      const result = await generateWeeklyLetter({
        firstName: profile.firstName,
        weekNumber: weekNumber,
        daysActive: daysActive,
        healthFocus: profile.healthFocus,
        avgSleep: 7.2,
        priorAvgSleep: 6.8,
        avgRHR: 65,
        priorAvgRHR: 67,
        avgHRV: 58,
        priorAvgHRV: 52,
        activityDays: 4,
        medsOnTimePct: 92,
        phaseThisWeek: patientData.cycleData.predictedPhase,
        journalEntryCount: (patientData.journalEntries?.length || 0),
        dominantMood: 'Balanced',
        dominantEnergy: 'Steady',
        notableEvents: ['Family dinner', 'Late work night'],
        biggestImprovement: weekNumber === 1 
          ? 'Your rhythm of showing up for your daily journal' 
          : 'Your resting heart rate has been settling beautifully',
        biggestWatch: weekNumber === 1 
          ? 'How your sleep duration shifted slightly mid-week' 
          : 'A slight dip in sleep duration toward the weekend',
        targetLanguage: language
      });
      setLetter(result);
      setIsOpen(true);
    } catch (error) {
      console.error('Failed to fetch weekly letter', error);
      toast({
        variant: 'destructive',
        title: 'Unable to write letter',
        description: 'I need a little more time to reflect. Please try again later.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isOpen ? (
        <Card className="shadow-md border-primary/10 bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer group" onClick={fetchWeeklyLetter}>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm border group-hover:scale-110 transition-transform">
                <Mail className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-primary">Your Weekly Reflection</h3>
                <p className="text-sm text-muted-foreground font-medium italic">A quiet look back at the last seven days.</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full group-hover:translate-x-1 transition-transform" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRight className="h-5 w-5" />}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-xl border-none bg-[#FCFAF7] relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Quote className="h-40 w-40 text-primary rotate-180" />
          </div>
          
          <CardHeader className="pb-4 relative z-10 border-b border-primary/5 mb-6">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-[0.2em]">
                <Calendar className="h-3.5 w-3.5" />
                Review: Week 1
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 text-[10px] font-bold text-muted-foreground uppercase hover:bg-primary/5">
                Close Letter
              </Button>
            </div>
            <CardTitle className="text-2xl font-black tracking-tight text-primary mt-4">
              Dear {profile?.firstName},
            </CardTitle>
          </CardHeader>
          
          <CardContent className="space-y-6 relative z-10">
            {letter ? (
              <div className="space-y-6">
                <div className="prose prose-sm max-w-none">
                  {letter.letterContent.split('\n\n').map((para, i) => (
                    <p key={i} className="text-base leading-relaxed text-foreground/90 font-medium italic mb-4 last:mb-0">
                      {para}
                    </p>
                  ))}
                </div>
                
                <div className="pt-8 border-t border-primary/10">
                  <p className="text-lg font-bold text-primary italic leading-tight">
                    {letter.closingLine}
                  </p>
                  <div className="mt-4 flex items-center gap-2">
                    <div className="h-0.5 w-8 bg-primary/20" />
                    <span className="text-[10px] font-black text-primary/60 uppercase tracking-[0.3em]">Nitya</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4 opacity-50 text-primary" />
                <p className="text-xs font-medium italic">Reflecting on your week...</p>
              </div>
            )}
            
            <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
               {[
                 { label: 'Sleep', value: '7.2h', color: 'bg-indigo-50' },
                 { label: 'RHR', value: '65bpm', color: 'bg-rose-50' },
                 { label: 'Activity', value: '4/7', color: 'bg-emerald-50' },
                 { label: 'Journal', value: `${patientData.journalEntries?.length || 0} entries`, color: 'bg-amber-50' }
               ].map((stat) => (
                 <div key={stat.label} className={cn("p-3 rounded-2xl border border-transparent hover:border-primary/10 transition-colors", stat.color)}>
                   <p className="text-[9px] font-black text-primary/60 uppercase tracking-widest mb-1">{stat.label}</p>
                   <p className="text-sm font-bold text-primary">{stat.value}</p>
                 </div>
               ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
