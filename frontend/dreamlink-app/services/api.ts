// API Service for DreamLink
// Connects to Spring Boot backend

import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8081/api';

if (!BASE_URL) {
  throw new Error(
    'Missing EXPO_PUBLIC_API_BASE_URL. Set it before starting or exporting the app (e.g. in .env or the build env). Required for web export/build.'
  );
}

console.log('API Base URL:', BASE_URL);

type ApiError = Error & { status?: number };

const buildApiError = (message: string, status: number): ApiError => {
  const error = new Error(message) as ApiError;
  error.status = status;
  return error;
};

export type PremiumCtaReason = 'likesYou' | 'dailyPicks' | 'likeLimit' | 'rewind' | 'boost';

export const getPremiumCtaCopy = (reason: PremiumCtaReason) => {
  switch (reason) {
    case 'likesYou':
      return {
        title: 'Premium gerekli',
        message: 'Beni Beğenenler Premium özelliğidir. Premium ile kimlerin seni beğendiğini gör.',
        ctaLabel: "Premium'a geç",
        cancelLabel: 'Kapat',
      };
    case 'dailyPicks':
      return {
        title: 'Premium gerekli',
        message: 'Günün Seçimleri için Premium ile daha fazla kart açılır.',
        ctaLabel: "Premium'a geç",
        cancelLabel: 'Kapat',
      };
    case 'likeLimit':
    case 'rewind':
      return {
        title: 'Premium gerekli',
        message: 'Rewind ozelligi Premium icindir. Premium ile son atlamayi geri al.',
        ctaLabel: "Premium'a gec",
        cancelLabel: 'Kapat',
      };
    case 'boost':
      return {
        title: 'Premium gerekli',
        message: 'Boost ozelligi Premium icindir. Boost etkisi yakinda aktif olacak.',
        ctaLabel: "Premium'a gec",
        cancelLabel: 'Kapat',
      };
    default:
      return {
        title: 'Premium gerekli',
        message: 'Günlük beğeni limiti doldu. Premium ile daha fazla beğeni kullan.',
        ctaLabel: "Premium'a geç",
        cancelLabel: 'Kapat',
      };
  }
};

export type AnalyticsEventName =
  | 'paywall_view'
  | 'paywall_cta_click'
  | 'entitlement_denied'
  | 'like_limit_hit'
  | 'daily_picks_view';

export type AnalyticsEvent = {
  name: AnalyticsEventName;
  source: string;
  reason?: PremiumCtaReason;
  properties?: Record<string, unknown>;
};

export async function logAnalyticsEvent(event: AnalyticsEvent): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    const response = await fetchWithAuth(`${BASE_URL}/api/analytics/events`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        ...event,
        timestamp: new Date().toISOString(),
      }),
    });
    if (!response.ok) {
      console.warn('Failed to log analytics event:', response.status);
    }
  } catch (error) {
    console.warn('Failed to log analytics event:', error);
  }
}

// --- Backend DTO Types ---
export type DreamTheme = 'HAPPY' | 'SAD' | 'NIGHTMARE' | 'LOVE' | 'LUCID' | 'ANGRY' | 'EXCITED' | 'CURIOUS';
export type MatchStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED';

export interface AuthRequest {
  email: string;
  password?: string;
  nickname?: string;
  bio?: string;
  age?: number;
  location?: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  bio?: string;
  age?: number;
  location?: string;
}

export interface UserProfileResponse {
  id: string;
  nickname: string;
  bio?: string;
  avatarUrl: string | null;
  age?: number;
  location?: string;
  dreamCount: number;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
}


export interface DreamResponse {
  id: string;
  title: string;
  description: string;
  theme: DreamTheme;
  authorId: string;
  nickname: string;
  avatarUrl: string | null;
  likeCount: number;
  commentCount: number;
  tags: string[];
  createdAt: string;
  isLiked: boolean;
  visibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
}

export type DreamInterpretPersona = 'FREUD' | 'JUNG' | 'ASTROLOG';

export interface DreamInterpretRequest {
  persona: DreamInterpretPersona;
  zodiacSign: string;
}

