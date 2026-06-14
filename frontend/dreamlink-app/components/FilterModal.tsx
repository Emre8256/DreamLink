import React, { useRef, useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  BackHandler,
  PanResponder,
} from 'react-native';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore } from '../store/useAppStore';
import { useAuth } from '../context/AuthContext';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const COLORS = {
  primary: '#A63F4F',
  textMain: '#1C1714',
  textLight: '#94a3b8',
};

const GENDERS = [
  { label: 'Women', value: 'female', icon: 'female-outline' },
  { label: 'Men', value: 'male', icon: 'male-outline' },
  { label: 'Everyone', value: 'all', icon: 'people-outline' },
];

const SNAP_POINTS = ['44%'];

interface MultiSliderProps {
  min: number;
  max: number;
  values: [number, number];
  onChange: (values: [number, number]) => void;
}

function MultiSlider({ min, max, values, onChange }: MultiSliderProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const activeThumb = useRef<'min' | 'max' | null>(null);
  const startValueRef = useRef<number>(0);

  // Refs to prevent stale closures inside PanResponder callbacks
  const trackWidthRef = useRef(0);
  const valuesRef = useRef(values);

  useEffect(() => {
    trackWidthRef.current = trackWidth;
  }, [trackWidth]);

  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  const onTrackLayout = (e: any) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  const handleTouch = useCallback((locationX: number, dx: number, isGrant: boolean) => {
    const width = trackWidthRef.current;
    if (width === 0) return;
    
    const [currentMin, currentMax] = valuesRef.current;
    
    if (isGrant) {
      // Determine which thumb is closer based on current positions
      const minX = ((currentMin - min) / (max - min)) * width;
      const maxX = ((currentMax - min) / (max - min)) * width;
      
      if (Math.abs(locationX - minX) < Math.abs(locationX - maxX)) {
        activeThumb.current = 'min';
        const pct = Math.max(0, Math.min(1, locationX / width));
        const val = Math.round(min + pct * (max - min));
        const nextMin = Math.min(val, currentMax - 1);
        startValueRef.current = nextMin;
        if (nextMin !== currentMin) {
          onChange([nextMin, currentMax]);
        }
      } else {
        activeThumb.current = 'max';
        const pct = Math.max(0, Math.min(1, locationX / width));
        const val = Math.round(min + pct * (max - min));
        const nextMax = Math.max(val, currentMin + 1);
        startValueRef.current = nextMax;
        if (nextMax !== currentMax) {
          onChange([currentMin, nextMax]);
        }
      }
    } else {
      const deltaVal = (dx / width) * (max - min);
      const val = Math.round(startValueRef.current + deltaVal);
      const clampedVal = Math.max(min, Math.min(max, val));
      
      if (activeThumb.current === 'min') {
        const nextMin = Math.min(clampedVal, currentMax - 1);
        if (nextMin !== currentMin) {
          onChange([nextMin, currentMax]);
        }
      } else if (activeThumb.current === 'max') {
        const nextMax = Math.max(clampedVal, currentMin + 1);
        if (nextMax !== currentMax) {
          onChange([currentMin, nextMax]);
        }
      }
    }
  }, [min, max, onChange]);

  const handleTouchRef = useRef(handleTouch);
  useEffect(() => {
    handleTouchRef.current = handleTouch;
  }, [handleTouch]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        (evt.currentTarget as any)?.requestDisallowInterceptTouchEvent?.(true);
        handleTouchRef.current?.(evt.nativeEvent.locationX, 0, true);
      },
      onPanResponderMove: (evt, gestureState) => {
        (evt.currentTarget as any)?.requestDisallowInterceptTouchEvent?.(true);
        handleTouchRef.current?.(0, gestureState.dx, false);
      },
      onPanResponderRelease: () => {
        activeThumb.current = null;
      },
      onPanResponderTerminate: () => {
        activeThumb.current = null;
      },
    })
  ).current;

  const minPercent = ((values[0] - min) / (max - min)) * 100;
  const maxPercent = ((values[1] - min) / (max - min)) * 100;

  return (
    <View 
      ref={trackRef}
      collapsable={false}
      onLayout={onTrackLayout}
      style={styles.sliderContainer}
      {...panResponder.panHandlers}
    >
      {/* Background Track */}
      <View style={styles.sliderTrackBackground} pointerEvents="none" />

      {/* Selected Range Track */}
      <View 
        style={[
          styles.sliderTrackActive, 
          { 
            left: `${minPercent}%`, 
            right: `${100 - maxPercent}%` 
          }
        ]} 
        pointerEvents="none"
      />

      {/* Left (Min) Thumb */}
      <View 
        style={[
          styles.sliderThumb, 
          { 
            left: `${minPercent}%`,
            transform: [{ translateX: -14 }]
          }
        ]} 
        pointerEvents="none"
      />

      {/* Right (Max) Thumb */}
      <View 
        style={[
          styles.sliderThumb, 
          { 
            left: `${maxPercent}%`,
            transform: [{ translateX: -14 }]
          }
        ]} 
        pointerEvents="none"
      />
    </View>
  );
}

