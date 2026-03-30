'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { patientData } from '@/lib/data';
import { 
  ArrowDown, 
  ArrowRight, 
  ArrowUp, 
  Microscope, 
  Sparkles, 
  Loader2, 
  MessageSquare,
  X,
  BrainCircuit
} from 'lucide-react';
import { t } from '@/lib/translations';
import { analyzeLabResult } from '@/ai/flows/analyze-lab-result';
import { synthesizeLabMarkers } from '@/ai/flows/synthesize-lab-markers';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' | 'first reading' }) => {
  const className = "h-4 w-4 text-muted-foreground";
  if (trend === 'up') return <ArrowUp className={className} />;
  if (trend === 'down') return <ArrowDown className={className} />;
  return <ArrowRight className={className} />;
};

interface LabResultsProps {
  language?: string;
  daysActive?: number;
}

export default function LabResults({ language = 'English', daysActive = 12 }: LabResultsProps) {
  const [analyzingMarker, setAnalyzingMarker] = useState<string | null>(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [collectiveInsight, setCollectiveInsight] = useState<string | null>(null);
  const [contexts, setContexts] = useState<Record<string, string>>({});

  const fetchCollectiveInsight = async () => {
    setIsSynthesizing(true);
    try {
      const result = await synthesizeLabMarkers({
        allReportsJson: JSON.stringify(patientData.labResults),
        recurringLow: 'Vitamin D3',
        recurringStable: 'Progesterone, FSH',
        trends: 'Steady increase in metabolic markers over three reports.',
        sex: patientData.details.gender,
        healthFocus: patientData.medicalHistory,
        daysActive: daysActive,
        targetLanguage: language
      });
      setCollectiveInsight(result.synthesis);
    } catch (error) {
      console.error('Failed to synthesize lab markers:', error);
    } finally {
      setIsSynthesizing(false);
    }
  };

  useEffect(() => {
    fetchCollectiveInsight();
  }, [language, daysActive]);

  const handleGetPerspective = async (lab: typeof patientData.labResults[0]) => {
    setAnalyzingMarker(lab.name);
    try {
      const result = await analyzeLabResult({
        markerName: lab.name,
        value: lab.value,
        unit: lab.unit,
        trend: lab.trend as any,
        phase: patientData.cycleData.predictedPhase,
        sex: patientData.details.gender,
        healthFocus: patientData.medicalHistory,
        targetLanguage: language
      });
      setContexts(prev => ({ ...prev, [lab.name]: result.context }));
    } catch (error) {
      console.error('Failed to analyze lab result:', error);
    } finally {
      setAnalyzingMarker(null);
    }
  };

  const clearContext = (markerName: string) => {
    setContexts(prev => {
      const updated = { ...prev };
      delete updated[markerName];
      return updated;
    });
  };

  return (
    <Card className="shadow-md border-primary/10 overflow-hidden bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-1">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Microscope className="h-5 w-5 text-primary" />
            {t('labResults', language)}
          </CardTitle>
          <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] uppercase font-bold tracking-widest px-2 py-0.5">
            Clinical Insights
          </Badge>
        </div>
        <CardDescription>Translating clinical biometrics into plain language.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Collective Synthesis Header */}
        <div className="relative">
          {isSynthesizing ? (
            <div className="p-6 rounded-2xl border-2 border-dashed bg-muted/5 flex flex-col items-center justify-center text-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary mb-2 opacity-50" />
              <p className="text-[10px] font-medium italic text-muted-foreground uppercase tracking-widest">Jeiva is finding the story...</p>
            </div>
          ) : collectiveInsight && (
            <div className="bg-primary/5 p-5 rounded-2xl border border-primary/10 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-2 duration-500">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <BrainCircuit className="h-16 w-16" />
              </div>
              <div className="flex items-start gap-4 relative z-10">
                <div className="bg-white p-2.5 rounded-xl shadow-sm border border-primary/5 shrink-0">
                  <BrainCircuit className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium leading-relaxed italic text-foreground pr-4">
                    "{collectiveInsight}"
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <div className="h-px w-4 bg-primary/20" />
                    <p className="text-[10px] text-primary/60 font-black uppercase tracking-widest">Jeiva's Collective Insight</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {patientData.labResults.map((lab) => (
            <div key={lab.name} className="space-y-2">
              <Card className="flex flex-col justify-between p-4 border-primary/5 bg-accent/5 hover:bg-accent/10 transition-all cursor-default relative overflow-hidden group">
                <div className="flex items-center justify-between relative z-10">
                  <p className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase">{lab.name}</p>
                  <lab.icon className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div className="mt-2 relative z-10 flex items-baseline justify-between">
                  <div>
                    <span className="text-xl font-black">{lab.value}</span>
                    <span className="ml-1 text-[9px] text-muted-foreground font-bold">{lab.unit}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 rounded-full hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleGetPerspective(lab)}
                    disabled={analyzingMarker === lab.name}
                  >
                    {analyzingMarker === lab.name ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <div className="mt-1 flex items-center text-[9px] text-muted-foreground font-bold relative z-10">
                  <TrendIcon trend={lab.trend as any} />
                  <span className="ml-1 capitalize">{lab.trend}</span>
                </div>
              </Card>

              {contexts[lab.name] && (
                <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 text-[11px] leading-relaxed italic animate-in slide-in-from-top-2 relative group">
                  <button 
                    onClick={() => clearContext(lab.name)}
                    className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-2 w-2 text-muted-foreground" />
                  </button>
                  <div className="flex gap-2">
                    <MessageSquare className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                    <p>"{contexts[lab.name]}"</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
