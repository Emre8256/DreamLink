
import { useColorScheme } from '@/components/useColorScheme';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import {
  Quicksand_400Regular,
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import { Stack, useRouter, useSegments, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect } from 'react';
import { AppState, Platform, StatusBar, View } from 'react-native';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../context/AuthContext';

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
    Quicksand_400Regular,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
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

    // Check if user is in an authentication screen (login or register or welcome)
    const inAuthGroup = segments[0] === 'login' || segments[0] === 'register' || segments[0] === 'welcome';

    if (!user && !inAuthGroup && currentSegment !== 'welcome') {
      // Token yok ve auth ekranlarında değilse -> Welcome'a at
      router.replace('/welcome');
    } else if (user && inAuthGroup && currentSegment !== '(tabs)') {
      // Token var ve auth ekranlarındaysa -> Ana sayfaya at
      router.replace('/(tabs)');
    }
  }, [user, isLoading, segments, router]);

  const applyStatusBarStyle = useCallback(() => {
    StatusBar.setBarStyle('dark-content', true);
    if (Platform.OS === 'android') {
      StatusBar.setBackgroundColor('transparent');
      StatusBar.setTranslucent(true);
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
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: '#FFFFFF' },
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
            <Stack.Screen name="welcome" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
            <Stack.Screen name="notifications" options={{ headerShown: false }} />
            <Stack.Screen name="dream/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="premium-upsell" options={{ headerShown: false, presentation: 'modal' }} />
          </Stack>
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}