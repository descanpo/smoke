import React, { useState, useEffect } from 'react';
import { View, StyleSheet, StatusBar, Modal, Platform } from 'react-native';
import { supabase } from './src/services/supabase';
import { NavigationProvider, useNavigation, ScreenType } from './src/navigation/Navigator';
import { BottomNavBar } from './src/components/BottomNavBar';
import CravingModal from './src/components/CravingModal';
import BreathingModal from './src/components/BreathingModal';
import WelcomeScreen from './src/screens/WelcomeScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import StatsScreen from './src/screens/StatsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import { ThemeProvider, useThemeMode } from './src/context/ThemeContext';
import { LanguageProvider } from './src/context/LanguageContext';

const TAB_SCREENS: ScreenType[] = ['Home', 'Progress', 'Stats', 'Profile'];

const AppContent = () => {
  const { currentScreen, navigate, reset } = useNavigation();
  const { isDark } = useThemeMode();
  const [session, setSession] = useState<any>(null);
  const [journey, setJourney] = useState<any>(null);
  const [showCraving, setShowCraving] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        fetchJourney(s.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s) {
        fetchJourney(s.user.id);
      } else {
        setJourney(null);
        setLoading(false);
        reset('Welcome');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchJourney = async (userId: string) => {
    const { data } = await supabase.from('quit_journeys')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();
    setJourney(data ?? null);
    setLoading(false);
    if (!data) {
      navigate('Onboarding');
    } else if (currentScreen === 'Welcome' || currentScreen === 'Onboarding') {
      navigate('Home');
    }
  };

  const renderScreen = () => {
    if (!session) return <WelcomeScreen />;

    switch (currentScreen) {
      case 'Onboarding':
        return (
          <OnboardingScreen
            session={session}
            onComplete={() => fetchJourney(session.user.id)}
          />
        );
      case 'Home':
        return (
          <HomeScreen
            session={session}
            journey={journey}
            onLogCraving={() => setShowCraving(true)}
            onBreathing={() => setShowBreathing(true)}
          />
        );
      case 'Progress':
        return <ProgressScreen session={session} journey={journey} />;
      case 'Stats':
        return <StatsScreen session={session} journey={journey} />;
      case 'Profile':
        return (
          <ProfileScreen
            session={session}
            journey={journey}
            onJourneyReset={() => {
              setJourney(null);
              navigate('Onboarding');
            }}
          />
        );
      default:
        return (
          <HomeScreen
            session={session}
            journey={journey}
            onLogCraving={() => setShowCraving(true)}
            onBreathing={() => setShowBreathing(true)}
          />
        );
    }
  };

  const showTabBar = !!session && TAB_SCREENS.includes(currentScreen);
  const bgColor = isDark ? '#0A0A1A' : '#F2F0FB';

  return (
    <View style={[s.root, { backgroundColor: bgColor }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      <View style={s.screen}>
        {renderScreen()}
      </View>
      {showTabBar && (
        <BottomNavBar onLogCraving={() => setShowCraving(true)} />
      )}
      <Modal
        visible={showCraving}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowCraving(false)}
      >
        <CravingModal
          session={session}
          journey={journey}
          onClose={() => setShowCraving(false)}
        />
      </Modal>
      <Modal
        visible={showBreathing}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowBreathing(false)}
      >
        <BreathingModal
          session={session}
          onClose={() => setShowBreathing(false)}
        />
      </Modal>
    </View>
  );
};

const App = () => (
  <ThemeProvider>
    <LanguageProvider>
      <NavigationProvider initialScreen="Welcome">
        <AppContent />
      </NavigationProvider>
    </LanguageProvider>
  </ThemeProvider>
);

const s = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
});

export default App;
