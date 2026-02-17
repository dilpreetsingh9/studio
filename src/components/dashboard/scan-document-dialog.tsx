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
import { Camera, RefreshCcw, Send, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { analyzeMedicalDocument } from '@/ai/flows/analyze-medical-document';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { MedicalRecord } from '@/lib/types';

interface ScanDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRecordScanned: (record: Omit<MedicalRecord, 'id' | 'capturedAt'>) => void;
}

export default function ScanDocumentDialog({
  open,
  onOpenChange,
  onRecordScanned,
}: ScanDocumentDialogProps) {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<
    boolean | null
  >(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

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
          description:
            'Please enable camera permissions in your browser settings.',
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
      setSummary(null);
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
    setSummary(null);
  };

  const handleAnalyze = async () => {
    if (!capturedImage) return;
    setIsLoading(true);
    setSummary(null);
    try {
      const result = await analyzeMedicalDocument({
        documentImage: capturedImage,
      });
      setSummary(result.summary);
    } catch (error) {
      console.error('Error analyzing document:', error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'Could not analyze the document. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = () => {
    if (capturedImage && summary) {
      onRecordScanned({ imageUrl: capturedImage, summary });
      handleClose(false);
    }
  };

  const renderContent = () => {
    if (capturedImage) {
      return (
        <div className="space-y-4">
          <img
            src={capturedImage}
            alt="Captured medical record"
            className="rounded-md w-full"
          />
          {isLoading && (
            <div className="flex items-center justify-center space-x-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyzing record...</span>
            </div>
          )}
          {summary && (
            <Card>
              <CardHeader>
                <CardTitle>AI Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-40">
                  <p className="text-sm">{summary}</p>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </div>
      );
    }

    if (hasCameraPermission === false) {
      return (
        <Alert variant="destructive">
          <AlertTitle>Camera Access Required</AlertTitle>
          <AlertDescription>
            Please allow camera access in your browser to use this feature. You
            may need to refresh the page after granting permission.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full aspect-video rounded-md bg-muted"
          autoPlay
          muted
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
    );
  };

  const renderFooter = () => {
    if (capturedImage) {
      return (
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={handleRetake}>
            <RefreshCcw className="mr-2 h-4 w-4" /> Retake
          </Button>
          {summary ? (
            <Button onClick={handleSave}>
              <Save className="mr-2 h-4 w-4" /> Save Record
            </Button>
          ) : (
            <Button onClick={handleAnalyze} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Send className="mr-2 h-4 w-4" />
              )}
              Analyze Record
            </Button>
          )}
        </DialogFooter>
      );
    }
    return (
      <DialogFooter>
        <Button onClick={handleCapture} disabled={!hasCameraPermission}>
          <Camera className="mr-2 h-4 w-4" /> Capture
        </Button>
      </DialogFooter>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Scan Medical Record</DialogTitle>
          <DialogDescription>
            Position your medical document within the frame and capture an
            image.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
        {renderFooter()}
      </DialogContent>
    </Dialog>
  );
}
