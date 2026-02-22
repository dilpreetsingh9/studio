'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertCircle, Share2, Zap } from 'lucide-react';
import { patientData } from '@/lib/data';
import { HealthGoal } from '@/lib/types';
import { generateHealthGoals } from '@/ai/flows/generate-health-goals';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface HealthGoalsProps {
  language?: string;
}

export default function HealthGoals({ language = 'English' }: HealthGoalsProps) {
  const [goals, setGoals] = useState<HealthGoal[]>(patientData.healthGoals);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const handleGenerateGoals = async () => {
    setIsGenerating(true);
    try {
      const vitalsString = patientData.vitals.map(v => `${v.name}: ${v.value} ${v.unit}`).join(', ');
      const existingGoalNames = goals.map(g => g.name);
      
      const result = await generateHealthGoals({
        medicalHistory: patientData.medicalHistory,
        currentVitals: vitalsString,
        existingGoals: existingGoalNames,
        targetLanguage: language
      });

      const newGoals: HealthGoal[] = result.recommendedGoals.map((g, index) => ({
        id: `ai-${Date.now()}-${index}`,
        name: g.name,
        target: g.target,
        current: 0,
        unit: g.unit,
      }));

      setGoals(prev => [...newGoals, ...prev]);
      toast({
        title: "AI Goals Generated",
        description: `New goals added in ${language}.`,
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Generation Failed",
        description: "Could not generate AI goals at this time.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    toast({
      title: "Goals Shared",
      description: "Your health progress has been shared with your care team.",
    });
  };

  const handleMotivate = () => {
    toast({
      title: "Keep it up!",
      description: "You are doing great! Every step counts towards a healthier you.",
    });
  };

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Health Goals</CardTitle>
          <CardDescription>Progress towards your targets ({language}).</CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="text-primary border-primary/20 hover:bg-primary/5"
          onClick={handleGenerateGoals}
          disabled={isGenerating}
        >
          {isGenerating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          AI Suggest
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {goals.map((goal) => (
            <div key={goal.id} className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <p className="font-medium">{goal.name}</p>
                <p className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{goal.current.toLocaleString()}</span>
                  / {goal.target.toLocaleString()} {goal.unit}
                </p>
              </div>
              <Progress value={(goal.current / goal.target) * 100} className="h-2" />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleShare}>
            <Share2 className="mr-2 h-3.5 w-3.5" /> Share
          </Button>
          <Button variant="outline" size="sm" className="w-full text-xs" onClick={handleMotivate}>
            <Zap className="mr-2 h-3.5 w-3.5" /> Motivate
          </Button>
        </div>

        <Alert variant="default" className="bg-muted/50 border-none mt-2">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle className="text-xs font-semibold">Medical Disclaimer</AlertTitle>
          <AlertDescription className="text-[10px] text-muted-foreground leading-tight">
            These goals are AI-generated for informational purposes only.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
