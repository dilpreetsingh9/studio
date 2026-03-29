
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Apple, Dumbbell, Coffee, Wind } from 'lucide-react';
import { patientData } from '@/lib/data';

const guidance = {
  Follicular: [
    { type: 'Nourishment', icon: Apple, text: 'A handful of soaked almonds with your morning tea for steady energy.' },
    { type: 'Movement', icon: Dumbbell, text: 'A 2-minute brisk walk after your rajma-chawal lunch.' },
    { type: 'Focus', icon: Coffee, text: 'The morning is your sharpest time. Use it for your big tasks.' },
    { type: 'Breath', icon: Wind, text: 'Try 2 minutes of Anulom Vilom before the 4 PM chai rush.' },
  ],
  Menstrual: [
    { type: 'Nourishment', icon: Apple, text: 'Warm khichdi with a little ghee. Comforting and easy on the gut.' },
    { type: 'Rest', icon: Wind, text: 'A simple stretch while the chai water boils. Nothing strenuous.' },
    { type: 'Peace', icon: Coffee, text: 'Keep your social circle small today. A quiet evening is enough.' },
    { type: 'Hydration', icon: Wind, text: 'Warm water with ginger. Sip it slowly throughout the day.' },
  ],
};

export default function LifestyleGuidance() {
  const currentPhase = patientData.cycleData.predictedPhase;
  const recommendations = guidance[currentPhase as keyof typeof guidance] || guidance.Follicular;

  return (
    <Card className="shadow-md border-primary/5">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Nitya's Invitations</CardTitle>
        <CardDescription>Small steps, achievable in under 2 minutes.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {recommendations.map((rec) => (
          <div key={rec.type} className="flex gap-4 p-4 rounded-2xl bg-secondary/5 border border-secondary/10 group hover:bg-secondary/10 transition-colors">
            <div className="bg-white p-2.5 rounded-xl shadow-sm border border-secondary/20 group-hover:scale-110 transition-transform">
              <rec.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{rec.type}</p>
              <p className="text-sm leading-relaxed text-foreground font-medium">{rec.text}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
