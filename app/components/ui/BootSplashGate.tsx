import { useFlaticonFonts } from '@/hooks/useFlaticonFonts';
import { applyAppFonts } from '@/lib/applyAppFonts';
import { useEffect, type ReactNode } from 'react';

type BootSplashGateProps = {
  children: ReactNode;
};

/**
 * Loads app fonts without a branded loading overlay.
 * Auth/onboarding readiness is handled by AuthGuard.
 */
export function BootSplashGate({ children }: BootSplashGateProps) {
  const { loaded: fontsLoaded, error: fontError } = useFlaticonFonts();

  const fontsReady = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (fontsReady) applyAppFonts();
  }, [fontsReady]);

  return <>{children}</>;
}
