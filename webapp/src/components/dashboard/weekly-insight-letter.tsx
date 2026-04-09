'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Sparkles, Loader2, Calendar, ArrowRight, Quote, Info } from 'lucide-react';
import { generateWeeklyLetter, GenerateWeeklyLetterOutput } from '@/ai/flows/generate-weekly-letter';
import { generatePregnancyWeeklyLetter } from '@/ai/flows/generate-pregnancy-weekly-letter';
import { patientData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { t } from '@/lib/translations';

export default function WeeklyInsightLetter({ profile, language = 'English' }: { profile: any; language?: string }) {
  const [letter, setLetter] = useState<{ letterContent: string; closingLine?: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const isPregnant = profile?.lifeStage === 'Pregnancy' || profile?.healthFocus?.toLowerCase().includes('pregnancy');

  const fetchWeeklyLetter = async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      let daysActive = 7;
      let weekNumber = 1;
      let monthNumber = undefined;
      
      if (profile.createdAt) {
        const createdDate = profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt);
        const diffMs = new Date().getTime() - createdDate.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 3600 * 24));
        weekNumber = Math.ceil((diffDays + 1) / 7);
        
        const activityCount = (patientData.journalEntries?.length || 0) + (patientData.medications?.filter(m => m.streak! > 0).length || 0);
        daysActive = Math.min(Math.max(activityCount, 1), 7);

        if (weekNumber % 4 === 0) {
          monthNumber = weekNumber / 4;
        }
      }

      if (isPregnant) {
        const currentWeek = profile.pregnancyWeek || 14;
        const result = await generatePregnancyWeeklyLetter({
          firstName: profile.firstName,
          currentWeek,
          trimester: currentWeek <= 12 ? 1 : (currentWeek <= 26 ? 2 : 3),
          weeksRemaining: 40 - currentWeek,
          avgSleep: 7.2,
          sleepTrend: 'stable',
          avgRHR: 78,
          weightChange: 0.4,
          checkinCount: 5,
          topSymptom: 'Mild nausea',
          movementFeltCount: 12,
          routineStreak: profile.routineStreak || 12,
          nextWeek: currentWeek + 1,
          upcomingMilestone: currentWeek === 19 ? 'Anomaly scan window' : null,
          targetLanguage: language
        });
        setLetter(result);
      } else {
        const result = await generateWeeklyLetter({
          firstName: profile.firstName,
          weekNumber: weekNumber,
          monthNumber: monthNumber,
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
            ? 'your steady rhythm of showing up for your daily journal' 
            : 'the way your resting heart rate has been settling beautifully',
          biggestWatch: weekNumber === 1 
            ? 'how your sleep duration shifted slightly mid-week' 
            : 'a slight dip in sleep duration toward the weekend',
          monthDelta: monthNumber ? 'the gradual lowering of your baseline stress signals over these thirty days' : undefined,
          mostConsistent: monthNumber ? 'your morning routine of checking in before the day gets full' : undefined,
          stillEmerging: monthNumber ? 'the connection between your sleep quality and your late-evening tea' : undefined,
          targetLanguage: language
        });
        setLetter(result);
      }
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

  const currentWeek = profile?.createdAt ? Math.ceil((new Date().getTime() - (profile.createdAt.toDate ? profile.createdAt.toDate() : new Date(profile.createdAt)).getTime()) / (1000 * 3600 * 24 * 7)) : 1;
  const isMonthMilestone = currentWeek > 0 && currentWeek % 4 === 0 && !isPregnant;
  const isThinWeek = (patientData.journalEntries?.length || 0) < 2 && currentWeek > 1;

  return (
    <div className="space-y-4">
      {!isOpen ? (
        <Card className={cn(
          "shadow-md border-primary/10 transition-all cursor-pointer group",
          isMonthMilestone ? "bg-accent/5 hover:bg-accent/10 border-accent/20" : "bg-primary/5 hover:bg-primary/10",
          isThinWeek && "bg-muted/5 border-muted hover:bg-muted/10"
        )} onClick={fetchWeeklyLetter}>
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white p-3 rounded-2xl shadow-sm border group-hover:scale-110 transition-transform">
                <Mail className={cn("h-6 w-6", isMonthMilestone ? "text-accent" : (isThinWeek ? "text-muted-foreground" : "text-primary"))} />
              </div>
              <div>
                <h3 className={cn("text-lg font-bold font-ui", isMonthMilestone ? "text-accent" : (isThinWeek ? "text-muted-foreground" : "text-primary"))}>
                  {isPregnant ? 'Weekly Pregnancy Review' : (isMonthMilestone ? 'A Monthly Reflection' : (isThinWeek ? 'A Quiet Reflection' : 'Your Weekly Reflection'))}
                </h3>
                <p className="font-ui text-small text-muted-foreground font-medium italic">
                  {isPregnant ? `Looking back at week ${profile.pregnancyWeek || 14}.` : (isMonthMilestone 
                    ? 'Thirty days. A moment to look at the larger pattern.' 
                    : (isThinWeek ? 'A small note on a quiet week.' : t('weeklyLetterInvite', language)))}
                </p>
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
              <Badge variant="outline" className={cn(
                "gap-1 px-3 py-1 rounded-full text-label font-bold uppercase tracking-[0.2em]",
                isMonthMilestone ? "bg-accent/5 text-accent border-accent/20" : "bg-primary/5 text-primary border-primary/20",
                isThinWeek && "bg-muted/10 text-muted-foreground border-muted"
              )}>
                <Calendar className="h-3.5 w-3.5" />
                {isPregnant ? `Pregnancy Week ${profile.pregnancyWeek || 14}` : (isMonthMilestone ? `Milestone: Month ${currentWeek / 4}` : (isThinWeek ? `Quiet Review: Week ${currentWeek}` : `Review: Week ${currentWeek}`))}
              </Badge>
              <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)} className="h-8 text-label font-bold text-muted-foreground uppercase hover:bg-primary/5 tracking-widest">
                Close Letter
              </Button>
            </div>
            {!isPregnant && (
              <CardTitle className="greeting-name text-primary mt-4">
                Dear {profile?.firstName},
              </CardTitle>
            )}
          </CardHeader>
          
          <CardContent className="space-y-6 relative z-10">
            {letter ? (
              <div className="space-y-8">
                <div className="space-y-6">
                  {letter.letterContent.split('\n\n').map((para, i) => (
                    <p key={i} className="weekly-letter text-foreground/90 italic">
                      {para}
                    </p>
                  ))}
                </div>
                
                {isThinWeek && !isPregnant && (
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-start gap-3">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="font-ui text-small text-muted-foreground font-medium leading-relaxed italic">
                      This was a quiet week for our data, so I've kept this letter short and honest. I'm here when you're ready to share more.
                    </p>
                  </div>
                )}

                {letter.closingLine ? (
                  <div className="pt-8 border-t border-primary/10">
                    <p className="font-content text-display text-primary italic leading-tight pr-8">
                      {letter.closingLine}
                    </p>
                    <div className="mt-6 flex items-center gap-2">
                      <div className="h-0.5 w-8 bg-primary/20" />
                      <span className="text-label font-black text-primary/60 uppercase tracking-[0.3em]">Jeiva</span>
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 flex items-center gap-2">
                    <div className="h-0.5 w-8 bg-primary/20" />
                    <span className="text-label font-black text-primary/60 uppercase tracking-[0.3em]">Jeiva</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4 opacity-50 text-primary" />
                <p className="text-small font-medium italic">Reflecting on your journey...</p>
              </div>
            )}
            
            {!isThinWeek && (
              <div className="pt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
                 {[
                   { label: 'Sleep', value: '7.2h', color: 'bg-indigo-50' },
                   { label: 'RHR', value: isPregnant ? '78bpm' : '65bpm', color: 'bg-rose-50' },
                   { label: 'Activity', value: '4/7', color: 'bg-emerald-50' },
                   { label: 'Journal', value: `${patientData.journalEntries?.length || 0} entries`, color: 'bg-amber-50' }
                 ].map((stat) => (
                   <div key={stat.label} className={cn("p-3 rounded-2xl border border-transparent hover:border-primary/10 transition-colors", stat.color)}>
                     <p className="text-label font-black text-primary/60 uppercase tracking-widest mb-1">{stat.label}</p>
                     <p className="text-body font-bold text-primary">{stat.value}</p>
                   </div>
                 ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
