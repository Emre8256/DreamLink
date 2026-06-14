import React, { useRef, useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  ActivityIndicator,
  Alert,
} from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Star, MessageCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/useAppStore';

const QS_BOLD = 'Quicksand_700Bold';
const QS_MEDIUM = 'Quicksand_500Medium';

const C = {
  primary: '#A63F4F',
  textMain: '#1C1714',
  textMuted: '#475569',
  textLight: '#94a3b8',
};

export default function PurchaseDrawer() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);

  const purchaseDrawer = useAppStore(state => state.purchaseDrawer);
  const closePurchaseDrawer = useAppStore(state => state.closePurchaseDrawer);

  const { visible, type, title, onSuccess } = purchaseDrawer;

  // Ad Reward System States
  const [watchedAdsCount, setWatchedAdsCount] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  // Package Purchase Selection & Payment simulation
  const [selectedCount, setSelectedCount] = useState<number>(10); // Default to 10 (Best Value)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const SUPERLIKE_PACKAGES = useMemo(() => [
    { count: 2, price: '$1.99', savePercent: null },
    { count: 5, price: '$3.99', savePercent: '20% Off' },
    { count: 10, price: '$6.99', savePercent: '30% Off', bestValue: true },
  ], []);

  const WHISPER_PACKAGES = useMemo(() => [
    { count: 2, price: '$2.99', savePercent: null },
    { count: 5, price: '$5.99', savePercent: '20% Off' },
    { count: 10, price: '$9.99', savePercent: '33% Off', bestValue: true },
  ], []);

  const snapPoints = useMemo(() => {
    return type === 'rewind' ? ['46%'] : ['58%'];
  }, [type]);

  useEffect(() => {
    if (visible) {
      setWatchedAdsCount(0);
      setIsWatchingAd(false);
      setSelectedCount(10);
      const timer = setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible]);

  useEffect(() => {
    const onBackPress = () => {
      if (visible) {
        closePurchaseDrawer();
        return true;
      }
      return false;
    };

    let backHandler: any;
    if (visible) {
      backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    }

    return () => {
      if (backHandler) {
        backHandler.remove();
      }
    };
  }, [visible, closePurchaseDrawer]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      if (visible) {
        closePurchaseDrawer();
      }
    }
  }, [visible, closePurchaseDrawer]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    []
  );



  const handleContinuePurchase = () => {
    if (isProcessingPayment) return;
    setIsProcessingPayment(true);

    // Simulate Google Play Payment loading & success dialog
    setTimeout(() => {
      setIsProcessingPayment(false);
      if (onSuccess) {
        onSuccess(type, selectedCount);
      }
      closePurchaseDrawer();
      Alert.alert(
        'Google Play',
        'Payment successful! Your tokens have been added.',
        [{ text: 'OK' }]
      );
    }, 2000);
  };

  const handleWatchAd = () => {
    if (isWatchingAd) return;
    setIsWatchingAd(true);
    setTimeout(() => {
      setIsWatchingAd(false);
      const nextCount = watchedAdsCount + 1;
      if (nextCount >= 2) {
        setWatchedAdsCount(0);
        if (onSuccess) {
          onSuccess('rewind', 1);
        }
        closePurchaseDrawer();
      } else {
        setWatchedAdsCount(nextCount);
        Alert.alert('Ad Completed', 'Watch 1 more ad to claim your reward!');
      }
    }, 1500);
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents={visible ? 'box-none' : 'none'}>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enableDynamicSizing={false}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#FFFFFF', borderRadius: 28 }}
        handleIndicatorStyle={{ backgroundColor: '#E2E8F0', width: 40 }}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16, paddingHorizontal: 24, paddingTop: 12 }}>
          <Text style={styles.drawerTitleText}>{title}</Text>

          {type !== 'rewind' ? (
            <View>
              <View style={styles.packagesContainer}>
                {(type === 'super' ? SUPERLIKE_PACKAGES : WHISPER_PACKAGES).map((pkg) => {
                  const Icon = type === 'super' ? Star : MessageCircle;
                  const iconColor = type === 'super' ? '#A63F4F' : '#8B5CF6';
                  const iconBg = type === 'super' ? 'rgba(166,63,79,0.1)' : 'rgba(139,92,246,0.1)';
                  const isSelected = selectedCount === pkg.count;
                  const activeColor = type === 'super' ? '#A63F4F' : '#8B5CF6';
                  const activeBg = type === 'super' ? '#FFF4F5' : '#F5F3FF';

                  return (
                    <TouchableOpacity
                      key={pkg.count}
                      style={[
                        styles.packageCard,
                        isSelected && { borderColor: activeColor, backgroundColor: activeBg, borderWidth: 2 }
                      ]}
                      onPress={() => setSelectedCount(pkg.count)}
                      activeOpacity={0.8}
                    >
                      {pkg.bestValue && (
                        <View style={styles.bestValueBadge}>
                          <Text style={styles.bestValueText}>BEST VALUE</Text>
                        </View>
                      )}
                      <View style={styles.packageLeft}>
                        <View style={[styles.packageIconWrap, { backgroundColor: iconBg }]}>
                          <Icon size={18} color={iconColor} strokeWidth={2.5} />
                        </View>
                        <View style={styles.packageInfoText}>
                          <Text style={styles.packageCountText}>
                            {pkg.count} {type === 'super' ? 'Superlikes' : 'Whispers'}
                          </Text>
                          {pkg.savePercent && (
                            <View style={styles.saveBadge}>
                              <Text style={styles.savePercentText}>{pkg.savePercent}</Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={styles.packageRight}>
                        <LinearGradient
                          colors={isSelected ? (type === 'super' ? ['#A63F4F', '#7D2D3A'] : ['#8B5CF6', '#6D28D9']) : ['#F1F5F9', '#E2E8F0']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.priceBtnGradient}
                        >
                          <Text style={[styles.priceBtnText, isSelected ? { color: '#FFF' } : { color: '#1C1714' }]}>
                            {pkg.price}
                          </Text>
                        </LinearGradient>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity
                style={styles.continueBtn}
                onPress={handleContinuePurchase}
                disabled={isProcessingPayment}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={type === 'super' ? ['#A63F4F', '#7D2D3A'] : ['#8B5CF6', '#6D28D9']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.continueBtnGradient}
                >
                  {isProcessingPayment ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.continueBtnText}>Continue</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.rewardContainer}>
              <Text style={styles.rewardDesc}>
                Watch 2 ads to receive 1 Rewind token for free. Support DreamLink and swipe back!
              </Text>

              <View style={styles.progressRow}>
                <View style={[styles.progressCard, watchedAdsCount >= 1 && styles.progressCardCompleted]}>
                  <Ionicons
                    name={watchedAdsCount >= 1 ? "checkmark-circle" : "play-circle-outline"}
                    size={24}
                    color={watchedAdsCount >= 1 ? "#3B82F6" : "#94A3B8"}
                  />
                  <Text style={[styles.progressCardText, watchedAdsCount >= 1 && styles.progressCardTextCompleted]}>
                    {watchedAdsCount >= 1 ? "Ad 1 Completed" : "First ad"}
                  </Text>
                </View>

                <View style={[styles.progressCard, watchedAdsCount >= 2 && styles.progressCardCompleted]}>
                  <Ionicons
                    name={watchedAdsCount >= 2 ? "checkmark-circle" : "play-circle-outline"}
                    size={24}
                    color={watchedAdsCount >= 2 ? "#3B82F6" : "#94A3B8"}
                  />
                  <Text style={[styles.progressCardText, watchedAdsCount >= 2 && styles.progressCardTextCompleted]}>
                    {watchedAdsCount >= 2 ? "Ad 2 Completed" : "Second ad"}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.adActionBtn}
                onPress={handleWatchAd}
                disabled={isWatchingAd}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={['#3B82F6', '#1D4ED8']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.adActionGradient}
                >
                  {isWatchingAd ? (
                    <ActivityIndicator size="small" color="#FFF" style={{ marginRight: 8 }} />
                  ) : (
                    <Ionicons name="play" size={16} color="#FFF" style={{ marginRight: 8 }} />
                  )}
                  <Text style={styles.adActionText}>
                    {isWatchingAd
                      ? "Loading Sponsor Content..."
                      : watchedAdsCount === 1
                        ? "Watch Final Ad"
                        : "Watch First Ad (1/2)"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerTitleText: {
    fontFamily: QS_BOLD,
    fontSize: 18,
    color: '#1C1714',
    marginBottom: 20,
    textAlign: 'center',
  },
  packagesContainer: {
    gap: 12,
  },
  packageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    position: 'relative',
    overflow: 'hidden',
  },
  packageCardBestValue: {
    backgroundColor: '#FFF4F5',
    borderColor: C.primary,
  },
  bestValueBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: '#D697A2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderBottomRightRadius: 8,
  },
  bestValueText: {
    fontFamily: QS_BOLD,
    fontSize: 7,
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  packageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  packageIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  packageInfoText: {
    gap: 4,
  },
  packageCountText: {
    fontFamily: QS_BOLD,
    fontSize: 15,
    color: '#1C1714',
  },
  saveBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(166,63,79,0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  savePercentText: {
    fontFamily: QS_BOLD,
    fontSize: 9,
    color: C.primary,
    fontWeight: '700',
  },
  packageRight: {
    alignItems: 'flex-end',
  },
  priceBtnGradient: {
    borderRadius: 100,
    paddingHorizontal: 18,
    paddingVertical: 10,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  priceBtnText: {
    fontFamily: QS_BOLD,
    fontSize: 14,
    fontWeight: '800',
  },
  rewardContainer: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  rewardDesc: {
    fontFamily: QS_MEDIUM,
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  progressCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  progressCardCompleted: {
    backgroundColor: '#EBF5FF',
    borderColor: '#3B82F6',
  },
  progressCardText: {
    fontFamily: QS_BOLD,
    fontSize: 13,
    color: '#64748B',
  },
  progressCardTextCompleted: {
    color: '#1E3A8A',
  },
  adActionBtn: {
    width: '100%',
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  adActionGradient: {
    flexDirection: 'row',
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
  adActionText: {
    fontFamily: QS_BOLD,
    fontSize: 15,
    color: '#FFF',
    fontWeight: '800',
  },
  continueBtn: {
    marginTop: 20,
    borderRadius: 100,
    overflow: 'hidden',
    shadowColor: '#A63F4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  continueBtnGradient: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  continueBtnText: {
    fontFamily: QS_BOLD,
    fontSize: 16,
    color: '#FFF',
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
