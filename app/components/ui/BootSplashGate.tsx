import { AppBootSplash } from '@/components/ui/AppBootSplash';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useFlaticonFonts } from '@/hooks/useFlaticonFonts';
import { useState, type ReactNode } from 'react';

type BootSplashGateProps = {
  children: ReactNode;
};

/** Shows animated boot splash until fonts, auth, and onboarding are ready. */
export function BootSplashGate({ children }: BootSplashGateProps) {
  const { loaded: fontsLoaded } = useFlaticonFonts();
  const { isLoading: authLoading } = useAuth();
  const { isLoading: onboardingLoading } = useOnboarding();
  const [showBoot, setShowBoot] = useState(true);

  const appReady = fontsLoaded && !authLoading && !onboardingLoading;

  return (
    <>
      {children}
      {showBoot ? (
        <AppBootSplash ready={appReady} onComplete={() => setShowBoot(false)} />
      ) : null}
    </>
  );
}
