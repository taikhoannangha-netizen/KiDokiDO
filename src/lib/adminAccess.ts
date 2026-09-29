import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const ADMIN_EMAILS = [
  'caoquocbaozx4@gmail.com',
  'taikhoannangha@gmail.com'
];
export const ADMIN_EMAIL = 'caoquocbaozx4@gmail.com';

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.trim().toLowerCase());
}

/** Owner allowlist plus server claim or Firestore admin role. Never trusts an unverified email. */
export async function isTrustedAdmin(user: User | null): Promise<boolean> {
  if (!user || !user.emailVerified || !user.email) return false;
  const email = user.email.trim().toLowerCase();
  if (ADMIN_EMAILS.includes(email)) return true;

  const idToken = await user.getIdTokenResult(true).catch(() => null);
  if (idToken?.claims.admin === true) return true;

  // Check Firestore user documents for role === 'admin'
  try {
    const docSnap1 = await getDoc(doc(db, 'users', `google:${user.uid}`)).catch(() => null);
    if (docSnap1?.exists() && docSnap1.data()?.role === 'admin') return true;

    const docSnap2 = await getDoc(doc(db, 'users', user.uid)).catch(() => null);
    if (docSnap2?.exists() && docSnap2.data()?.role === 'admin') return true;
  } catch (err) {
    console.warn('Cannot check admin role from Firestore doc:', err);
  }

  return false;
}
