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
import { Camera, RefreshCcw, Loader2, Save, FileCheck, BrainCircuit, ScanLine } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { analyzeMedicalDocument } from '@/ai/flows/analyze-medical-document';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { MedicalRecord } from '@/lib/types';
import { Badge } from '../ui/badge';

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
  } | null>(null);
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
          description: 'Please enable camera permissions in your browser settings.',
        });
      }
    }
    getCameraPermission();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [open, hasCameraPermission, stream, toast]);

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      setCapturedImage(null);
      setAnalysis(null);
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
      }
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setAnalysis(null);
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setIsLoading(true);
    setAnalysis(null);
    try {
      const result = await analyzeMedicalDocument({
        documentImage: capturedImage,
        targetLanguage: language
      });
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not simplify the document. Please try again.',
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
        keyFindings: analysis.keyFindings,
        nextSteps: analysis.nextSteps
      });
      handleClose(false);
    }
  };

  const renderContent = () => {
    if (capturedImage) {
      return (
        <div className="space-y-4">
          <div className="relative rounded-lg overflow-hidden border-2 border-primary/20">
            <img src={capturedImage} alt="Captured record" className="w-full h-auto" />
            {isLoading && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center">
                <BrainCircuit className="h-12 w-12 text-primary animate-pulse mb-4" />
                <h3 className="font-bold text-lg">AI Analysis ({language})...</h3>
                <p className="text-sm text-muted-foreground">Parsing terms into patient-friendly language.</p>
              </div>
            )}
          </div>
          {analysis && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="py-3">
                <CardTitle className="text-md flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" />
                  Simplified Translation ({language})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-48 pr-4">
                  <div className="space-y-4">
                    <div>
                        <p className="text-sm italic font-medium">Summary:</p>
                        <p className="text-sm text-muted-foreground">{analysis.summary}</p>
                    </div>
                    {analysis.keyFindings && analysis.keyFindings.length > 0 && (
                      <div>
                        <p className="text-sm font-semibold mb-1">Key Points:</p>
                        <ul className="text-xs space-y-1">
                          {analysis.keyFindings.map((f, i) => (
                            <li key={i} className="flex gap-2">
                              <span className="text-primary">•</span> {f}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    return (
      <div className="relative group overflow-hidden rounded-xl border-4 border-muted">
        <video ref={videoRef} className="w-full aspect-video bg-black" autoPlay muted playsInline />
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary/40 animate-scan pointer-events-none" />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl overflow-hidden">
        <DialogHeader>
          <div className="flex items-center gap-2">
             <div className="bg-primary/10 p-2 rounded-lg">
                <ScanLine className="h-5 w-5 text-primary" />
             </div>
             <DialogTitle>OCR Medical Scanner</DialogTitle>
          </div>
          <DialogDescription>
            Scan documents to get simplified summaries in {language}.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
        <DialogFooter className="gap-2 sm:justify-between">
          {capturedImage ? (
            <>
              <Button variant="outline" onClick={handleRetake} disabled={isLoading}>
                <RefreshCcw className="mr-2 h-4 w-4" /> Retake
              </Button>
              {analysis ? (
                <Button onClick={handleSave} className="bg-primary">
                  <Save className="mr-2 h-4 w-4" /> Save Simplified Record
                </Button>
              ) : (
                <Button onClick={handleAnalyze} disabled={isLoading} className="bg-primary">
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                  Simplify & Parse
                </Button>
              )}
            </>
          ) : (
            <Button onClick={handleCapture} disabled={!hasCameraPermission} size="lg" className="w-full sm:w-auto px-12">
              <Camera className="mr-2 h-5 w-5" /> Scan Document
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
