export type DaftraPublicStatus = {
  butcherId: string;
  status: 'NOT_CONFIGURED' | 'CONNECTED' | 'CONNECTION_FAILED' | 'DISABLED';
  accountIdentifier: string | null;
  apiKeyMasked: string | null;
  lastConnectionTestAt: string | null;
  lastConnectionError: string | null;
  daftraLoginEmail: string | null;
  daftraLoginUrl: string | null;
  configured: boolean;
};

export type ConfigureDaftraInput = {
  accountIdentifier: string;
  apiKey?: string;
  daftraLoginEmail?: string | null;
  daftraLoginUrl?: string | null;
};

export type TestDaftraInput = {
  sendInvite?: boolean;
  invitePassword?: string;
};

export type DaftraConnectionPayload = {
  connected: boolean;
  reason?: string;
  messageAr: string;
};

export type LinkDaftraProductInput = {
  daftraProductId: number;
  sarhProductId?: string | null;
};
