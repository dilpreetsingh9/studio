'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScanLine, Pill, Search, Stethoscope, Smartphone, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import ScanDocumentDialog from './scan-document-dialog';
import { useToast } from '@/hooks/use-toast';
import { MedicalRecord } from '@/lib/types';
import { t } from '@/lib/translations';

interface QuickActionsProps {
  onRecordScanned: (record: Omit<MedicalRecord, 'id' | 'capturedAt'>) => void;
  onNavigateToRecords: () => void;
  language?: string;
}

export default function QuickActions({ 
  onRecordScanned, 
  onNavigateToRecords,
  language = 'English'
}: QuickActionsProps) {
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'web'>('web');
  const [isSyncing, setIsSyncing] = useState(false);
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
      toast({
        title: t('synced', language),
        description: t('syncSuccess', language),
      });
    }, 2000);
  };

  const actions = [
    {
      id: 'scan',
      title: t('scanReports', language),
      icon: ScanLine,
      color: 'bg-blue-100 text-blue-700',
      onClick: () => setIsScanOpen(true),
    },
    {
      id: 'sync',
      title: t('syncHealth', language),
      icon: isSyncing ? RefreshCw : Smartphone,
      color: 'bg-green-100 text-green-700',
      onClick: handleSync,
      isLoading: isSyncing,
    },
    {
      id: 'specialist',
      title: t('searchSpecialist', language),
      icon: Search,
      color: 'bg-slate-100 text-slate-700',
      onClick: () => {
        toast({
          title: "Feature coming soon",
          description: "Finding top-rated specialists near you will be available in the next update.",
        });
      },
    },
    {
      id: 'opinion',
      title: t('secondOpinion', language),
      icon: Stethoscope,
      color: 'bg-cyan-100 text-cyan-700',
      onClick: () => {
        toast({
          title: "Consultation Service",
          description: "Connect with world-class experts for a second opinion on your records.",
        });
      },
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Card 
          key={action.id} 
          className={cn(
            "cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group border-primary/5",
            action.isLoading && "opacity-70 pointer-events-none"
          )}
          onClick={action.onClick}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3">
            <div className={cn(
              "p-4 rounded-2xl transition-transform group-hover:scale-110", 
              action.color,
              action.isLoading && "animate-spin"
            )}>
              <action.icon className="h-6 w-6" />
            </div>
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">{action.title}</span>
          </CardContent>
        </Card>
      ))}

      <ScanDocumentDialog 
        open={isScanOpen} 
        onOpenChange={setIsScanOpen} 
        language={language}
        onRecordScanned={(record) => {
          onRecordScanned(record);
          toast({
            title: "Record Scanned",
            description: "Your report has been analyzed and saved to Health Records.",
          });
          onNavigateToRecords();
        }}
      />
    </div>
  );
}
