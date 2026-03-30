
'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription 
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  Mic, 
  Square, 
  Loader2, 
  Check, 
  RotateCcw, 
  Smile, 
  Zap, 
  AlertCircle, 
  Ghost, 
  Target,
  Sparkles
} from 'lucide-react';
import { useCheckInPrompt } from '@/hooks/use-checkin-prompt';
import { t } from '@/lib/translations';
import { cn } from '@/lib/utils';
import { transcribeHealthDictation } from '@/ai/flows/transcribe-health-dictation';
import { tagJournalEntry } from '@/ai/flows/tag-journal-entry';
import { generateVoiceObservation } from '@/ai/flows/generate-voice-observation';
import { confirmLogEntry } from '@/ai/flows/confirm-log-entry';
import { useFirestore, useUser } from '@/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Badge } from '@/components/ui/badge';
import { patientData } from '@/lib/data';

type FlowState = 'idle' | 'recording' | 'reviewing' | 'confirming' | 'success';

interface CheckInDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: any;
  language: string;
}

export function CheckInDialog({ open, onOpenChange, profile, language }: CheckInDialogProps) {
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [reviewData, setReviewData] = useState<any>(null);
  const [closingLine, setClosingLine] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const dynamicPrompt = useCheckInPrompt();
  const db = useFirestore();
  const { user } = useUser();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const isMale = profile?.gender === 'Male';

  const checkInTiles = [
    { type: 'Mood', icon: Smile, color: 'text-yellow-600 bg-yellow-100' },
    { type: 'Energy', icon: Zap, color: 'text-emerald-600 bg-emerald-100' },
    { 
      type: isMale ? 'Focus' : 'Pain', 
      icon: isMale ? Target : AlertCircle, 
      color: isMale ? 'text-blue-600 bg-blue-100' : 'text-red-600 bg-red-100' 
    },
    { type: 'Stress', icon: Ghost, color: 'text-purple-600 bg-purple-100' },
  ];

  useEffect(() => {
    if (!open) {
      setFlowState('idle');
      setReviewData(null);
      setRecordingDuration(0);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [open]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          await processVoiceEntry(base64Audio);
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setFlowState('recording');
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => {
          if (prev >= 60) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && flowState === 'recording') {
      mediaRecorderRef.current.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const processVoiceEntry = async (audioDataUri: string) => {
    setIsProcessing(true);
    try {
      const transcriptionResult = await transcribeHealthDictation({ audioDataUri, targetLanguage: language });
      const tagsResult = await tagJournalEntry({ entryText: transcriptionResult.transcription, sex: profile?.gender || 'Female' });
      const observationResult = await generateVoiceObservation({
        transcript: transcriptionResult.transcription,
        tags: tagsResult.tags,
        timeOfDay: getTimeOfDay(),
        phase: patientData.cycleData.predictedPhase,
        energyScore: 3,
        targetLanguage: language
      });

      setReviewData({
        transcript: transcriptionResult.transcription,
        tags: tagsResult.tags.slice(0, 3).map((t: string) => t.toLowerCase().replace(/^#/, '')),
        observation: observationResult.observation,
        summary: tagsResult.summary_title,
        sentiment: tagsResult.sentiment
      });
      setFlowState('reviewing');
    } catch (error) {
      console.error(error);
      setFlowState('idle');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveVoice = async () => {
    if (!user || !reviewData) return;
    setIsProcessing(true);
    
    const timestamp = new Date().toISOString();
    const docRef = doc(db, 'users', user.uid, 'journal', timestamp);
    
    setDoc(docRef, {
      raw_entry: reviewData.transcript,
      ai_summary: reviewData.summary,
      ai_tags: reviewData.tags,
      sentiment: reviewData.sentiment,
      jeiva_observation: reviewData.observation,
      log_type: "voice",
      createdAt: serverTimestamp()
    }, { merge: true });

    const confirmation = await confirmLogEntry({
      logType: 'voice',
      logValue: reviewData.transcript,
      timeOfDay: getTimeOfDay(),
      isFirst: false,
      streak: 5,
      patternFlag: false,
      sex: profile?.gender || 'Female',
      targetLanguage: language
    });

    showSuccess(confirmation.confirmation);
  };

  const handleTileTap = async (tile: string) => {
    if (!user) return;
    setIsProcessing(true);
    
    const date = new Date().toISOString().split('T')[0];
    const docRef = doc(db, 'users', user.uid, 'checkins', date);
    
    setDoc(docRef, {
      [tile.toLowerCase()]: {
        value: 4,
        timestamp: serverTimestamp()
      }
    }, { merge: true });

    const confirmation = await confirmLogEntry({
      logType: tile.toLowerCase() as any,
      logValue: "4",
      timeOfDay: getTimeOfDay(),
      isFirst: false,
      streak: 5,
      patternFlag: false,
      sex: profile?.gender || 'Female',
      targetLanguage: language
    });

    showSuccess(confirmation.confirmation);
  };

  const showSuccess = (line: string) => {
    setClosingLine(line);
    setFlowState('success');
    setIsProcessing(false);
    setTimeout(() => onOpenChange(false), 2000);
  };

  const getTimeOfDay = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[3rem] h-[auto] min-h-[40vh] p-0 overflow-hidden border-none shadow-2xl">
        <div className="p-8">
          {flowState === 'idle' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SheetHeader className="text-left space-y-2">
                <SheetTitle className="font-content text-display leading-tight">{dynamicPrompt}</SheetTitle>
                <SheetDescription className="text-primary/60 font-bold uppercase tracking-widest text-label font-ui">
                  Daily Check-In
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-6">
                <Button 
                  onClick={startRecording}
                  className="w-full h-24 rounded-[2rem] bg-primary/5 hover:bg-primary/10 border-2 border-dashed border-primary/20 flex items-center justify-center gap-4 transition-all"
                >
                  <div className="bg-primary p-3 rounded-2xl text-white">
                    <Mic className="h-6 w-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-black text-primary text-lg font-ui">Tap to speak</p>
                    <p className="text-small text-muted-foreground font-medium font-ui">Capture a thought in seconds</p>
                  </div>
                </Button>

                <div className="grid grid-cols-4 gap-3">
                  {checkInTiles.map((tile) => (
                    <button
                      key={tile.type}
                      onClick={() => handleTileTap(tile.type)}
                      className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-card border border-muted hover:border-primary/20 hover:shadow-sm transition-all"
                    >
                      <div className={cn("p-3 rounded-2xl", tile.color)}>
                        <tile.icon className="h-5 w-5" />
                      </div>
                      <span className="text-label font-black uppercase tracking-tight text-muted-foreground font-ui">{tile.type}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {flowState === 'recording' && (
            <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in zoom-in-95 duration-300">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
                <Button 
                  onClick={stopRecording}
                  variant="destructive"
                  size="icon" 
                  className="h-24 w-24 rounded-full relative z-10 shadow-xl"
                >
                  <Square className="h-8 w-8" />
                </Button>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-display font-content text-primary">{t('recordingMain', language)}</h3>
                <p className="text-voice font-bold text-muted-foreground italic font-content">
                  {recordingDuration >= 60 ? t('recordingLimitReached', language) : t('recordingSubtitle', language)}
                </p>
                <div className="pt-4">
                  <Badge variant="outline" className="px-4 py-1 text-primary font-black border-primary/20 text-label font-ui">
                    {recordingDuration}s · {t('tapToFinish', language)}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {flowState === 'reviewing' && reviewData && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-1">
                <p className="text-label font-black uppercase tracking-widest text-primary/60 font-ui">Here's what Jeiva heard</p>
                <p className="font-content text-voice font-medium leading-relaxed italic text-foreground pr-4">"{reviewData.transcript}"</p>
              </div>

              <div className="flex flex-wrap gap-2">
                {reviewData.tags.map((tag: string) => (
                  <Badge key={tag} className="rounded-full bg-primary/10 text-primary border-none px-3 py-1 lowercase font-bold text-label tracking-tight font-ui">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Sparkles className="h-12 w-12" />
                </div>
                <div className="flex items-start gap-4 relative z-10">
                  <div className="bg-white p-2 rounded-xl shadow-sm border border-primary/5 shrink-0">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <p className="font-content text-voice font-medium leading-relaxed italic text-muted-foreground pr-4">
                    "{reviewData.observation}"
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 h-14 rounded-2xl border-primary/10 font-bold font-ui text-label uppercase tracking-widest" 
                  onClick={() => setFlowState('idle')}
                  disabled={isProcessing}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                <Button 
                  className="flex-[2] h-14 rounded-2xl font-black text-label font-ui uppercase tracking-widest shadow-lg" 
                  onClick={handleSaveVoice}
                  disabled={isProcessing}
                >
                  {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="mr-2 h-5 w-5" />}
                  Save it
                </Button>
              </div>
            </div>
          )}

          {flowState === 'success' && (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="bg-emerald-100 text-emerald-600 p-4 rounded-full mb-6">
                <Check className="h-10 w-10" />
              </div>
              <p className="font-content text-display font-black tracking-tight text-primary leading-tight max-w-xs">
                "{closingLine}"
              </p>
              <div className="mt-8 flex items-center gap-2">
                <div className="h-0.5 w-8 bg-primary/20" />
                <span className="text-label font-black text-primary/60 uppercase tracking-[0.3em] font-ui">Jeiva</span>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
