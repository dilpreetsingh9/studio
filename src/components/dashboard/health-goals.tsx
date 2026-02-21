'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { patientData } from '@/lib/data';
import { HealthGoal } from '@/lib/types';
import { generateHealthGoals } from '@/ai/flows/generate-health-goals';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function HealthGoals() {
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
        description: "New personalized health goals have been added to your plan.",
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

  return (
    <Card className="shadow-md border-primary/10">
      <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>Health Goals</CardTitle>
          <CardDescription>Your progress towards a healthier you.</CardDescription>
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

        <Alert variant="default" className="bg-muted/50 border-none mt-4">
          <AlertCircle className="h-4 w-4 text-primary" />
          <AlertTitle className="text-xs font-semibold">Medical Disclaimer</AlertTitle>
          <AlertDescription className="text-[10px] text-muted-foreground leading-tight">
            These goals are AI-generated based on your data and are for informational purposes only. Always consult with your healthcare provider before starting new health regimens or making significant changes to your activity levels.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
