'use client';

import { useState, useCallback, useRef } from 'react';

export interface UseSubmitLockOptions {
  lockTimeoutMs?: number; // Safety timeout in case promise never resolves
}

export function useSubmitLock(options: UseSubmitLockOptions = {}) {
  const { lockTimeoutMs = 15000 } = options;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const lockTimerRef = useRef<NodeJS.Timeout | null>(null);

  const executeWithLock = useCallback(
    async <T>(action: () => Promise<T>): Promise<T | undefined> => {
      if (isSubmitting) {
        console.warn('[useSubmitLock] Action blocked: previous submission is still in flight.');
        return undefined;
      }

      setIsSubmitting(true);

      // Auto-unlock safeguard in case of unhandled freeze
      lockTimerRef.current = setTimeout(() => {
        setIsSubmitting(false);
      }, lockTimeoutMs);

      try {
        const result = await action();
        return result;
      } finally {
        if (lockTimerRef.current) {
          clearTimeout(lockTimerRef.current);
          lockTimerRef.current = null;
        }
        setIsSubmitting(false);
      }
    },
    [isSubmitting, lockTimeoutMs]
  );

  return {
    isSubmitting,
    executeWithLock,
  };
}
