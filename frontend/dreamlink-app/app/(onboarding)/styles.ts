import { StyleSheet } from 'react-native';

export const C = {
  ink: '#0E0B0D',
  rose: '#C4506A',
  white: '#FFFFFF',
  glass: 'rgba(255,255,255,0.12)',
  glassBorder: 'rgba(255,255,255,0.22)',
  muted: 'rgba(255,255,255,0.5)',
  pale: 'rgba(255,255,255,0.05)',
};

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.ink },
  keyboard: { flex: 1 },
  shell: { flex: 1, paddingHorizontal: 28 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 24, marginLeft: -8 },
  iconButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  progressTrack: { flex: 1, height: 4, borderRadius: 2, backgroundColor: C.glassBorder, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2, backgroundColor: C.white },
  skipButton: { minWidth: 50, height: 36, alignItems: 'center', justifyContent: 'center' },
  skipPlaceholder: { width: 50 },
  skipText: { color: C.muted, fontFamily: 'Quicksand_700Bold', fontSize: 14 },
  body: { flex: 1, minHeight: 0 },
  mainScroll: { flex: 1 },
  content: { flexGrow: 1 },
  section: { gap: 12 },
  title: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 28, lineHeight: 36, letterSpacing: -0.3, marginBottom: 4, includeFontPadding: false },
  modalTitle: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 28, lineHeight: 34, includeFontPadding: false },
  copy: { color: C.muted, fontFamily: 'Quicksand_500Medium', fontSize: 16, lineHeight: 24 },
  note: { color: C.muted, fontFamily: 'Quicksand_600SemiBold', fontSize: 14, lineHeight: 20, marginTop: 4 },
  stack: { gap: 16, marginTop: 24 },
  input: { minHeight: 56, borderBottomWidth: 2, borderBottomColor: C.glassBorder, color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 20, paddingVertical: 12, paddingHorizontal: 4 },
  inputGroup: { gap: 8, marginTop: 8 },
  inputLabel: { color: "#e3e3e3ff", fontFamily: 'Quicksand_700Bold', fontSize: 12, letterSpacing: 1.5 },
  cardInput: { height: 60, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.45)', color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 18, paddingHorizontal: 16 },
  dobContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dobInput: { flex: 1, height: 60, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.45)', color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 20, textAlign: 'center' },
  dobInputYear: { flex: 1.5 },
  dobDivider: { color: C.glassBorder, fontFamily: 'Quicksand_700Bold', fontSize: 24 },
  dobErrorText: { color: '#FF6B6B', fontFamily: 'Quicksand_600SemiBold', fontSize: 14, marginTop: 4 },
  inputWarning: { color: C.muted, fontFamily: 'Quicksand_500Medium', fontSize: 12 },
  warningContainer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, paddingHorizontal: 4 },

  buttonWrapper: { position: 'absolute', left: 0, right: 0 },
  primaryButton: { height: 60, borderRadius: 30, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', shadowColor: C.white, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  disabled: { opacity: 0.3, shadowOpacity: 0, elevation: 0 },
  primaryText: { color: C.ink, fontFamily: 'Quicksand_700Bold', fontSize: 18 },

  choice: { minHeight: 64, borderRadius: 20, paddingHorizontal: 20, backgroundColor: 'rgba(255, 255, 255, 0.06)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.45)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  choiceSelected: { backgroundColor: C.white, borderColor: C.white },
  choiceText: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 18 },
  choiceTextSelected: { color: C.ink },

  // ─── WheelPicker (height selection) ─────────────────────────────────────────
  heightPickerWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  wheelPicker: {
    width: '100%',
  },
  wheelItemText: {
    color: C.white,
    fontFamily: 'Quicksand_600SemiBold',
    fontSize: 20,
  },
  wheelSelectedText: {
    color: C.white,
    fontFamily: 'Quicksand_700Bold',
    fontSize: 26,
  },
  wheelOverlayItem: {
    borderRadius: 16,
    backgroundColor: 'rgba(196,80,106,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(196,80,106,0.3)',
  },
  wheelSelectorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  wheelSelector: {
    height: 64,
    borderWidth: 1.5,
    borderRadius: 16,
    borderColor: 'rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  wheelFadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: 64 * 2 },
  wheelFadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 64 * 2 },

  // Interest categories — menü sekme stili
  categoryTabRow: { gap: 0, paddingBottom: 4 },
  categoryTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent', backgroundColor: 'transparent', borderRadius: 0 },
  categoryTabActive: { borderBottomColor: C.white, backgroundColor: 'transparent' },
  categoryTabEmoji: { fontSize: 15 },
  categoryTabText: { color: C.muted, fontFamily: 'Quicksand_700Bold', fontSize: 13 },
  categoryTabTextActive: { color: C.white },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, borderWidth: 1.5, borderColor: C.glassBorder, backgroundColor: 'rgba(255, 255, 255, 0.08)', paddingHorizontal: 14, paddingVertical: 10 },
  chipSelected: { backgroundColor: C.white, borderColor: C.white },
  chipDisabled: { opacity: 0.3 },
  chipEmoji: { fontSize: 15 },
  chipText: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 15 },
  chipTextSelected: { color: C.ink },

  selectedRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 },
  selectedLabel: { color: C.muted, fontFamily: 'Quicksand_700Bold', fontSize: 13 },
  selectedValues: { color: C.white, fontFamily: 'Quicksand_600SemiBold', fontSize: 13, flex: 1 },

  lifestyle: { gap: 12, padding: 16, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.45)' },
  lifestyleTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lifestyleTitle: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 16 },

  // Prompts
  promptCard: { gap: 16, borderRadius: 24, backgroundColor: C.glass, borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.45)', padding: 18 },
  promptTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  promptLabel: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 16 },
  smallRemove: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  questionPicker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.07)', borderWidth: 1, borderColor: C.glassBorder },
  questionPickerText: { flex: 1, color: C.white, fontFamily: 'Quicksand_600SemiBold', fontSize: 15, lineHeight: 22 },
  questionPickerPlaceholder: { color: C.muted },
  answerInput: { minHeight: 100, fontSize: 18, borderBottomWidth: 0, paddingTop: 12, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, paddingHorizontal: 16 },
  promptGrid: { flexDirection: 'column', gap: 16, alignItems: 'stretch' },
  addPromptButton: { width: '100%', minHeight: 120, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.45)', alignItems: 'flex-start', justifyContent: 'center', gap: 8, padding: 18 },
  addPromptIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.25)', alignItems: 'center', justifyContent: 'center' },
  addPromptText: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 18, lineHeight: 23 },
  addPromptSubtext: { color: C.white, fontFamily: 'Quicksand_600SemiBold', fontSize: 12, lineHeight: 17, opacity: 0.8 },

  // New Prompts Display Styles
  promptDisplayCard: { width: '100%', minHeight: 120, gap: 10, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.04)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.45)', padding: 18, paddingTop: 18 },
  promptCardBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: 10, paddingVertical: 5 },
  promptCardBadgeText: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 11 },
  promptDisplayQuestion: { color: C.muted, fontFamily: 'Quicksand_600SemiBold', fontSize: 12, lineHeight: 17, textTransform: 'uppercase' },
  promptDisplayAnswer: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 17, lineHeight: 23, paddingRight: 80 },
  promptEditIcon: { position: 'absolute', top: 18, right: 56, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  promptRemoveIcon: { position: 'absolute', top: 18, right: 18, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },

  // Answer Modal Styles
  answerModalContainer: { flex: 1, padding: 24 },
  answerModalQuestion: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 30, lineHeight: 38, marginTop: 30, marginBottom: 18, includeFontPadding: false },
  answerModalInput: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 22, lineHeight: 32, minHeight: 150, textAlignVertical: 'top', backgroundColor: 'rgba(255, 255, 255, 0.12)', borderRadius: 22, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.45)', padding: 18 },
  answerModalDoneBtn: { height: 60, borderRadius: 30, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginTop: 'auto', marginBottom: 24, shadowColor: '#000000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.18, shadowRadius: 16, elevation: 4 },
  answerModalDoneText: { color: C.ink, fontFamily: 'Quicksand_700Bold', fontSize: 18 },
  answerModalChangeQuestion: { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', paddingVertical: 9, paddingHorizontal: 14, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)', borderRadius: 20, marginBottom: 18 },
  answerModalChangeQuestionText: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 14 },

  // Photos
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 14, justifyContent: 'space-between' },
  photoSlot: { width: '47.5%', aspectRatio: 0.75, borderRadius: 20, backgroundColor: C.pale, borderWidth: 1.5, borderColor: C.glassBorder, overflow: 'hidden' },
  photo: { width: '100%', height: '100%' },
  addPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cameraIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  removePhoto: { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },

  // Location
  locationCard: { borderRadius: 24, backgroundColor: C.glass, borderWidth: 1, borderColor: C.glassBorder, padding: 24, gap: 14, alignItems: 'center', marginTop: 12 },
  locationTitle: { color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 22, textAlign: 'center' },
  locationCopy: { color: C.muted, fontFamily: 'Quicksand_500Medium', fontSize: 16, lineHeight: 24, textAlign: 'center' },

  // Modal
  modalContainer: { flex: 1 },
  promptModalSurface: { flex: 1, backgroundColor: C.ink },
  modalHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 18, paddingBottom: 14, gap: 16 },
  modalAccentPill: { alignSelf: 'flex-start', backgroundColor: 'rgba(196, 80, 106, 0.2)', borderRadius: 999, paddingHorizontal: 11, paddingVertical: 5, marginBottom: 8 },
  modalAccentText: { color: '#FFA1B5', fontFamily: 'Quicksand_700Bold', fontSize: 10, letterSpacing: 1.4 },
  modalClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255, 255, 255, 0.1)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.2)', alignItems: 'center', justifyContent: 'center', marginTop: 4 },

  // Sekme çubuğu
  modalTabBar: { borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.15)' },
  modalTabRow: { paddingHorizontal: 18, flexDirection: 'row', gap: 8, paddingBottom: 12 },
  modalTab: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.15)' },
  modalTabActive: { backgroundColor: C.white, borderColor: C.white },
  modalTabText: { color: C.muted, fontFamily: 'Quicksand_700Bold', fontSize: 13, lineHeight: 18 },
  modalTabTextActive: { color: C.ink },
  modalTabLine: { display: 'none' },
  modalTabLineActive: { backgroundColor: 'transparent' },

  // Soru seçenekleri
  modalQuestions: { paddingHorizontal: 24, paddingTop: 14, paddingBottom: 40, gap: 10 },
  questionOption: { paddingHorizontal: 18, paddingVertical: 17, borderRadius: 18, backgroundColor: 'rgba(255, 255, 255, 0.08)', borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.15)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 },
  questionOptionSelected: { backgroundColor: C.white, borderColor: C.white },
  questionOptionText: { flex: 1, color: C.white, fontFamily: 'Quicksand_700Bold', fontSize: 16, lineHeight: 23 },
  questionOptionTextSelected: { color: C.ink },
  questionOptionCheck: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255, 255, 255, 0.3)', alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  questionOptionCheckSelected: { backgroundColor: C.rose, borderColor: C.rose },
});
