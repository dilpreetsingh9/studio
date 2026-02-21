'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ScanLine, Pill, Search, Stethoscope } from 'lucide-react';
import { cn } from '@/lib/utils';
import ScanDocumentDialog from './scan-document-dialog';
import { useToast } from '@/hooks/use-toast';
import { MedicalRecord } from '@/lib/types';

interface QuickActionsProps {
  onRecordScanned: (record: Omit<MedicalRecord, 'id' | 'capturedAt'>) => void;
  onNavigateToRecords: () => void;
}

export default function QuickActions({ onRecordScanned, onNavigateToRecords }: QuickActionsProps) {
  const [isScanOpen, setIsScanOpen] = useState(false);
  const { toast } = useToast();

  const actions = [
    {
      id: 'scan',
      title: 'Scan Reports',
      icon: ScanLine,
      color: 'bg-blue-100 text-blue-700',
      onClick: () => setIsScanOpen(true),
    },
    {
      id: 'meds',
      title: 'Medications',
      icon: Pill,
      color: 'bg-indigo-100 text-indigo-700',
      onClick: () => {
        document.getElementById('medication-section')?.scrollIntoView({ behavior: 'smooth' });
      },
    },
    {
      id: 'specialist',
      title: 'Search Specialist',
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
      title: 'Second Opinion',
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
          className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 group"
          onClick={action.onClick}
        >
          <CardContent className="p-4 flex flex-col items-center justify-center text-center gap-3">
            <div className={cn("p-3 rounded-2xl transition-transform group-hover:scale-110", action.color)}>
              <action.icon className="h-6 w-6" />
            </div>
            <span className="text-sm font-bold text-foreground">{action.title}</span>
          </CardContent>
        </Card>
      ))}

      <ScanDocumentDialog 
        open={isScanOpen} 
        onOpenChange={setIsScanOpen} 
        onRecordScanned={(record) => {
          onRecordScanned(record);
          toast({
            title: "Record Scanned",
            description: "Your report has been analyzed and saved to Health Records.",
          });
          // Optionally switch to records tab after scan
          onNavigateToRecords();
        }}
      />
    </div>
  );
}
