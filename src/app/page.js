'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          router.replace('/posts');
        } else {
          router.replace('/login');
        }
      } catch (err) {
        router.replace('/login');
      }
    }
    checkAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
      <span className="animate-spin inline-block w-8 h-8 border-4 border-violet-500/30 border-t-violet-500 rounded-full"></span>
      <p className="text-zinc-400 text-sm font-medium animate-pulse">Initializing DevShare...</p>
    </div>
  );
}