export interface DreamInterpretationResponse {
  id: string;
  dreamId: string;
  persona: DreamInterpretPersona;
  content: string;
  zodiacSign: string;
  createdAt: string;
}

export interface CommentResponse {
  id: string;
  content: string;
  nickname: string;
  avatarUrl: string | null;
  createdAt: string;
}

export interface UserSummary {
  id: string;
  nickname: string;
  avatarUrl: string | null;
}

export interface DreamMatchResponse {
  id: string;
  myDreamId: string;
  myDreamTitle: string;
  matchedDreamId: string;
  matchedDreamTitle: string;
  matchedDreamDescription: string;
  matchedUser: UserSummary;
  score: number;
  status: MatchStatus;
  matchedAt: string;
}

export interface DiscoverCardResponse {
  matchId: string;
  matchedUserId: string;
  matchedUserNickname: string;
  matchedUserAvatarUrl: string | null;
  matchedDreamId: string;
  matchedDreamTitle: string;
  matchedDreamDescription: string;
  similarityPercent: number;
  isHot: boolean;
  matchCount: number;
  matchedAt: string;
}

export interface DailyPicksResponse {
  picks: DiscoverCardResponse[];
  visibleCount: number;
  locked: boolean;
  hasMorePremium: boolean;
}

export interface BoostStatusResponse {
  available: boolean;
  lastActivatedAt: string | null;
  nextAvailableAt: string | null;
  cooldownHours: number;
}

export interface LikeResponse {
  likeId: string;
  dreamId: string;
  dreamTitle: string;
  relatedUserId: string;
  relatedUserNickname: string;
  relatedUserAvatarUrl: string | null;
  likedAt: string;
}

export type NotificationType = 'LIKE' | 'COMMENT' | 'MATCH_FOUND' | 'SYSTEM' | 'FOLLOW';

export interface NotificationResponse {
  id: string;
  message: string;
  relatedLink: string | null;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
}

export interface MutualMatchResponse {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  conversationId: string | null;
  matchedAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
}

export interface CreateDreamRequest {
  title: string;
  description: string;
  theme: DreamTheme;
  visibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE';
  tagNames?: string[];
}

// --- Theme Mappings ---
export const THEME_TO_TURKISH: Record<DreamTheme, string> = {
  HAPPY: 'Mutlu',
  SAD: 'Üzgün',
  NIGHTMARE: 'Kabus',
  LOVE: 'Aşk',
  LUCID: 'Lüsid',
  ANGRY: 'Kızgın',
  EXCITED: 'Heyecanlı',
  CURIOUS: 'Meraklı',
};

export const THEME_TO_ICON: Record<DreamTheme, string> = {
  HAPPY: 'sparkles',
  SAD: 'sad',
  NIGHTMARE: 'skull',
  LOVE: 'heart',
  LUCID: 'star',
  ANGRY: 'flame',
  EXCITED: 'flash',
  CURIOUS: 'help-circle',
};

// --- Utility Functions ---
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (Number.isNaN(date.getTime())) return '';

  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);

  if (diffMins < 1) return 'Şimdi';
  if (diffMins < 60) return `${diffMins} dk önce`;
  if (diffHours < 24) return `${diffHours} saat önce`;
  if (diffDays === 1) return 'Dün';
  if (diffDays < 7) return `${diffDays} gün önce`;
  if (diffWeeks < 5) return `${diffWeeks} hafta önce`;
  return date.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// --- Helper Headers Function ---
async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
}

let onUnauthorized: (() => void) | null = null;

export const setUnauthorizedCallback = (callback: () => void) => {
  onUnauthorized = callback;
  console.log('API config: Unauthorized callback is set.');
};

async function fetchWithAuth(url: string, options?: RequestInit): Promise<Response> {
  const normalizedUrl = url.replace('/api/api/', '/api/');
  const response = await fetch(normalizedUrl, options);
  if (response.status === 401 && onUnauthorized && !url.includes('/api/auth/')) {
    console.log('API Request returned 401! Triggering unauthorized callback.');
    onUnauthorized();
  }
  return response;
}

