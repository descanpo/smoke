import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, StatusBar, Modal, Platform, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from './src/services/supabase';
import { Theme } from './src/theme/Theme';
import { NavigationProvider, useNavigation, ScreenType } from './src/navigation/Navigator';
import { BottomNavBar } from './src/components/BottomNavBar';
import CravingModal from './src/components/CravingModal';
import BreathingModal from './src/components/BreathingModal';
import WelcomeScreen from './src/screens/WelcomeScreen';
import EmailLoginScreen from './src/screens/EmailLoginScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
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
import { ErrorBoundary } from './src/components/ErrorBoundary';
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
  <LinearGradient
    colors={isDark ? Theme.gradients.auroraDark : Theme.gradients.auroraLight}
    style={s.loading}
  >
    <LinearGradient
      colors={Theme.gradients.brandTeal}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={s.loadingMark}
    >
      <Text style={{ fontSize: 38 }}>🚭</Text>
    </LinearGradient>
    <ActivityIndicator color={isDark ? '#8B5CF6' : '#7C3AED'} style={{ marginTop: 24 }} />
  </LinearGradient>
);

const AppContent = () => {
  const { currentScreen, navigate, reset } = useNavigation();
  const currentScreenRef = React.useRef(currentScreen);
  useEffect(() => { currentScreenRef.current = currentScreen; }, [currentScreen]);
  // Hangi kullanıcının yolculuğunu zaten yüklediğimizi tutar. Supabase, başka bir
  // sekmeye geçip dönünce (visibility/focus) onAuthStateChange'i SIGNED_IN /
  // TOKEN_REFRESHED ile yeniden tetikler; aynı kullanıcı için tekrar fetch +
  // tam ekran yükleyici göstermeyip "refresh atıyor" hissini önlemek için kullanılır.
  const loadedUserIdRef = React.useRef<string | null>(null);
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
        loadedUserIdRef.current = s.user.id;
        fetchJourney(s.user.id);
      } else {
        setLoading(false);
      }
      setInitializing(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);

      if (!s) {
        // Çıkış yapıldı
        loadedUserIdRef.current = null;
        cancelAllNotifications();
        setJourney(null);
        setLoading(false);
        reset('Welcome');
        return;
      }

      // Yalnızca GERÇEKTEN yeni bir kullanıcı giriş yaptığında yolculuğu yükle
      // (yükleyici + yönlendirme). Aynı kullanıcı için tekrarlanan SIGNED_IN
      // (sekme yeniden odaklanması) veya TOKEN_REFRESHED / USER_UPDATED olaylarında
      // sadece oturumu sessizce güncelle — yeniden fetch yok, yükleyici flaşı yok.
      if (s.user.id !== loadedUserIdRef.current) {
        loadedUserIdRef.current = s.user.id;
        fetchJourney(s.user.id);
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
    if (!session && currentScreen !== 'EmailLogin' && currentScreen !== 'ForgotPassword') {
      return <WelcomeScreen />;
    }

    // Session exists but the journey hasn't been resolved yet (e.g. right after
    // logging back in). Show a branded loader instead of falling through to
    // HomeScreen with a null journey, which used to leave the user stranded on
    // a "Journey not found" dead-end with no navigation.
    if (loading || currentScreen === 'Welcome') {
      return <LoadingScreen isDark={isDark} />;
    }

    switch (currentScreen) {
      case 'EmailLogin':
        return <EmailLoginScreen />;
      case 'ForgotPassword':
        return <ForgotPasswordScreen />;
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

// TESTING: Set to test password reset flow
const TEST_MODE = true;

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <LanguageProvider>
        <NavigationProvider initialScreen={TEST_MODE ? 'ForgotPassword' : 'Welcome'}>
          <AppContent />
        </NavigationProvider>
      </LanguageProvider>
    </ThemeProvider>
  </ErrorBoundary>
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
    width: 84, height: 84, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 12px 30px rgba(124,58,237,0.45)' } as any,
      default: { shadowColor: '#7C3AED', shadowOpacity: 0.45, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
    }),
  },
});

export default App;
