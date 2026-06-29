import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform, BackHandler } from 'react-native';

export type ScreenType =
  | 'Welcome'
  | 'EmailLogin'
  | 'ForgotPassword'
  | 'Onboarding'
  | 'Home'
  | 'Progress'
  | 'Stats'
  | 'Community'
  | 'Profile'
  | 'SOS'
  | 'Support';

interface NavigationContextType {
  currentScreen: ScreenType;
  params: any;
  navigate: (screen: ScreenType, params?: any) => void;
  goBack: () => void;
  reset: (screen: ScreenType) => void;
}

const NavigationContext = createContext<NavigationContextType | undefined>(undefined);

export const useNavigation = () => {
  const ctx = useContext(NavigationContext);
  if (!ctx) throw new Error('useNavigation must be inside NavigationProvider');
  return ctx;
};

// TESTING: Set to test password reset flow
const TEST_MODE = true;
const TEST_SCREEN: ScreenType = 'ForgotPassword';

export const NavigationProvider = ({
  children,
  initialScreen = TEST_MODE ? TEST_SCREEN : 'Welcome',
}: {
  children: React.ReactNode;
  initialScreen?: ScreenType;
}) => {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>(initialScreen);
  const [params, setParams] = useState<any>(null);
  const [history, setHistory] = useState<ScreenType[]>([initialScreen]);

  const navigate = (screen: ScreenType, screenParams?: any) => {
    setParams(screenParams ?? null);
    setCurrentScreen(screen);
    setHistory(prev => [...prev, screen]);
  };

  const goBack = useCallback(() => {
    if (history.length > 1) {
      const newHistory = [...history];
      newHistory.pop();
      setHistory(newHistory);
      setCurrentScreen(newHistory[newHistory.length - 1]);
      setParams(null);
    }
  }, [history]);

  const reset = (screen: ScreenType) => {
    setCurrentScreen(screen);
    setHistory([screen]);
    setParams(null);
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const onBack = () => {
        if (history.length > 1) { goBack(); return true; }
        return false;
      };
      BackHandler.addEventListener('hardwareBackPress', onBack);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBack);
    }
  }, [history, goBack]);

  return (
    <NavigationContext.Provider value={{ currentScreen, params, navigate, goBack, reset }}>
      {children}
    </NavigationContext.Provider>
  );
};
