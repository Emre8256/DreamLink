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
}));

