import { initializeApp, getApps } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc, 
  getDocFromServer, 
  collection, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where 
} from 'firebase/firestore';
import firebaseAppletConfig from '@/firebase-applet-config.json';

const rawConfig: Record<string, any> = (firebaseAppletConfig && typeof firebaseAppletConfig === 'object') ? firebaseAppletConfig : {};

const safeConfig = {
  projectId: rawConfig.projectId,
  appId: rawConfig.appId,
  apiKey: rawConfig.apiKey,
  authDomain: rawConfig.authDomain,
  firestoreDatabaseId: rawConfig.firestoreDatabaseId || '(default)',
  storageBucket: rawConfig.storageBucket,
  messagingSenderId: rawConfig.messagingSenderId,
};

let app;
try {
  app = getApps().length === 0 ? initializeApp(safeConfig) : getApps()[0];
} catch (e) {
  console.warn("Firebase initializeApp warning, using fallback app:", e);
  throw e;
}

let firestoreInstance;
try {
  firestoreInstance = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  }, safeConfig.firestoreDatabaseId || '(default)');
} catch (e) {
  // Reuse an already-created Firestore instance during hot reloads, or fall
  // back to the regular client when this browser cannot enable IndexedDB.
  try {
    firestoreInstance = getFirestore(app, safeConfig.firestoreDatabaseId || '(default)');
  } catch {
    firestoreInstance = getFirestore(app);
  }
}

export const db = firestoreInstance;
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.debug('Firestore Notice:', JSON.stringify(errInfo));
  return errInfo;
}

export async function testFirestoreConnection() {
  try {
    if (!safeConfig.apiKey || safeConfig.apiKey === 'demo-api-key' || safeConfig.projectId === 'demo-project') {
      return;
    }
    const checkPromise = getDocFromServer(doc(db, 'test', 'connection'));
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 3000));
    await Promise.race([checkPromise, timeoutPromise]);
  } catch {
    // Quietly fallback to local cache / local-first mode
  }
}