export default function FilterModal() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef<BottomSheet>(null);
  const { user } = useAuth();
  const isPremium = user?.token?.includes('premium') || false;

  const filterModal = useAppStore(state => state.filterModal);
  const closeFilterModal = useAppStore(state => state.closeFilterModal);
  const setFilterValues = useAppStore(state => state.setFilterValues);

  const { visible } = filterModal;

  // Local state for editing
  const [localAgeRange, setLocalAgeRange] = useState(filterModal.ageRange);
  const [localGender, setLocalGender] = useState(filterModal.gender);

  // Sync local state when modal opens
  useEffect(() => {
    if (visible) {
      setLocalAgeRange(filterModal.ageRange);
      setLocalGender(filterModal.gender);
      
      // Request animation frame to ensure the animation is silky smooth and doesn't drop frames while React processes the local state updates.
      requestAnimationFrame(() => {
        bottomSheetRef.current?.expand();
      });
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, filterModal.ageRange, filterModal.gender]);

  useEffect(() => {
    const onBackPress = () => {
      if (visible) {
        closeFilterModal();
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
  }, [visible, closeFilterModal]);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      if (visible) {
        closeFilterModal();
      }
    }
  }, [visible, closeFilterModal]);

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

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents={visible ? 'box-none' : 'none'}>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={SNAP_POINTS}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#FFFFFF', borderRadius: 28 }}
        handleIndicatorStyle={{ backgroundColor: '#E2E8F0', width: 40 }}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16, paddingHorizontal: 24, paddingTop: 12 }}>
          <Text style={styles.filterTitle}>Filter</Text>

          <View style={styles.sliderHeaderRow}>
            <Text style={styles.filterLabelInline}>Age Range</Text>
            <Text style={styles.sliderValueText}>{localAgeRange[0]} - {localAgeRange[1]}</Text>
          </View>

          <MultiSlider
            min={18}
            max={65}
            values={localAgeRange}
            onChange={setLocalAgeRange}
          />

          <Text style={styles.filterLabel}>Gender</Text>
          <View style={styles.genderRow}>
            {GENDERS.map(opt => (
              <TouchableOpacity 
                key={opt.value} 
                style={[styles.genderBox, localGender === opt.value && styles.genderBoxActive]} 
                onPress={() => setLocalGender(opt.value)} 
                activeOpacity={0.8}
              >
                <Ionicons 
                  name={opt.icon as any} 
                  size={20} 
                  color={localGender === opt.value ? COLORS.primary : '#64748b'} 
                />
                <Text style={[styles.genderText, localGender === opt.value && { color: COLORS.primary }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={styles.applyBtn} 
            onPress={() => {
              const isGenderChanged = localGender !== filterModal.gender;
              if (isGenderChanged && !isPremium) {
                closeFilterModal();
                router.push({ pathname: '/premium-upsell', params: { reason: 'likeLimit' } });
                return;
              }
              setFilterValues({ ageRange: localAgeRange, gender: localGender });
              closeFilterModal();
            }} 
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#A63F4F', '#7D2D3A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.applyBtnGradient}
            >
              <Text style={styles.applyBtnText}>Apply</Text>
            </LinearGradient>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  filterTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textMain, marginBottom: 16, textAlign: 'center' },
  filterLabel: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 14, marginBottom: 8 },
  filterLabelInline: { fontSize: 11, fontWeight: '700', color: COLORS.textLight, letterSpacing: 0.8, textTransform: 'uppercase' },
  sliderHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, marginBottom: 8 },
  sliderValueText: { fontSize: 15, fontWeight: '700', color: COLORS.primary },
  genderRow: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  genderBox: { flex: 1, height: 72, borderRadius: 16, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'transparent' },
  genderBoxActive: { backgroundColor: '#FFF4F5', borderColor: COLORS.primary, borderWidth: 1.5 },
  genderText: { fontSize: 13, fontWeight: '600', color: COLORS.textMain, marginTop: 6 },
  applyBtn: { 
    marginTop: 32, 
    borderRadius: 100, 
    overflow: 'hidden',
    shadowColor: '#A63F4F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnGradient: { height: 56, alignItems: 'center', justifyContent: 'center' },
  applyBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: 0.5 },
  // MultiSlider Styles
  sliderContainer: { height: 50, justifyContent: 'center', position: 'relative', marginHorizontal: 14 },
  sliderTrackBackground: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3 },
  sliderTrackActive: { position: 'absolute', height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  sliderThumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