// --- API Functions ---

/**
 * Fetch community dreams (paginated) - User's Feed
 */
export async function getDreams(page: number = 0, size: number = 20): Promise<PageResponse<DreamResponse>> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/dreams?page=${page}&size=${size}`, {
    headers
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch dreams: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch Public Community Dreams
 */
export async function getPublicDreams(page: number = 0, size: number = 20): Promise<PageResponse<DreamResponse>> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/dreams/public?page=${page}&size=${size}`, {
    headers
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch public dreams: ${response.status}`);
  }
  return response.json();
}

/**
 * Fetch dreams for a specific user (paginated)
 */
export async function getUserDreams(userId: string, page: number = 0, size: number = 20): Promise<PageResponse<DreamResponse>> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/dreams/user/${userId}?page=${page}&size=${size}`, {
    headers
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch user dreams: ${response.status}`);
  }
  return response.json();
}

export async function getDreamById(id: string): Promise<DreamResponse> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/dreams/${id}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch dream: ${response.status}`);
  }
  return response.json();
}

export async function interpretDream(
  dreamId: string,
  request: DreamInterpretRequest
): Promise<DreamInterpretationResponse> {
  const token = await AsyncStorage.getItem('auth_token');
  console.log('WS-TOKEN:', token);
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/dreams/${dreamId}/interpret`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Failed to interpret dream: ${response.status}`);
  }
  return response.json();
}

/**
 * Create a new dream
 */
export async function createDream(request: CreateDreamRequest): Promise<DreamResponse> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/dreams`, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Failed to create dream: ${response.status}`);
  }
  return response.json();
}


/**
 * Register a new user
 */
export async function register(request: AuthRequest): Promise<string> {
  const response = await fetchWithAuth(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || `Failed to register: ${response.status}`);
  }
  return response.text();
}

/**
 * Login user
 */
export async function login(request: AuthRequest): Promise<string> {
  const response = await fetchWithAuth(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw buildApiError(errorText || `Failed to login: ${response.status}`, response.status);
  }
  return response.text();
}

/**
 * Get current user profile
 */
export async function getMyProfile(): Promise<UserProfileResponse> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/users/me`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch my profile: ${response.status}`);
  }
  return response.json();
}

/**
 * Get another user's profile
 */
export async function getUserProfile(userId: string): Promise<UserProfileResponse> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/users/${userId}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch user profile: ${response.status}`);
  }
  return response.json();
}

/**
 * Update current user profile
 */
export async function updateProfile(request: UpdateProfileRequest): Promise<UserProfileResponse> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/users/me`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(request),
  });
  if (!response.ok) {
    throw new Error(`Failed to update profile: ${response.status}`);
  }
  return response.json();
}

/**
 * Follow/Unfollow user
 */
export async function followUser(userId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/users/${userId}/follow`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to follow user: ${response.status}`);
  }
}

// ── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications(): Promise<NotificationResponse[]> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/notifications`, { headers });
  if (!response.ok) {
    throw new Error(`Failed to fetch notifications: ${response.status}`);
  }
  return response.json();
}

export async function markAllNotificationsRead(): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/notifications/read-all`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to mark notifications as read: ${response.status}`);
  }
}

/**
 * Toggle like for a dream
 */
export async function toggleLike(dreamId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/interactions/like/${dreamId}`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to toggle like: ${response.status}`);
  }
}

/**
 * Add comment to a dream
 */
export async function getComments(dreamId: string): Promise<CommentResponse[]> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/interactions/comments/${dreamId}`, {
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch comments: ${response.status}`);
  }
  return response.json();
}

/**
 * Add comment to a dream
 */
