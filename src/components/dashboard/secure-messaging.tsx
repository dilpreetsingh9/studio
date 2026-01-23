import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { patientData } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { Paperclip, Send } from 'lucide-react';

export default function SecureMessaging() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Secure Messages</CardTitle>
        <CardDescription>Communicate with your care team and family.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <ul className="space-y-3">
            {patientData.messages.map((msg) => (
              <li key={msg.id} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 hover:bg-secondary">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={msg.avatarUrl} alt={msg.sender} data-ai-hint="person portrait" />
                  <AvatarFallback>{msg.sender.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{msg.sender}</p>
                    {msg.unreadCount > 0 && <Badge className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full p-0">{msg.unreadCount}</Badge>}
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{msg.lastMessage}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 flex items-center gap-2 rounded-lg border bg-secondary p-1">
            <Button variant="ghost" size="icon"><Paperclip className="h-5 w-5" /></Button>
            <Input placeholder="Type your message..." className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0" />
            <Button size="icon"><Send className="h-5 w-5"/></Button>
        </div>
      </CardContent>
    </Card>
  );
}
