'use client';

import { useRef, useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Camera, RefreshCcw, Loader2, Save, FileCheck, BrainCircuit, ScanLine, MessageSquare, Check, Sparkles, Lightbulb } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeMedicalDocument } from '@/ai/flows/analyze-medical-document';
import { confirmLabUpload } from '@/ai/flows/confirm-lab-upload';
import { interpretMedicalReport } from '@/ai/flows/interpret-medical-report';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { MedicalRecord } from '@/lib/types';
import { Badge } from '../ui/badge';
import { patientData } from '@/lib/data';
import { t } from '@/lib/translations';
import { cn } from '@/lib/utils';

interface ScanDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordScanned: (record: Omit<MedicalRecord, 'id' | 'capturedAt'>) => void;
  language?: string;
}

export default function ScanDocumentDialog({
  open,
  onOpenChange,
  onRecordScanned,
  language = 'English'
}: ScanDocumentDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<{
    summary: string;
    keyFindings?: string[];
    nextSteps?: string[];
    interpretation?: string;
  } | null>(null);
  const [confirmationNote, setConfirmationNote] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function getCameraPermission() {
      if (!open || hasCameraPermission) return;
      try {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        setStream(cameraStream);
        if (videoRef.current) {
          videoRef.current.srcObject = cameraStream;
        }
        setHasCameraPermission(true);
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: t('micPermissionDenied', language), // Reusing similar logic
        });
      }
    }
    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open, hasCameraPermission, stream, toast, language]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setCapturedImage(null);
      setAnalysis(null);
      setConfirmationNote(null);
      setIsLoading(false);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      setHasCameraPermission(null);
    }
    onOpenChange(isOpen);
  };

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/jpeg');
        setCapturedImage(dataUrl);
        // Automatically start analysis for seamless flow
        triggerAnalysis(dataUrl);
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysis(null);
    setConfirmationNote(null);
  };

  const triggerAnalysis = async (image: string) => {
    setIsLoading(true);
    setAnalysis(null);
    setConfirmationNote(null);
    try {
      // 1. Structural Extraction via OCR
      const result = await analyzeMedicalDocument({
        documentImage: image,
        targetLanguage: language
      });

      // 2. Jeiva's Deeper Interpretation (Flow R-1)
      const markersFound = result.keyFindings?.map(f => ({
        name: f.split(':')[0] || 'Unknown Marker',
        value: f.split(':')[1]?.trim().split(' ')[0] || 'Present',
        unit: f.split(':')[1]?.trim().split(' ')[1] || ''
      })) || [];

      const interpretationResult = await interpretMedicalReport({
        reportType: 'General Scan',
        markers: markersFound,
        sex: patientData.details.gender,
        phase: patientData.cycleData.predictedPhase,
        healthFocus: patientData.medicalHistory,
        targetLanguage: language
      });

      setAnalysis({
        ...result,
        interpretation: interpretationResult.interpretation
      });

      // 3. Immediate Confirmation Note
      const confirmation = await confirmLabUpload({
        markersReadCount: markersFound.length,
        markersUnclearCount: markersFound.length === 0 ? 1 : 0,
        targetLanguage: language
      });
      setConfirmationNote(confirmation.confirmation);

    } catch (error: any) {
      console.error('Error analyzing document:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: t('couldNotReadError', language),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (capturedImage && analysis) {
      onRecordScanned({ 
        imageUrl: capturedImage, 
        summary: analysis.summary,
        interpretation: analysis.interpretation,
        keyFindings: analysis.keyFindings,
        nextSteps: analysis.nextSteps
      });
      handleClose(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className={cn(
        "max-w-2xl overflow-hidden rounded-[2.5rem] border-none shadow-2xl p-0",
        isLoading && "bg-[#F8F7FB]"
      )}>
        <div className="p-8 space-y-6">
          <DialogHeader className="text-left space-y-2">
            <div className="flex items-center gap-3">
               <div className="bg-primary/5 p-2.5 rounded-2xl">
                  <ScanLine className="h-6 w-6 text-primary" />
               </div>
               <div>
                  <DialogTitle className="text-2xl font-black tracking-tight">
                    {isLoading ? t('processingTitle', language) : (capturedImage ? "Review Record" : t('startScan', language))}
                  </DialogTitle>
                  <DialogDescription className="text-sm font-medium text-muted-foreground italic">
                    {isLoading ? t('processingSubtitle', language) : (capturedImage ? "Check if Jeiva heard you right" : t('scanningSubtitle', language))}
                  </DialogDescription>
               </div>
            </div>
          </DialogHeader>

          {isLoading ? (
            /* PROCESSING STATE */
            <div className="flex flex-col items-center justify-center py-12 space-y-10 animate-in fade-in zoom-in-95 duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/10 rounded-full blur-2xl animate-pulse" />
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-primary/5 relative z-10">
                  <BrainCircuit className="h-16 w-16 text-primary animate-pulse" />
                </div>
              </div>
              <div className="text-center space-y-4 max-w-sm mx-auto">
                <div className="space-y-1">
                  <p className="text-lg font-black text-primary uppercase tracking-widest">{t('processingLabel', language)}</p>
                  <p className="text-xs font-bold text-muted-foreground italic">{t('processingSublabel', language)}</p>
                </div>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground px-4">
                  {t('processingBody', language)}
                </p>
              </div>
            </div>
          ) : capturedImage ? (
            /* REVIEW STATE */
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="relative rounded-[2rem] overflow-hidden border-2 border-primary/10 shadow-sm aspect-video bg-muted">
                <img src={capturedImage} alt="Captured record" className="w-full h-full object-cover" />
              </div>

              {confirmationNote && (
                <div className="bg-primary/5 p-5 rounded-[2rem] border border-primary/10 flex gap-4 items-start relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                    <Sparkles className="h-12 w-12 text-primary" />
                  </div>
                  <MessageSquare className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm font-bold italic leading-relaxed text-primary">
                    "{confirmationNote}"
                  </p>
                </div>
              )}

              {analysis && (
                <Card className="border-primary/10 bg-white rounded-[2rem] shadow-sm overflow-hidden">
                  <CardHeader className="py-4 border-b border-primary/5 bg-primary/5">
                    <CardTitle className="text-xs font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <FileCheck className="h-4 w-4 text-primary" />
                      Simplified Perspective
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ScrollArea className="h-48 pr-4">
                      <div className="space-y-6">
                        {analysis.interpretation && (
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Jeiva's Insight</p>
                            <p className="text-base font-bold italic text-foreground leading-tight">"{analysis.interpretation}"</p>
                          </div>
                        )}
                        <div className="space-y-1">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Summary</p>
                            <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">{analysis.summary}</p>
                        </div>
                        {analysis.keyFindings && analysis.keyFindings.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Markers Found</p>
                            <div className="grid grid-cols-1 gap-1.5">
                              {analysis.keyFindings.map((f, i) => (
                                <div key={i} className="flex gap-2 items-center text-xs font-bold bg-muted/30 p-2 rounded-lg">
                                  <Check className="h-3 w-3 text-primary" /> {f}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            /* CAMERA STATE */
            <div className="space-y-6">
              <div className="relative group overflow-hidden rounded-[2.5rem] border-4 border-muted shadow-inner bg-black">
                <video ref={videoRef} className="w-full aspect-video" autoPlay muted playsInline />
                <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/40 animate-scan pointer-events-none" />
                <canvas ref={canvasRef} className="hidden" />
              </div>

              <div className="bg-secondary/20 p-6 rounded-[2rem] border border-primary/5 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">{t('scanningTipLabel', language)}</p>
                </div>
                <div className="grid gap-2">
                  {[t('scanningTip1', language), t('scanningTip2', language), t('scanningTip3', language)].map((tip, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary/30" />
                      <p className="text-xs font-bold text-muted-foreground italic">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 pt-0 gap-3 sm:justify-between">
          {!isLoading && capturedImage ? (
            <div className="flex gap-3 w-full">
              <Button variant="outline" onClick={handleRetake} className="flex-1 h-14 rounded-2xl border-primary/10 font-bold uppercase tracking-widest text-xs">
                <RefreshCcw className="mr-2 h-4 w-4" /> Retake
              </Button>
              {analysis ? (
                <Button onClick={handleSave} className="flex-[2] h-14 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg">
                  <Save className="mr-2 h-5 w-5" /> Save Record
                </Button>
              ) : null}
            </div>
          ) : !isLoading ? (
            <Button onClick={handleCapture} disabled={!hasCameraPermission} className="w-full h-16 rounded-[2rem] font-black text-lg uppercase tracking-widest shadow-xl">
              <Camera className="mr-3 h-6 w-6" /> {t('startScan', language)}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
