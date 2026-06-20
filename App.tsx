import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Modal, Platform, ActivityIndicator } from 'react-native';
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
import CommunityScreen from './src/screens/CommunityScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SOSScreen from './src/screens/SOSScreen';
import SupportScreen from './src/screens/SupportScreen';
import CheckInModal from './src/components/CheckInModal';
import RelapseModal from './src/components/RelapseModal';
import { ThemeProvider, useThemeMode } from './src/context/ThemeContext';
import { LanguageProvider, useLanguage } from './src/context/LanguageContext';
import {
  requestNotificationPermission,
  scheduleStreakReminder,
  scheduleEveningCheckIn,
  scheduleMilestoneNotifications,
  cancelAllNotifications,
} from './src/services/notifications';

const TAB_SCREENS: ScreenType[] = ['Home', 'Progress', 'Stats', 'Community', 'Profile'];

const LoadingScreen = ({ isDark }: { isDark: boolean }) => (
  <View style={[s.loading, { backgroundColor: isDark ? '#0D0E12' : '#F7F8FA' }]}>
    <View style={s.loadingMark}>
      <Text style={{ fontSize: 34 }}>🚭</Text>
    </View>
    <ActivityIndicator color="#8B5CF6" style={{ marginTop: 20 }} />
  </View>
);

const AppContent = () => {
  const { currentScreen, navigate, reset } = useNavigation();
  const currentScreenRef = React.useRef(currentScreen);
  useEffect(() => { currentScreenRef.current = currentScreen; }, [currentScreen]);
  const { isDark } = useThemeMode();
  const { lang } = useLanguage();
  const [session, setSession] = useState<any>(null);
  const [journey, setJourney] = useState<any>(null);
  const [showCraving, setShowCraving] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [showRelapse, setShowRelapse] = useState(false);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) {
        fetchJourney(s.user.id);
      } else {
        setLoading(false);
      }
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (s) {
        // Don't re-navigate if already on a main screen (avoids stale closure nav bug)
        const TAB_SCREENS_SET = new Set(TAB_SCREENS);
        if (!TAB_SCREENS_SET.has(currentScreenRef.current)) {
          fetchJourney(s.user.id);
        } else if (event === 'SIGNED_IN') {
          fetchJourney(s.user.id);
        }
        // For TOKEN_REFRESHED, just silently update the session, no navigation
      } else {
        cancelAllNotifications();
        setJourney(null);
        setLoading(false);
        reset('Welcome');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchJourney = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase.from('quit_journeys')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .maybeSingle();

    // On a transient network/query error, don't wrongly send the user to
    // Onboarding — keep them on a screen they can act on.
    if (error) {
      setLoading(false);
      if (currentScreenRef.current === 'Welcome') navigate('Onboarding');
      return;
    }

    setJourney(data ?? null);
    setLoading(false);
    if (!data) {
      navigate('Onboarding');
    } else {
      // Schedule notifications for the journey
      if (Platform.OS !== 'web') {
        requestNotificationPermission().then(granted => {
          if (granted && data?.quit_date) {
            scheduleStreakReminder(lang);
            scheduleEveningCheckIn(lang);
            scheduleMilestoneNotifications(data.quit_date, lang);
          }
        });
      }
      if (currentScreenRef.current === 'Welcome' || currentScreenRef.current === 'Onboarding') {
        navigate('Home');
      }
    }
  };

  const renderScreen = () => {
    // Until the first getSession() resolves we don't yet know whether the user
    // is logged in — show the loader so already-authenticated users don't see
    // the login screen flash on every cold start.
    if (initializing) return <LoadingScreen isDark={isDark} />;
    if (!session) return <WelcomeScreen />;

    // Session exists but the journey hasn't been resolved yet (e.g. right after
    // logging back in). Show a branded loader instead of falling through to
    // HomeScreen with a null journey, which used to leave the user stranded on
    // a "Journey not found" dead-end with no navigation.
    if (loading || currentScreen === 'Welcome') {
      return <LoadingScreen isDark={isDark} />;
    }

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
            onCheckIn={() => setShowCheckIn(true)}
          />
        );
      case 'SOS':
        return (
          <SOSScreen
            session={session}
            journey={journey}
            onBreathing={() => setShowBreathing(true)}
            onLogCraving={() => setShowCraving(true)}
          />
        );
      case 'Support':
        return <SupportScreen />;
      case 'Progress':
        return <ProgressScreen session={session} journey={journey} />;
      case 'Stats':
        return <StatsScreen session={session} journey={journey} />;
      case 'Community':
        return <CommunityScreen session={session} journey={journey} />;
      case 'Profile':
        return (
          <ProfileScreen
            session={session}
            journey={journey}
            onJourneyReset={() => {
              setJourney(null);
              navigate('Onboarding');
            }}
            onJourneyUpdate={() => fetchJourney(session.user.id)}
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
  const bgColor = isDark ? '#0D0E12' : '#F7F8FA';

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
          onRelapse={() => { setShowCraving(false); setShowRelapse(true); }}
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
      <Modal
        visible={showCheckIn}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowCheckIn(false)}
      >
        <CheckInModal
          session={session}
          journey={journey}
          onClose={() => setShowCheckIn(false)}
        />
      </Modal>
      <Modal
        visible={showRelapse}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setShowRelapse(false)}
      >
        <RelapseModal
          session={session}
          journey={journey}
          onClose={() => setShowRelapse(false)}
          onJourneyUpdate={() => session && fetchJourney(session.user.id)}
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMark: {
    width: 76, height: 76, borderRadius: 24,
    backgroundColor: 'rgba(124,58,237,0.18)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(124,58,237,0.35)',
  },
});

export default App;
