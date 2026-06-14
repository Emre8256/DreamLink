import React, { useState, useEffect, useRef, useCallback } from 'react';
import BottomSheet, { BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet';
import {
  Pressable,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  TextInput,
  BackHandler,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Constants & Tokens from the main theme (adapted to serious red for safety/blocking context)
const COLORS = {
  primary: '#DC2626', // Serious Red
  redLt: '#FEF2F2',   // Very Light Red
  redMd: '#FCA5A5',   // Medium Red
  redDk: '#991B1B',   // Dark Red
  bg: '#FFFFFF',
  sand: '#F8FAFC',
  textMain: '#1C1714',
  textMuted: '#475569',
  textLight: '#94a3b8',
  borderLight: 'rgba(0,0,0,0.04)',
  danger: '#DC2626',
};

const QS_REGULAR = 'Quicksand_400Regular';
const QS_MEDIUM = 'Quicksand_500Medium';
const QS_SEMIBOLD = 'Quicksand_600SemiBold';
const QS_BOLD = 'Quicksand_700Bold';

export type ReportReason = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
};

const REPORT_REASONS: ReportReason[] = [
  {
    id: 'underage',
    label: 'Underage User',
    icon: 'person-remove',
    description: 'I believe the user is under 18 years old.',
  },
  {
    id: 'harassment',
    label: 'Harassment or Threat',
    icon: 'warning',
    description: 'Bullying, harassing behavior, or physical threats.',
  },
  {
    id: 'nudity',
    label: 'Nudity or Sexual Content',
    icon: 'body',
    description: 'Nudity or sexually explicit content in profile photos or bio.',
  },
  {
    id: 'spam',
    label: 'Spam or Fake Profile',
    icon: 'alert-circle',
    description: 'I believe the profile is fake, a scam, or sending spam.',
  },
  {
    id: 'dream_content',
    label: 'Inappropriate Dream Content',
    icon: 'moon',
    description: 'The posted dream violates community guidelines or is explicit.',
  },
  {
    id: 'hate_speech',
    label: 'Hate Speech',
    icon: 'megaphone',
    description: 'Contains discrimination, racism, or hate speech.',
  },
];

export type ReportModalProps = {
  visible: boolean;
  user: { id: string; name: string } | null;
  initialMode: 'block' | 'report' | null;
  onClose: () => void;
  onSuccess: (userId: string, action: 'block' | 'report' | 'both') => void;
};

type Step = 'confirm_block' | 'confirm_report' | 'report_reason' | 'report_details' | 'loading' | 'success';

export default function ReportModal({ visible, user, initialMode, onClose, onSuccess }: ReportModalProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('confirm_block');
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [reportDetails, setReportDetails] = useState('');
  const [submittedAction, setSubmittedAction] = useState<'block' | 'report' | 'both' | null>(null);

  // Toggles
  const [wantToReportAlso, setWantToReportAlso] = useState(false);
  const [wantToBlockAlso, setWantToBlockAlso] = useState(true); // Default true when reporting

  const bottomSheetRef = useRef<BottomSheet>(null);
  const visibleRef = useRef(false);

  useEffect(() => {
    visibleRef.current = visible;
    if (visible) {
      setReportDetails('');
      setSelectedReason(null);
      setSubmittedAction(null);
      if (initialMode === 'report') {
        setStep('report_reason');
        setWantToBlockAlso(true);
      } else {
        setStep('confirm_block');
        setWantToReportAlso(false);
      }
      const timer = setTimeout(() => {
        bottomSheetRef.current?.snapToIndex(0);
      }, 80);
      return () => clearTimeout(timer);
    } else {
      bottomSheetRef.current?.close();
    }
  }, [visible, initialMode]);

  useEffect(() => {
    const onBackPress = () => {
      if (visible) {
        handleClose();
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
  }, [visible]);

  const handleClose = () => {
    bottomSheetRef.current?.close();
  };

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1 && visibleRef.current) {
      onClose();
    }
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  const executeAction = (action: 'block' | 'report' | 'both') => {
    setSubmittedAction(action);
    setStep('loading');

    // Simulate API call
    setTimeout(() => {
      setStep('success');
      setTimeout(() => {
        onSuccess(user?.id || '', action);
        handleClose();
      }, 1800);
    }, 1200);
  };

  const onConfirmBlockClick = () => {
    if (wantToReportAlso) {
      setWantToBlockAlso(true);
      setStep('report_reason');
    } else {
      executeAction('block');
    }
  };

  const onReasonSelect = (reason: ReportReason) => {
    setSelectedReason(reason);
    setStep('report_details');
  };

  const onConfirmReportClick = () => {
    if (wantToBlockAlso) {
      executeAction('both');
    } else {
      executeAction('report');
    }
  };

  const formatName = (name: string) => {
    if (!name) return 'User';
    return name.charAt(0).toUpperCase() + name.slice(1);
  };

  const renderConfirmBlock = () => (
    <View style={styles.contentContainer}>
      <View style={styles.iconWrap}>
        <Ionicons name="ban" size={32} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>Block {formatName(user?.name || '')}?</Text>
      <Text style={styles.message}>
        Once blocked, you won't be able to see each other's dreams or send messages.
      </Text>

      <View style={styles.reportQuestionContainer}>
        <Text style={styles.reportQuestionText}>
          Would you also like to report this profile to help keep the Dream Link community safe?
        </Text>
        <TouchableOpacity
          style={styles.checkboxRow}
          activeOpacity={0.8}
          onPress={() => setWantToReportAlso(!wantToReportAlso)}
        >
          <View style={[styles.customCheckbox, wantToReportAlso && styles.customCheckboxActive]}>
            {wantToReportAlso && <Ionicons name="checkmark" size={14} color="#FFF" />}
          </View>
          <Text style={styles.checkboxLabel}>Report this profile as well</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryBtn, wantToReportAlso ? styles.btnReport : styles.btnBlock]}
          activeOpacity={0.85}
          onPress={onConfirmBlockClick}
        >
          <Text style={styles.primaryBtnText}>
            {wantToReportAlso ? 'Next (Report & Block)' : 'Block User'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelBtn} activeOpacity={0.7} onPress={handleClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  const renderReportReason = () => (
    <View style={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setStep(initialMode === 'block' ? 'confirm_block' : 'confirm_report')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={[styles.title, { marginBottom: 0, flex: 1, textAlign: 'left' }]}>
          Reason for Report
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <Text style={styles.messageLeft}>
        Select a reason for reporting {formatName(user?.name || '')}. This information will be kept confidential.
      </Text>

      <ScrollView style={styles.reasonList} showsVerticalScrollIndicator={false} bounces={false}>
        {REPORT_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason.id}
            style={styles.reasonCard}
            activeOpacity={0.7}
            onPress={() => onReasonSelect(reason)}
          >
            <View style={styles.reasonIconWrap}>
              <Ionicons name={reason.icon} size={20} color={COLORS.textMuted} />
            </View>
            <View style={styles.reasonTextWrap}>
              <Text style={styles.reasonLabel}>{reason.label}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textLight} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={[styles.cancelBtn, { marginTop: 16 }]} activeOpacity={0.7} onPress={handleClose}>
        <Text style={styles.cancelBtnText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  const renderReportDetails = () => (
    <View style={styles.contentContainer}>
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={() => setStep('report_reason')} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textMain} />
        </TouchableOpacity>
        <Text style={[styles.title, { marginBottom: 0, flex: 1, textAlign: 'left' }]}>
          Details
        </Text>
      </View>

      <View style={styles.selectedReasonCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reasonLabel}>{selectedReason?.label}</Text>
          <Text style={styles.reasonDesc}>{selectedReason?.description}</Text>
        </View>
      </View>

      <TextInput
        style={styles.detailsInput}
        placeholder="Is there anything else you would like to add? (Optional)"
        placeholderTextColor={COLORS.textLight}
        multiline
        value={reportDetails}
        onChangeText={setReportDetails}
        maxLength={300}
      />

      {initialMode === 'report' && (
        <View style={styles.reportQuestionContainer}>
          <TouchableOpacity
            style={styles.checkboxRow}
            activeOpacity={0.8}
            onPress={() => setWantToBlockAlso(!wantToBlockAlso)}
          >
            <View style={[styles.customCheckbox, wantToBlockAlso && styles.customCheckboxActive]}>
              {wantToBlockAlso && <Ionicons name="checkmark" size={14} color="#FFF" />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.checkboxLabel}>Block this user as well</Text>
              <Text style={styles.checkboxSub}>You will not match again or see their dreams.</Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryBtn, styles.btnReport]}
          activeOpacity={0.85}
          onPress={onConfirmReportClick}
        >
          <Text style={styles.primaryBtnText}>
            {wantToBlockAlso ? 'Report & Block' : 'Report Profile'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderLoading = () => (
    <View style={[styles.contentContainer, styles.centerAll]}>
      <ActivityIndicator size="large" color={COLORS.primary} />
      <Text style={styles.loadingText}>Processing request...</Text>
    </View>
  );

  const renderSuccess = () => {
    const isOnlyBlock = submittedAction === 'block';
    const title = isOnlyBlock ? 'User Blocked' : 'Report Submitted';
    const message = isOnlyBlock
      ? "You will no longer see this user's profile, dreams, or messages."
      : "Your feedback helps keep the Dream Link community safe. Thank you.";

    return (
      <View style={[styles.contentContainer, styles.centerAll]}>
        <View style={styles.successIconWrap}>
          <Ionicons name="checkmark-circle" size={64} color="#4ade80" />
        </View>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    );
  };

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 9999, elevation: 9999 }]} pointerEvents={visible ? 'box-none' : 'none'}>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        enableDynamicSizing={true}
        enablePanDownToClose={true}
        enableContentPanningGesture={false}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: '#FFFFFF', borderRadius: 28 }}
        handleIndicatorStyle={{ backgroundColor: '#E2E8F0', width: 40 }}
      >
        <BottomSheetView style={{ paddingBottom: insets.bottom + 16 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ width: '100%' }}
          >
            {step === 'confirm_block' && renderConfirmBlock()}
            {step === 'report_reason' && renderReportReason()}
            {step === 'report_details' && renderReportDetails()}
            {step === 'loading' && renderLoading()}
            {step === 'success' && renderSuccess()}
          </KeyboardAvoidingView>
        </BottomSheetView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 23, 20, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 0,
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalBody: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  contentContainer: {
    padding: 24,
  },
  centerAll: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  successIconWrap: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backBtn: {
    marginRight: 12,
  },
  title: {
    fontFamily: QS_BOLD,
    fontSize: 20,
    color: '#1C1714',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontFamily: QS_MEDIUM,
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  messageLeft: {
    fontFamily: QS_MEDIUM,
    fontSize: 14,
    color: '#475569',
    textAlign: 'left',
    lineHeight: 21,
    marginBottom: 20,
  },
  reportQuestionContainer: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  reportQuestionText: {
    fontFamily: QS_REGULAR,
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  customCheckboxActive: {
    borderColor: '#DC2626',
    backgroundColor: '#DC2626',
  },
  checkboxLabel: {
    fontFamily: QS_BOLD,
    fontSize: 13,
    color: '#1C1714',
  },
  checkboxSub: {
    fontFamily: QS_MEDIUM,
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    width: '100%',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBlock: {
    backgroundColor: '#1C1714',
  },
  btnReport: {
    backgroundColor: '#1C1714',
  },
  primaryBtnText: {
    fontFamily: QS_BOLD,
    fontSize: 15,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: QS_BOLD,
    fontSize: 14,
    color: '#94A3B8',
  },
  reasonList: {
    maxHeight: 400,
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  reasonIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reasonTextWrap: {
    flex: 1,
    paddingRight: 10,
  },
  reasonLabel: {
    fontFamily: QS_BOLD,
    fontSize: 14,
    color: '#1C1714',
  },
  selectedReasonCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(220,38,38,0.1)',
  },
  reasonDesc: {
    fontFamily: QS_MEDIUM,
    fontSize: 12,
    color: '#DC2626',
    marginTop: 4,
    lineHeight: 18,
  },
  detailsInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    fontFamily: QS_MEDIUM,
    fontSize: 14,
    color: '#1C1714',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  loadingText: {
    fontFamily: QS_SEMIBOLD,
    fontSize: 15,
    color: '#475569',
    marginTop: 16,
  },
});
