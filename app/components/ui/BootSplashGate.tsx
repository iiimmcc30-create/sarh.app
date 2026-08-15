import { AppBootSplash } from '@/components/ui/AppBootSplash';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useFlaticonFonts } from '@/hooks/useFlaticonFonts';
import { applyAppFonts } from '@/lib/applyAppFonts';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

type BootSplashGateProps = {
  children: ReactNode;
};

const IS_WEB = Platform.OS === 'web';
const BOOT_FAILSAFE_MS = IS_WEB ? 3500 : 8000;

/** Shows animated boot splash until auth and onboarding are ready. */
export function BootSplashGate({ children }: BootSplashGateProps) {
  const { loaded: fontsLoaded, error: fontError } = useFlaticonFonts();
  const { isLoading: authLoading } = useAuth();
  const { isLoading: onboardingLoading } = useOnboarding();
  const [showBoot, setShowBoot] = useState(true);

  const fontsReady = fontsLoaded || Boolean(fontError);
  const appReady = fontsReady && !authLoading && !onboardingLoading;

  useEffect(() => {
    if (fontsReady) applyAppFonts();
  }, [fontsReady]);

  useEffect(() => {
    const t = setTimeout(() => setShowBoot(false), BOOT_FAILSAFE_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (appReady && IS_WEB) {
      const t = setTimeout(() => setShowBoot(false), 1200);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [appReady]);

  return (
    <>
      {children}
      {showBoot ? (
        <AppBootSplash ready={appReady} onComplete={() => setShowBoot(false)} />
      ) : null}
    </>
  );
}
