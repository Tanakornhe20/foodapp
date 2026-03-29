import React, { useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';

import { LogIn } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <img 
          src="https://ais-pre-alogrj2orhp5nccbh4ced2-651182989465.asia-east1.run.app/api/attachments/86663249-1418-450f-90e6-5435956972e0" 
          alt="Hua Rung Logo" 
          className="w-48 h-auto mb-6 object-contain"
          referrerPolicy="no-referrer"
        />
        <h1 className="font-headline text-3xl font-extrabold text-primary mb-4 tracking-tight">Management App</h1>
        <p className="text-on-surface-variant mb-8 max-w-xs">Please sign in to manage your business operations.</p>
        <button
          onClick={handleLogin}
          className="bg-primary text-on-primary px-8 py-4 rounded-xl font-bold shadow-lg active:scale-95 transition-transform flex items-center gap-3"
        >
          <LogIn className="w-6 h-6" />
          Sign in with Google
        </button>
      </div>
    );
  }

  return <>{children}</>;
}
