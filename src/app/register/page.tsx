'use client';

import React, { Suspense } from 'react';
import { AuthForm } from '@/components/auth/AuthForm';
import { Loader2 } from 'lucide-react';

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#07080B] font-mono text-xs">
          <Loader2 className="h-6 w-6 animate-spin text-sky-500" />
        </div>
      }
    >
      <AuthForm defaultTab="register" />
    </Suspense>
  );
}
