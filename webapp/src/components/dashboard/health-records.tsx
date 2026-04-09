
'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScanLine, FileText, ChevronRight, Info, MessageSquare, Sparkles, Upload } from 'lucide-react';
import ScanDocumentDialog from './scan-document-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Report } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { t } from '@/lib/translations';
import { Loader2 } from 'lucide-react';

interface HealthRecordsProps {
  records: Report[];
  isLoading?: boolean;
  language?: string;
}

export default function HealthRecords({ 
  records, 
  isLoading = false,
  language = 'English'
}: HealthRecordsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<Report | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (records.length > 0 && !selectedRecord) {
      setSelectedRecord(records[0]);
    }
  }, [records, selectedRecord]);

  const totalMarkersLearned = useMemo(() => {
    return records.reduce((acc, record) => acc + (record.markers?.length || 0), 0);
  }, [records]);

  const subtitle = records.length === 0 
    ? t('recordsSubtitleEmpty', language)
    : t('recordsSubtitlePopulated', language)
        .replace('{{n}}', records.length.toString())
        .replace('{{m}}', totalMarkersLearned.toString());

  if (isLoading && records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin mb-4 opacity-50" />
        <p className="text-label font-bold uppercase tracking-widest">Opening Clinical Vault...</p>
      </div>
    );
  }

  return (
    <>
      <Card className="flex flex-col h-[700px] shadow-md border-primary/10 bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between mb-1">
            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              {t('healthRecords', language)}
            </CardTitle>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setIsDialogOpen(true)}
              className="rounded-full border-primary/10 bg-primary/5 text-primary font-bold h-8 text-label uppercase tracking-widest"
            >
              <ScanLine className="mr-1.5 h-3.5 w-3.5" />
              {t('startScan', language)}
            </Button>
          </div>
          <CardDescription className="text-muted-foreground font-medium italic font-ui text-small">
            {subtitle}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex-grow flex flex-col gap-4 overflow-hidden">
          {records.length === 0 ? (
            <div className="text-center p-12 flex-grow flex flex-col justify-center items-center border-2 border-dashed rounded-[2rem] bg-secondary/10">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-primary/5 mb-6">
                <ScanLine className="h-12 w-12 text-primary opacity-40" />
              </div>
              <h3 className="text-xl font-black text-primary mb-2 tracking-tight">
                {t('noRecords', language)}
              </h3>
              <p className="max-w-xs mb-8 text-body font-medium leading-relaxed italic text-muted-foreground font-ui">
                {t('noRecordsBody', language)}
              </p>
              <div className="flex flex-col gap-3 w-full max-w-[240px]">
                <Button onClick={() => setIsDialogOpen(true)} className="h-14 rounded-2xl font-black text-sm uppercase tracking-[0.1em] shadow-lg">
                  <ScanLine className="mr-2 h-5 w-5" />
                  {t('startScan', language)}
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 flex-grow overflow-hidden">
              <ScrollArea className="md:col-span-4 border rounded-[2rem] bg-muted/20">
                <div className="p-3 space-y-2">
                  {records.map((record) => (
                    <div
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className={cn(
                        'p-4 rounded-2xl cursor-pointer transition-all border group relative',
                        selectedRecord?.id === record.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                          : 'bg-white hover:border-primary/30 border-transparent shadow-sm'
                      )}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-bold text-sm truncate pr-4">
                          {record.report_type.replace('_', ' ').toUpperCase()} - {mounted && record.scan_date ? new Date(record.scan_date.seconds * 1000).toLocaleDateString() : '...'}
                        </p>
                        <ChevronRight className={cn("h-4 w-4 transition-transform", selectedRecord?.id === record.id ? "rotate-90" : "group-hover:translate-x-1")} />
                      </div>
                      <p className="text-label font-black uppercase tracking-widest opacity-60">
                        {record.lab_name}
                      </p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              
              <div className="md:col-span-8 overflow-hidden h-full">
                {selectedRecord ? (
                  <Card className="h-full flex flex-col border-primary/5 rounded-[2rem] overflow-hidden">
                    <CardHeader className="py-4 border-b border-primary/5 bg-primary/5">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="bg-white/50 text-primary border-primary/10 text-label font-black uppercase tracking-widest px-3">Jeiva Analysis</Badge>
                        <span className="text-label font-bold text-muted-foreground uppercase tracking-widest">{mounted && selectedRecord.scan_date ? new Date(selectedRecord.scan_date.seconds * 1000).toLocaleString() : '...'}</span>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-grow overflow-hidden pt-6">
                      <ScrollArea className="h-full pr-4">
                        <div className="space-y-6 pb-6">
                          <div className="bg-primary/5 p-5 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5"><Sparkles className="h-12 w-12 text-primary" /></div>
                            <div className="flex gap-4 items-start relative z-10">
                              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-primary/5 shrink-0"><MessageSquare className="h-5 w-5 text-primary" /></div>
                              <div className="space-y-1">
                                <p className="text-label text-primary/60 font-black uppercase tracking-widest">Jeiva's Perspective</p>
                                <p className="font-content text-voice leading-relaxed text-primary italic">"{selectedRecord.jeiva_summary}"</p>
                              </div>
                            </div>
                          </div>

                          {selectedRecord.imageUrl && (
                            <div className="relative group overflow-hidden rounded-[2rem] border shadow-sm">
                               <img src={selectedRecord.imageUrl} alt="Source" className="w-full h-auto object-cover max-h-48" />
                               <div className="absolute bottom-3 right-3"><Badge className="bg-black/60 backdrop-blur-md text-label border-none px-3 font-bold uppercase tracking-widest">Original Scan</Badge></div>
                            </div>
                          )}

                          <div className="space-y-4 px-2">
                            <h4 className="text-label font-black text-muted-foreground uppercase tracking-[0.2em]">Markers Extracted</h4>
                            <div className="grid grid-cols-1 gap-2">
                              {selectedRecord.markers?.map((marker, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/10 border border-transparent hover:border-primary/10 transition-colors">
                                  <div className="flex items-center gap-3">
                                    <div className="h-1.5 w-1.5 rounded-full bg-primary/40 shrink-0" />
                                    <span className="font-bold text-sm">{marker.name}</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-metric font-content">{marker.value}</span>
                                    <span className="text-label ml-1 text-muted-foreground font-bold uppercase tracking-widest">{marker.unit}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground rounded-[2rem] border border-dashed bg-muted/5">
                    <FileText className="h-12 w-12 opacity-10 mb-2" />
                    <p className="text-label font-black uppercase tracking-widest">Select a record</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <ScanDocumentDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} language={language} />
    </>
  );
}
