
'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Apple, Dumbbell, Briefcase, Heart } from 'lucide-react';
import { patientData } from '@/lib/data';

const guidance = {
  Follicular: [
    { type: 'Nutrition', icon: Apple, text: 'Focus on fermented foods and lean proteins to support rising estrogen.' },
    { type: 'Exercise', icon: Dumbbell, text: 'High energy phase. Try HIIT or heavy lifting.' },
    { type: 'Work', icon: Briefcase, text: 'Great for brainstorming and initiating new projects.' },
    { type: 'Social', icon: Heart, text: 'Outward energy is high. Ideal for networking or social events.' },
  ],
  // ... other phases would be defined here
};

export default function LifestyleGuidance() {
  const currentPhase = patientData.cycleData.predictedPhase;
  const recommendations = guidance[currentPhase as keyof typeof guidance] || guidance.Follicular;

  return (
    <Card className="shadow-md border-primary/5">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Phase-Based Guidance</CardTitle>
        <CardDescription>Optimize your lifestyle for your {currentPhase} phase.</CardDescription>
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
