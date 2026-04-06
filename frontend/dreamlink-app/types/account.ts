export interface DeleteAccountPayload {
  confirmPassword: string;
}

export interface DeleteAccountState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

export interface DeleteAccountResult {
  success: boolean;
  message: string;
}
