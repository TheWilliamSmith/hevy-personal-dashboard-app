export interface AuthUser {
  id: string;
  email: string;
  username: string;
  displayName: string;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  tokenType: 'Bearer';
  expiresAt: string;
  user: AuthUser;
}