export async function addComment(dreamId: string, content: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/interactions/comment/${dreamId}`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content }),
  });
  if (!response.ok) {
    throw new Error(`Failed to add comment: ${response.status}`);
  }
}

/**
 * Delete a dream by ID
 */
export async function deleteDream(dreamId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/dreams/${dreamId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) {
    throw new Error(`Failed to delete dream: ${response.status}`);
  }
}

/**
 * Update dream visibility
 */
export async function updateDreamVisibility(
  dreamId: string,
  visibility: 'PUBLIC' | 'FOLLOWERS_ONLY' | 'PRIVATE'
): Promise<DreamResponse> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(
    `${BASE_URL}/api/dreams/${dreamId}/visibility?visibility=${visibility}`,
    { method: 'PATCH', headers }
  );
  if (!response.ok) {
    throw new Error(`Failed to update visibility: ${response.status}`);
  }
  return response.json();
}

// ── Discover & Matching ──────────────────────────────────────────────────────

export async function getDiscoverFeed(): Promise<DiscoverCardResponse[]> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/matches/discover`, { headers });
  if (!response.ok) throw new Error(`Failed to fetch discover feed: ${response.status}`);
  return response.json();
}

export async function getDailyPicks(): Promise<DailyPicksResponse> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/matches/daily-picks`, { headers });
  if (!response.ok) throw new Error(`Failed to fetch daily picks: ${response.status}`);
  return response.json();
}

export async function getBoostStatus(): Promise<BoostStatusResponse> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/boosts/status`, { headers });
  if (!response.ok) throw buildApiError(`Failed to fetch boost status: ${response.status}`, response.status);
  return response.json();
}

export async function requestBoost(): Promise<BoostStatusResponse> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/boosts/activate`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) throw buildApiError(`Failed to activate boost: ${response.status}`, response.status);
  return response.json();
}

export async function requestRewind(): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/matches/rewind`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) throw buildApiError(`Failed to rewind: ${response.status}`, response.status);
}

export async function getMyLikes(): Promise<LikeResponse[]> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/matches/my-likes`, { headers });
  if (!response.ok) throw new Error(`Failed to fetch my likes: ${response.status}`);
  return response.json();
}

export async function getLikedMe(): Promise<LikeResponse[]> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/matches/liked-me`, { headers });
  if (!response.ok) throw buildApiError(`Failed to fetch liked me: ${response.status}`, response.status);
  return response.json();
}

export async function getMutualMatches(): Promise<MutualMatchResponse[]> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/matches/mutual`, { headers });
  if (!response.ok) throw new Error(`Failed to fetch mutual matches: ${response.status}`);
  return response.json();
}

export async function likeDream(dreamId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/likes/${dreamId}`, {
    method: 'POST',
    headers,
  });
  if (!response.ok) throw buildApiError(`Failed to like dream: ${response.status}`, response.status);
}

export async function unlikeDream(dreamId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/likes/${dreamId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error(`Failed to unlike dream: ${response.status}`);
}
// ── Chat System ──────────────────────────────────────────────────────────────

export interface ConversationResponse {
  id: string;
  otherUser: UserSummary;
  lastMessage: string;
  lastMessageAt: string | null;
}

export interface MessageResponse {
  id: string;
  senderId: string;
  content: string;
  sentAt: string;
  isRead: boolean;
}

export interface SendMessageRequest {
  content: string;
}

export async function getMyConversations(): Promise<ConversationResponse[]> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/chat/conversations`, { headers });
  if (!response.ok) throw new Error(`Failed to fetch conversations: ${response.status}`);
  return response.json();
}

export async function getMessages(conversationId: string): Promise<MessageResponse[]> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/chat/${conversationId}/messages`, { headers });
  if (!response.ok) throw new Error(`Failed to fetch messages: ${response.status}`);
  return response.json();
}

export async function sendMessage(conversationId: string, content: string): Promise<MessageResponse> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/chat/${conversationId}/send`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ content }),
  });
  if (!response.ok) throw new Error(`Failed to send message: ${response.status}`);
  return response.json();
}

export async function deleteConversation(conversationId: string): Promise<void> {
  const headers = await getAuthHeaders();
  const response = await fetchWithAuth(`${BASE_URL}/api/chat/${conversationId}`, {
    method: 'DELETE',
    headers,
  });
  if (!response.ok) throw new Error(`Failed to delete conversation: ${response.status}`);
}
