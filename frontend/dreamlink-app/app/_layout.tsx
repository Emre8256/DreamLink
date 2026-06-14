
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { AppState, Platform, StatusBar, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useAppStore } from '../store/useAppStore';
import ReportModal from '../components/ReportModal';
import FilterModal from '../components/FilterModal';
import PurchaseDrawer from '../components/PurchaseDrawer';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
    Quicksand: require('../assets/fonts/Quicksand_400Regular.ttf'),
    Quicksand_400Regular: require('../assets/fonts/Quicksand_400Regular.ttf'),
    Quicksand_500Medium: require('../assets/fonts/Quicksand_500Medium.ttf'),
    Quicksand_600SemiBold: require('../assets/fonts/Quicksand_600SemiBold.ttf'),
    Quicksand_700Bold: require('../assets/fonts/Quicksand_700Bold.ttf'),
    'Quicksand-Regular': require('../assets/fonts/Quicksand_400Regular.ttf'),
    'Quicksand-Medium': require('../assets/fonts/Quicksand_500Medium.ttf'),
    'Quicksand-SemiBold': require('../assets/fonts/Quicksand_600SemiBold.ttf'),
    'Quicksand-Bold': require('../assets/fonts/Quicksand_700Bold.ttf'),
    'PlayfairDisplay-Regular': require('../assets/fonts/PlayfairDisplay-Regular.ttf'),
    'PlayfairDisplay-Italic': require('../assets/fonts/PlayfairDisplay-Italic.ttf'),
    'PlayfairDisplay-BoldItalic': require('../assets/fonts/PlayfairDisplay-BoldItalic.ttf'),
    'CormorantGaramond-SemiBoldItalic': require('../assets/fonts/CormorantGaramond-SemiBoldItalic.ttf'),
  });

  useEffect(() => {
    if (error) console.warn('Font loading error:', error);
  }, [error]);

  useEffect(() => {
    if (loaded) {
      // Set global default font for Text and TextInput
      // Note: React Native 0.63+ recommends this approach for global styles if not using a custom component
      const { Text, TextInput } = require('react-native');

      try {
        if (Text.defaultProps) {
          Text.defaultProps.style = { ...Text.defaultProps.style, fontFamily: 'Quicksand' };
        } else {
          Text.defaultProps = { style: { fontFamily: 'Quicksand' } };
        }
      } catch (e) {
        console.warn('Could not set default font for Text component:', e);
      }

      try {
        if (TextInput.defaultProps) {
          TextInput.defaultProps.style = { ...TextInput.defaultProps.style, fontFamily: 'Quicksand' };
        } else {
          TextInput.defaultProps = { style: { fontFamily: 'Quicksand' } };
        }
      } catch (e) {
        console.warn('Could not set default font for TextInput component:', e);
      }

      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    const currentSegment = String(segments[0] ?? '');

    // Check if user is in an authentication screen (login or register or welcome or onboarding group)
    const inAuthGroup =
      segments[0] === 'login' ||
      segments[0] === 'welcome' ||
      segments[0] === '(onboarding)';

    if (!user && !inAuthGroup && currentSegment !== 'welcome') {
      // Token yok ve auth ekranlarında değilse -> Welcome'a at
      router.replace('/welcome');
    } else if (user && inAuthGroup && currentSegment !== '(tabs)') {
      // Token var ve auth ekranlarındaysa -> Ana sayfaya at
      router.replace('/(tabs)/today');
    }
  }, [user, isLoading, segments, router]);

  const applyStatusBarStyle = useCallback(() => {
    StatusBar.setBarStyle('dark-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);

      // Android soft navigation bar: solid white background with dark charcoal icons (#2A3439)
      try {
        NavigationBar.setBackgroundColorAsync('#FFFFFF');
        NavigationBar.setButtonStyleAsync('dark');
      } catch (err) {
        console.warn('NavigationBar error:', err);
      }
    }
  }, []);

  // StatusBar'ın uygulama arka plana gidip geldiğinde VEYA sayfa değiştiğinde sıfırlanmasını önlemek için imperative (zorunlu) ayar
  useEffect(() => {
    // İlk açılışta veya sayfa değiştiğinde uygula
    applyStatusBarStyle();

    // Arka plandan öne geldiğinde tekrar uygula
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        applyStatusBarStyle();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [pathname, applyStatusBarStyle]); // Sayfa değişimlerini (navigation events) dinleyerek her geçişte zorla uygula

  if (isLoading) {
    // Auth durumu yüklenirken boş ekran veya loading dönebiliriz.
    // Splash screen zaten gizlendiği için burada bir şey göstermek iyi olabilir.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
            <Stack
              screenOptions={{
                contentStyle: { backgroundColor: '#FFFFFF' },
                gestureEnabled: true,
                gestureDirection: 'horizontal',
                fullScreenGestureEnabled: true,
              }}
              screenListeners={{
                focus: () => {
                  applyStatusBarStyle();
                },
              }}
            >
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              <Stack.Screen name="chatbox" options={{ headerShown: false }} />
              <Stack.Screen name="welcome" options={{ headerShown: false, animation: 'fade' }} />
              <Stack.Screen name="login" options={{ headerShown: false }} />
              <Stack.Screen name="(onboarding)" options={{ headerShown: false }} />
              <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
              <Stack.Screen name="settings" options={{ headerShown: false }} />
              <Stack.Screen name="dream/[id]" options={{ headerShown: false }} />
              <Stack.Screen name="user-card" options={{ headerShown: false }} />
              <Stack.Screen name="help" options={{ headerShown: false }} />
              <Stack.Screen name="premium-upsell" options={{ headerShown: false, presentation: 'modal', animation: 'slide_from_bottom' }} />
            </Stack>
            <GlobalModals />
          </View>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function GlobalModals() {
  const reportModal = useAppStore(state => state.reportModal);
  const closeReportModal = useAppStore(state => state.closeReportModal);

  return (
    <>
      <ReportModal
        visible={reportModal.visible}
        user={reportModal.user}
        initialMode={reportModal.initialMode}
        onClose={closeReportModal}
        onSuccess={reportModal.onSuccess || (() => {})}
      />
      <FilterModal />
      <PurchaseDrawer />
    </>
  );
}