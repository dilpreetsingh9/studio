'use client';

import { useState, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { patientData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Send, Mic, Image as ImageIcon, X, Loader2, Play, Square } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function SecureMessaging() {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
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
      console.error("Error accessing microphone:", err);
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Please enable microphone permissions to record voice notes.",
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
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = () => {
    if (!message && !audioUrl && !attachedImage) return;

    setIsSending(true);
    // Simulate sending
    setTimeout(() => {
      toast({
        title: "Message Sent",
        description: "Your secure message has been delivered to your care team.",
      });
      setMessage('');
      setAudioUrl(null);
      setAttachedImage(null);
      setIsSending(false);
    }, 1000);
  };

  const removeAttachment = (type: 'audio' | 'image') => {
    if (type === 'audio') setAudioUrl(null);
    if (type === 'image') setAttachedImage(null);
  };

  return (
    <Card className="shadow-md border-primary/10 h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-xl font-bold">Secure Messages</CardTitle>
        <CardDescription>Direct line to your healthcare providers.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col justify-between overflow-hidden">
        <div className="space-y-4 overflow-y-auto pr-2 max-h-[400px]">
          <ul className="space-y-3">
            {patientData.messages.map((msg) => (
              <li key={msg.id} className="flex cursor-pointer items-start gap-3 rounded-xl p-3 hover:bg-secondary/50 transition-colors border border-transparent hover:border-primary/10">
                <Avatar className="h-10 w-10 border shadow-sm">
                  <AvatarImage src={msg.avatarUrl} alt={msg.sender} data-ai-hint="person portrait" />
                  <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="font-bold text-sm">{msg.sender}</p>
                    <span className="text-[10px] text-muted-foreground">{msg.timestamp}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs text-muted-foreground">{msg.lastMessage}</p>
                    {msg.unreadCount > 0 && (
                      <Badge className="h-4 min-w-4 px-1 flex items-center justify-center rounded-full text-[10px]">
                        {msg.unreadCount}
                      </Badge>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-4 space-y-2">
          {/* Previews */}
          {(audioUrl || attachedImage) && (
            <div className="flex flex-wrap gap-2 p-2 bg-muted/30 rounded-lg border border-dashed border-primary/20">
              {attachedImage && (
                <div className="relative group w-16 h-16 rounded-md overflow-hidden border">
                  <img src={attachedImage} alt="Attachment" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeAttachment('image')}
                    className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}
              {audioUrl && (
                <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-xs font-medium border border-primary/20">
                  <Play className="h-3 w-3 fill-current" />
                  Voice Note
                  <button onClick={() => removeAttachment('audio')}>
                    <X className="h-3 w-3 ml-1 hover:text-destructive" />
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-xl border bg-secondary/30 p-2 shadow-inner">
            <div className="flex items-center gap-1">
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef} 
                onChange={handleImageUpload}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                  "h-8 w-8 rounded-full transition-all",
                  isRecording ? "text-destructive bg-destructive/10 animate-pulse" : "text-muted-foreground hover:text-primary"
                )}
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
              >
                {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary rounded-full">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Input 
                placeholder={isRecording ? "Recording voice note..." : "Type your message..."}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 text-sm h-8"
                disabled={isRecording || isSending}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              />
              <Button 
                size="icon" 
                className="h-8 w-8 rounded-full shadow-md bg-primary hover:bg-primary/90 transition-transform active:scale-95 shrink-0"
                onClick={handleSend}
                disabled={isSending || (!message && !audioUrl && !attachedImage)}
              >
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            {isRecording && (
              <p className="text-[10px] text-center text-destructive font-medium animate-pulse">
                Release button to finish recording
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
