// Blocking/User Moderation Types

export interface BlockedUser {
  id: string;
  nickname: string;
  avatarUrl: string | null;
  blockedAt: string;
}

export interface BlockActionPayload {
  targetUserId: string;
}

export interface BlockActionResult {
  success: boolean;
  message: string;
}

export interface BlockListResponse {
  blockedUsers: BlockedUser[];
  totalCount: number;
}

// Reporting Types
export type ReportReason =
  | 'INAPPROPRIATE_CONTENT'
  | 'HARASSMENT'
  | 'SPAM'
  | 'FAKE_PROFILE'
  | 'EXPLICIT_CONTENT'
  | 'OTHER';

export interface SubmitReportPayload {
  targetDreamId?: string;
  targetUserId?: string;
  reason: ReportReason;
  description?: string;
}

export interface SubmitReportResult {
  success: boolean;
  reportId?: string;
  message: string;
}
