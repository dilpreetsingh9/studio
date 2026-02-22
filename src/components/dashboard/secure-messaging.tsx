'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { patientData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Send, Mic, Image as ImageIcon, X, Loader2, Play, Square, Languages } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { translateText } from '@/ai/flows/translate-text';

interface SecureMessagingProps {
  language?: string;
}

export default function SecureMessaging({ language = 'English' }: SecureMessagingProps) {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [translatedMessages, setTranslatedMessages] = useState<Record<string, string>>({});
  const [isTranslating, setIsTranslating] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Please enable microphone permissions.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAttachedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSend = () => {
    if (!message && !audioUrl && !attachedImage) return;
    setIsSending(true);
    setTimeout(() => {
      toast({ title: "Message Sent", description: "Secure message delivered." });
      setMessage('');
      setAudioUrl(null);
      setAttachedImage(null);
      setIsSending(false);
    }, 1000);
  };

  const handleTranslateMessage = async (msgId: string, text: string) => {
    if (language === 'English') return;
    setIsTranslating(msgId);
    try {
      const result = await translateText({ text, targetLanguage: language });
      setTranslatedMessages(prev => ({ ...prev, [msgId]: result.translatedText }));
    } catch (e) {
      toast({ variant: "destructive", title: "Translation failed" });
    } finally {
      setIsTranslating(null);
    }
  };

  return (
    <Card className="shadow-md border-primary/10 h-full flex flex-col overflow-hidden">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg font-bold">Secure Messages</CardTitle>
        <CardDescription className="text-xs">Direct line to your care team ({language}).</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col p-4 pt-0 overflow-hidden">
        <div className="flex-grow overflow-y-auto pr-1 mb-2 scrollbar-hide">
          <ul className="space-y-1.5">
            {patientData.messages.map((msg) => (
              <li key={msg.id} className="group/msg flex cursor-pointer items-start gap-2 rounded-lg p-2 hover:bg-secondary/40 transition-colors border border-transparent hover:border-primary/5">
                <Avatar className="h-8 w-8 border shadow-sm shrink-0">
                  <AvatarImage src={msg.avatarUrl} alt={msg.sender} />
                  <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-xs truncate">{msg.sender}</p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{msg.timestamp}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <p className="text-[10px] text-muted-foreground leading-tight">
                      {translatedMessages[msg.id] || msg.lastMessage}
                    </p>
                    {language !== 'English' && !translatedMessages[msg.id] && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-5 w-fit px-1 text-[9px] text-primary opacity-0 group-hover/msg:opacity-100 transition-opacity"
                        onClick={() => handleTranslateMessage(msg.id, msg.lastMessage)}
                        disabled={isTranslating === msg.id}
                      >
                        {isTranslating === msg.id ? <Loader2 className="h-2 w-2 animate-spin mr-1" /> : <Languages className="h-2 w-2 mr-1" />}
                        Translate to {language}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-1.5">
          {(audioUrl || attachedImage) && (
            <div className="flex flex-wrap gap-1.5 p-1.5 bg-muted/20 rounded-lg border border-dashed border-primary/10">
              {attachedImage && (
                <div className="relative group w-12 h-12 rounded-md overflow-hidden border">
                  <img src={attachedImage} alt="Attachment" className="w-full h-full object-cover" />
                  <button onClick={() => setAttachedImage(null)} className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              )}
              {audioUrl && (
                <div className="flex items-center gap-1.5 bg-primary/5 text-primary px-2 py-1 rounded-full text-[10px] font-medium border border-primary/10">
                  <Play className="h-2.5 w-2.5 fill-current" /> Voice Note
                  <button onClick={() => setAudioUrl(null)}><X className="h-2.5 w-2.5 ml-0.5" /></button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1 rounded-lg border bg-secondary/20 p-1.5 shadow-sm">
            <div className="flex items-center gap-1">
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" size="icon" 
                className={cn("h-7 w-7 rounded-full", isRecording && "text-destructive bg-destructive/5 animate-pulse")}
                onMouseDown={startRecording} onMouseUp={stopRecording}
              >
                {isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </Button>
              <Input 
                placeholder="Message..." 
                value={message} onChange={(e) => setMessage(e.target.value)}
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-xs h-7 px-1"
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button size="icon" className="h-7 w-7 rounded-full" onClick={handleSend} disabled={isSending || (!message && !audioUrl && !attachedImage)}>
                {isSending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
