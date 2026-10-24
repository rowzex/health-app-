import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Passwordless sign-in with Supabase: the user types their email, gets a 6-digit code,
 * and types it back. The URL and publishable key are meant to ship inside the app;
 * a .env.local file can point the app at another project.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://fdpekzhnwebzxjwjvjfy.supabase.co';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_y8z7V9G13yvXQl_qCa8yfw_X7QwlRnA';

/** `guest` = "Skip for now": data stays on the phone until they create an account. */
export type Account = { name: string; email: string; mode: 'guest' | 'cloud'; userId?: string };

export const GUEST: Account = { name: '', email: '', mode: 'guest' };

/** Error codes match the 'ob.*' strings in i18n. */
export class AuthError extends Error {
  constructor(public code: 'badCode' | 'tooMany' | 'offline' | 'sendFailed') {
    super(code);
  }
}

const SESSION = 'supabase-session';

export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

async function call(path: string, body: object) {
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('offline');
  }
  if (res.status === 429) throw new AuthError('tooMany');
  return { ok: res.ok, json: await res.json().catch(() => ({})) };
}

/** Emails a 6-digit code. Creates the account the first time an email is used. */
export async function sendCode(email: string, name: string): Promise<void> {
  const { ok } = await call('otp', { email: email.trim().toLowerCase(), create_user: true, data: name.trim() ? { name: name.trim() } : {} });
  if (!ok) throw new AuthError('sendFailed');
}

export async function verifyCode(email: string, code: string, name: string): Promise<Account> {
  email = email.trim().toLowerCase();
  const { ok, json } = await call('verify', { type: 'email', email, token: code.trim() });
  if (!ok || !json.access_token) throw new AuthError('badCode');
  if (Platform.OS !== 'web')
    await SecureStore.setItemAsync(SESSION, JSON.stringify({ access: json.access_token, refresh: json.refresh_token })).catch(() => {});
  const saved = json.user?.user_metadata?.name as string | undefined;
  return { name: name.trim() || saved || email.split('@')[0], email, mode: 'cloud', userId: json.user?.id };
}

export async function signOut() {
  if (Platform.OS !== 'web') await SecureStore.deleteItemAsync(SESSION).catch(() => {});
}
