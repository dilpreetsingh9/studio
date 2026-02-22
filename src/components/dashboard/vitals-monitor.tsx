'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { patientData } from '@/lib/data';
import { ArrowDown, ArrowRight, ArrowUp, Activity, Smartphone, RefreshCw, CheckCircle2, Scale } from 'lucide-react';
import { t } from '@/lib/translations';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const TrendIcon = ({ trend }: { trend: 'up' | 'down' | 'stable' }) => {
  const className = "h-4 w-4 text-muted-foreground";
  if (trend === 'up') return <ArrowUp className={className} />;
  if (trend === 'down') return <ArrowDown className={className} />;
  return <ArrowRight className={className} />;
};

interface VitalsMonitorProps {
  language?: string;
}

export default function VitalsMonitor({ language = 'English' }: VitalsMonitorProps) {
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua)) setPlatform('ios');
    else if (/android/.test(ua)) setPlatform('android');
  }, []);

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
    <Card className="shadow-sm border-primary/10">
      <CardHeader className="pb-4 flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          {t('vitalsMonitor', language)}
        </CardTitle>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "h-8 gap-2 rounded-full border-primary/20 transition-all",
            isSyncing && "bg-primary/5 border-primary animate-pulse"
          )}
          onClick={handleSync}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
          ) : lastSynced ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <Smartphone className="h-3.5 w-3.5" />
          )}
          <span className="text-xs font-semibold">
            {isSyncing ? t('connecting', language) : `${t('syncHealth', language)} (${getPlatformName()})`}
          </span>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {patientData.vitals.map((vital) => (
            <Card key={vital.name} className="flex flex-col justify-between p-4 border-primary/5 bg-primary/5 hover:bg-primary/10 transition-colors cursor-default relative overflow-hidden group">
              {isSyncing && (
                <div className="absolute inset-0 bg-primary/5 animate-pulse pointer-events-none" />
              )}
              <div className="flex items-center justify-between relative z-10">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{vital.name}</p>
                <vital.icon className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2 relative z-10">
                <span className="text-2xl font-black">{vital.value}</span>
                <span className="ml-1 text-[10px] text-muted-foreground font-medium">{vital.unit}</span>
              </div>
              <div className="mt-1 flex items-center text-[10px] text-muted-foreground font-medium relative z-10">
                <TrendIcon trend={vital.trend} />
                <span className="ml-1 capitalize">{vital.trend}</span>
              </div>
            </Card>
          ))}
          {bmi && (
            <Card className="flex flex-col justify-between p-4 border-primary/5 bg-primary/5 hover:bg-primary/10 transition-colors cursor-default relative overflow-hidden group">
              <div className="flex items-center justify-between relative z-10">
                <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">{t('bmi', language)}</p>
                <Scale className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
              </div>
              <div className="mt-2 relative z-10">
                <span className="text-2xl font-black">{bmi}</span>
                <span className="ml-1 text-[10px] text-muted-foreground font-medium">kg/m²</span>
              </div>
              <div className="mt-1 flex items-center text-[10px] text-muted-foreground font-medium relative z-10">
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
                <span className="ml-1 capitalize">Optimal</span>
              </div>
            </Card>
          )}
        </div>
        {lastSynced && (
          <p className="text-[10px] text-muted-foreground mt-3 text-right italic">
            Last synced with {getPlatformName()} at {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
