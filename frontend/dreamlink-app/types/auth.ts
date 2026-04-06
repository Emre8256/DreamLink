export interface RegisterRequest {
  email: string;
  password: string;
  nickname: string;
  bio?: string;
  age: number;
  location?: string;
  eulaAccepted: boolean;
  eulaAcceptedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}
