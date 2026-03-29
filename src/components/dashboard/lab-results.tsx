'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  X
} from 'lucide-react';
import { t } from '@/lib/translations';
import { analyzeLabResult, AnalyzeLabResultOutput } from '@/ai/flows/analyze-lab-result';
import { cn } from '@/lib/utils';

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' | 'first reading' }) => {
  const className = "h-4 w-4 text-muted-foreground";
  if (trend === 'up') return <ArrowUp className={className} />;
  if (trend === 'down') return <ArrowDown className={className} />;
  return <ArrowRight className={className} />;
};

interface LabResultsProps {
  language?: string;
}

export default function LabResults({ language = 'English' }: LabResultsProps) {
  const [analyzingMarker, setAnalyzingMarker] = useState<string | null>(null);
  const [contexts, setContexts] = useState<Record<string, string>>({});

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
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Microscope className="h-5 w-5 text-primary" />
          {t('labResults', language)}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {patientData.labResults.map((lab) => (
            <div key={lab.name} className="space-y-2">
              <Card className="flex flex-col justify-between p-4 border-primary/5 bg-accent/5 hover:bg-accent/10 transition-colors cursor-default relative overflow-hidden group">
                <div className="flex items-center justify-between relative z-10">
                  <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{lab.name}</p>
                  <lab.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div className="mt-2 relative z-10 flex items-baseline justify-between">
                  <div>
                    <span className="text-2xl font-black">{lab.value}</span>
                    <span className="ml-1 text-[10px] text-muted-foreground font-medium">{lab.unit}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full hover:bg-primary/10 text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleGetPerspective(lab)}
                    disabled={analyzingMarker === lab.name}
                  >
                    {analyzingMarker === lab.name ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <div className="mt-1 flex items-center text-[10px] text-muted-foreground font-medium relative z-10">
                  <TrendIcon trend={lab.trend as any} />
                  <span className="ml-1 capitalize">{lab.trend}</span>
                </div>
              </Card>

              {contexts[lab.name] && (
                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-[11px] leading-relaxed italic animate-in slide-in-from-top-2 relative group">
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
