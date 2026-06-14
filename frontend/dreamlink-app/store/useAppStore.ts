import { create } from 'zustand';

type Dream = any; // TODO: type tanımla
interface MessageMap { [chatId: string]: any[]; }
type Match = any;

interface AppState {
  dreams: Dream[];
  addDream: (dream: Dream) => void;
  matches: Match[];
  addMatch: (match: Match) => void;
  messages: MessageMap;
  addMessage: (chatId: string, message: any) => void;
  
  // Unread flags for Tab Bar
  hasUnreadMessages: boolean;
  hasUnreadMatches: boolean;
  hasUnreadDreams: boolean;
  setUnreadMessages: (val: boolean) => void;
  setUnreadMatches: (val: boolean) => void;
  setUnreadDreams: (val: boolean) => void;

  // Global Modals
  reportModal: {
    visible: boolean;
    user: { id: string; name: string } | null;
    initialMode: 'block' | 'report' | null;
    onSuccess?: (userId: string, action: 'block' | 'report' | 'both') => void;
  };
  openReportModal: (user: { id: string; name: string }, mode: 'block' | 'report', onSuccess?: (userId: string, action: 'block' | 'report' | 'both') => void) => void;
  closeReportModal: () => void;

  // Filter Modal
  filterModal: {
    visible: boolean;
    location: string;
    ageRange: [number, number];
    gender: string;
  };
  openFilterModal: () => void;
  closeFilterModal: () => void;
  setFilterValues: (values: Partial<{ location: string; ageRange: [number, number]; gender: string }>) => void;

  // Global Purchase Drawer
  purchaseDrawer: {
    visible: boolean;
    type: 'super' | 'whisper' | 'rewind';
    title: string;
    onSuccess?: (type: 'super' | 'whisper' | 'rewind', incrementValue: number) => void;
  };
  openPurchaseDrawer: (type: 'super' | 'whisper' | 'rewind', title: string, onSuccess?: (type: 'super' | 'whisper' | 'rewind', incrementValue: number) => void) => void;
  closePurchaseDrawer: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  dreams: [],
  addDream: (dream) =>
    set((state) => {
      // Aynı ID zaten listede varsa ekleme (duplicate önleme)
      if (state.dreams.some((d: Dream) => d.id === dream.id)) return state;
      return { dreams: [dream, ...state.dreams] };
    }),
  matches: [],
  addMatch: (match) => set((state) => ({ matches: [match, ...state.matches] })),
  messages: {},
  addMessage: (chatId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [chatId]: [...(state.messages[chatId] || []), message],
    },
  })),

  // Initial unread values
  hasUnreadMessages: false,
  hasUnreadMatches: false,
  hasUnreadDreams: false,
  setUnreadMessages: (val) => set({ hasUnreadMessages: val }),
  setUnreadMatches: (val) => set({ hasUnreadMatches: val }),
  setUnreadDreams: (val) => set({ hasUnreadDreams: val }),

  reportModal: {
    visible: false,
    user: null,
    initialMode: null,
    onSuccess: undefined,
  },
  openReportModal: (user, mode, onSuccess) => set({
    reportModal: { visible: true, user, initialMode: mode, onSuccess }
  }),
  closeReportModal: () => set((state) => ({
    reportModal: { ...state.reportModal, visible: false }
  })),

  filterModal: {
    visible: false,
    location: 'nearby',
    ageRange: [18, 35],
    gender: 'all',
  },
  openFilterModal: () => set((state) => ({
    filterModal: { ...state.filterModal, visible: true }
  })),
  closeFilterModal: () => set((state) => ({
    filterModal: { ...state.filterModal, visible: false }
  })),
  setFilterValues: (values) => set((state) => ({
    filterModal: { ...state.filterModal, ...values }
  })),

  purchaseDrawer: {
    visible: false,
    type: 'super',
    title: 'Get Superlikes',
    onSuccess: undefined,
  },
  openPurchaseDrawer: (type, title, onSuccess) => set({
    purchaseDrawer: { visible: true, type, title, onSuccess }
  }),
  closePurchaseDrawer: () => set((state) => ({
    purchaseDrawer: { ...state.purchaseDrawer, visible: false }
  })),
}));

