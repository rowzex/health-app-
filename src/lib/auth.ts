import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Email sign-up. When EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set
 * (in a .env file), accounts live on Supabase and work across phones. Without them the
 * account is kept on this phone only, which is enough to try the app.
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
export const CLOUD_AUTH = !!(SUPABASE_URL && SUPABASE_KEY);

export type Account = { name: string; email: string; mode: 'local' | 'cloud'; userId?: string; passHash?: string };

/** Error codes match the 'ob.*' strings in i18n. */
export class AuthError extends Error {
  constructor(public code: 'wrong' | 'exists' | 'confirm' | 'offline' | 'noLocal') {
    super(code);
  }
}

const SESSION = 'supabase-session';
const isWeb = Platform.OS === 'web';

async function hash(email: string, password: string) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `fuel-and-form|${email}|${password}`);
}

export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());

async function supabase(path: string, body: object) {
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY!, 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('offline');
  }
  const json = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, json };
}

async function keepSession(json: { access_token?: string; refresh_token?: string }) {
  if (json.access_token && !isWeb)
    await SecureStore.setItemAsync(SESSION, JSON.stringify({ access: json.access_token, refresh: json.refresh_token }));
}

export async function signUp(name: string, email: string, password: string, existing?: Account): Promise<Account> {
  email = email.trim().toLowerCase();
  if (!CLOUD_AUTH) {
    if (existing && existing.email === email) throw new AuthError('exists');
    return { name: name.trim(), email, mode: 'local', passHash: await hash(email, password) };
  }
  const { ok, json } = await supabase('signup', { email, password, data: { name: name.trim() } });
  if (!ok) throw new AuthError(/already|registered|exists/i.test(JSON.stringify(json)) ? 'exists' : 'wrong');
  if (!json.access_token) throw new AuthError('confirm'); // email confirmation is switched on in Supabase
  await keepSession(json);
  return { name: name.trim(), email, mode: 'cloud', userId: json.user?.id };
}

export async function logIn(email: string, password: string, existing?: Account): Promise<Account> {
  email = email.trim().toLowerCase();
  if (!CLOUD_AUTH) {
    if (!existing || existing.email !== email) throw new AuthError('noLocal');
    if (existing.passHash !== (await hash(email, password))) throw new AuthError('wrong');
    return existing;
  }
  const { ok, json } = await supabase('token?grant_type=password', { email, password });
  if (!ok) throw new AuthError('wrong');
  await keepSession(json);
  return { name: json.user?.user_metadata?.name ?? email.split('@')[0], email, mode: 'cloud', userId: json.user?.id };
}

export async function signOut() {
  if (!isWeb) await SecureStore.deleteItemAsync(SESSION).catch(() => {});
}
