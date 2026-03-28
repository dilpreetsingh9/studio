
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/icons';
import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { Loader2, Mail, Lock, ArrowRight, ArrowLeft, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type AuthMode = 'choice' | 'email-signin' | 'email-signup';

export function LoginScreen() {
  const auth = useAuth();
  const { toast } = useToast();
  const [mode, setMode] = useState<AuthMode>('choice');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    // Prompting for account selection can help avoid silent failures
    provider.setCustomParameters({ prompt: 'select_account' });

    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error('Google login failed', error);
      let errorMessage = "Could not sign in with Google. Please try again.";
      
      if (error.code === 'auth/unauthorized-domain') {
        errorMessage = "This domain is not authorized for Google Sign-In. Please add this URL to your Firebase Console 'Authorized Domains'.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Sign-in popup was closed before completion.";
      } else if (error.code === 'auth/cancelled-by-user') {
        errorMessage = "Sign-in was cancelled.";
      }

      setAuthError(errorMessage);
      toast({
        variant: "destructive",
        title: "Authentication Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setAuthError(null);
    try {
      if (mode === 'email-signin') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (error: any) {
      console.error('Email auth failed', error);
      const errorMessage = error.message || "An error occurred during sign in.";
      setAuthError(errorMessage);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderChoiceMode = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Button 
        className="w-full h-14 text-lg font-bold rounded-2xl gap-3 bg-white text-black border hover:bg-gray-50 shadow-sm" 
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {!isLoading && (
          <svg className="h-6 w-6" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        )}
        {isLoading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : "Continue with Google"}
      </Button>

      <div className="relative py-4">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-muted-foreground font-semibold">Or use email</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          className="h-12 rounded-xl font-bold border-primary/20 hover:bg-primary/5"
          onClick={() => setMode('email-signin')}
        >
          Sign In
        </Button>
        <Button 
          className="h-12 rounded-xl font-bold"
          onClick={() => setMode('email-signup')}
        >
          Join Now
        </Button>
      </div>
    </div>
  );

  const renderEmailForm = () => (
    <form onSubmit={handleEmailAuth} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="email" 
              type="email" 
              placeholder="name@example.com" 
              className="pl-10 h-12 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••" 
              className="pl-10 h-12 rounded-xl"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
      </div>

      <Button className="w-full h-12 rounded-xl font-bold text-lg" disabled={isLoading}>
        {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : mode === 'email-signin' ? 'Sign In' : 'Create Account'}
        {!isLoading && <ArrowRight className="ml-2 h-5 w-5" />}
      </Button>

      <Button 
        type="button" 
        variant="ghost" 
        className="w-full text-muted-foreground font-medium" 
        onClick={() => setMode('choice')}
        disabled={isLoading}
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to options
      </Button>

      <p className="text-center text-xs text-muted-foreground mt-4">
        {mode === 'email-signin' ? (
          <>New to Healthea? <button type="button" className="text-primary font-bold hover:underline" onClick={() => setMode('email-signup')}>Create an account</button></>
        ) : (
          <>Already have an account? <button type="button" className="text-primary font-bold hover:underline" onClick={() => setMode('email-signin')}>Sign in here</button></>
        )}
      </p>
    </form>
  );

  return (
    <div className="min-h-svh flex items-center justify-center p-6 bg-secondary/10">
      <Card className="w-full max-w-md shadow-2xl border-none overflow-hidden">
        <CardHeader className="text-center space-y-4 pb-8">
          <div className="flex justify-center">
            <div className="bg-primary/5 p-4 rounded-3xl">
              <Logo className="h-12 w-12 text-primary" />
            </div>
          </div>
          <div className="space-y-1">
            <CardTitle className="text-3xl font-black tracking-tight text-primary">Healthea</CardTitle>
            <CardDescription className="text-base font-medium">
              Hormone Intelligence & Health Navigator
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Error</AlertTitle>
              <AlertDescription className="text-xs">
                {authError}
              </AlertDescription>
            </Alert>
          )}

          {mode === 'choice' ? renderChoiceMode() : renderEmailForm()}
          
          <p className="text-center text-[10px] text-muted-foreground px-8 leading-relaxed mt-8 opacity-60">
            By continuing, you agree to our privacy-first medical data policy and terms of service. Your data is encrypted and secure.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
