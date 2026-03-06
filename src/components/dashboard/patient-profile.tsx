'use client';

import { useState, useEffect, useMemo } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { patientData } from '@/lib/data';
import { t } from '@/lib/translations';
import { translateText } from '@/ai/flows/translate-text';
import { 
  Loader2, 
  Activity, 
  HeartPulse, 
  Smartphone, 
  RefreshCw, 
  CheckCircle2, 
  Scale, 
  ArrowUp, 
  ArrowDown, 
  ArrowRight,
  ClipboardList
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  const className = "h-4 w-4 text-muted-foreground";
  if (trend === 'up') return <ArrowUp className={className} />;
  if (trend === 'down') return <ArrowDown className={className} />;
  return <ArrowRight className={className} />;
};

interface PatientProfileProps {
  language?: string;
}

export default function PatientProfile({ language = 'English' }: PatientProfileProps) {
  const [translatedHistory, setTranslatedHistory] = useState<string | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  const { toast } = useToast();

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
  }, []);

  useEffect(() => {
    async function translateHistory() {
      if (language === 'English') {
        setTranslatedHistory(null);
        return;
      }
      setIsTranslating(true);
      try {
        const result = await translateText({ 
          text: patientData.medicalHistory, 
          targetLanguage: language 
        });
        setTranslatedHistory(result.translatedText);
      } catch (error: any) {
        console.error('Translation failed', error);
        const isQuotaError = error.message?.includes('429') || error.message?.toLowerCase().includes('quota');
        if (isQuotaError) {
          toast({
            variant: 'destructive',
            title: 'Translation Quota Reached',
            description: 'Could not translate history due to AI rate limits. Please try again later.',
          });
        }
      } finally {
        setIsTranslating(false);
      }
    }
    translateHistory();
  }, [language, toast]);

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setLastSynced(new Date());
      toast({
        title: t('synced', language),
        description: t('syncSuccess', language),
      });
    }, 2500);
  };

  const bmi = useMemo(() => {
    if (patientData.details.height && patientData.details.weight) {
      const heightInMeters = patientData.details.height / 100;
      return (patientData.details.weight / (heightInMeters * heightInMeters)).toFixed(1);
    }
    return null;
  }, []);

  const getPlatformName = () => {
    if (platform === 'ios') return t('appleHealth', language);
    if (platform === 'android') return t('healthConnect', language);
    return 'Health Data';
  };

  return (
    <Card className="shadow-md border-primary/10 overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-2 border-primary/20 shrink-0">
              <AvatarImage src={patientData.avatarUrl} alt={patientData.name} data-ai-hint="woman portrait" />
              <AvatarFallback>{patientData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-3xl font-bold">{patientData.name}</CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                {patientData.details.age} {t('age', language)} · {patientData.details.gender} · {t('bloodType', language)}: {patientData.details.bloodType}
              </CardDescription>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">{t('allergies', language)}:</span>
                {patientData.details.allergies.map(allergy => (
                  <Badge key={allergy} variant="secondary" className="bg-destructive/10 text-destructive hover:bg-destructive/20 border-transparent text-[10px]">
                    {allergy}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className={cn(
              "h-9 gap-2 rounded-xl border-primary/20 transition-all shrink-0",
              isSyncing && "bg-primary/5 border-primary animate-pulse"
            )}
            onClick={handleSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : lastSynced ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
              <Smartphone className="h-4 w-4" />
            )}
            <span className="text-xs font-bold">
              {isSyncing ? t('connecting', language) : t('syncHealth', language)}
            </span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-secondary/20 p-5 rounded-2xl border border-secondary/50">
          <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-primary">
            <ClipboardList className="h-4 w-4" />
            {t('medicalHistory', language)}
            {isTranslating && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
          </h4>
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            "{translatedHistory || patientData.medicalHistory}"
          </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              {t('vitalsMonitor', language)}
            </h4>
            {lastSynced && (
              <span className="text-[10px] text-muted-foreground italic">
                Synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {patientData.vitals.map((vital) => (
              <div key={vital.name} className="flex flex-col justify-between p-3 rounded-xl border bg-primary/5 hover:bg-primary/10 transition-all group relative overflow-hidden">
                {isSyncing && <div className="absolute inset-0 bg-primary/5 animate-pulse" />}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{vital.name}</span>
                  <vital.icon className="h-3.5 w-3.5 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-black">{vital.value}</span>
                    <span className="text-[9px] text-muted-foreground font-bold">{vital.unit}</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <TrendIcon trend={vital.trend} />
                    <span className="text-[9px] ml-1 text-muted-foreground capitalize">{vital.trend}</span>
                  </div>
                </div>
              </div>
            ))}
            {bmi && (
              <div className="flex flex-col justify-between p-3 rounded-xl border bg-accent/5 hover:bg-accent/10 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{t('bmi', language)}</span>
                  <Scale className="h-3.5 w-3.5 text-accent" />
                </div>
                <div>
                  <div className="flex items-baseline gap-0.5">
                    <span className="text-xl font-black">{bmi}</span>
                    <span className="text-[9px] text-muted-foreground font-bold">kg/m²</span>
                  </div>
                  <div className="flex items-center mt-1">
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[9px] ml-1 text-muted-foreground">Optimal</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
