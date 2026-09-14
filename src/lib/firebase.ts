import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  Firestore, 
  doc, 
  getDocFromServer 
} from 'firebase/firestore';
import configJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || configJson.projectId,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || configJson.authDomain,
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || configJson.apiKey,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || configJson.appId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || configJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || configJson.messagingSenderId,
};

export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);

// Use the specific firestoreDatabaseId if provisioned, or default database
const databaseId = import.meta.env.VITE_FIRESTORE_DATABASE_ID || configJson.firestoreDatabaseId;

function initOptimizedFirestore(): Firestore {
  try {
    const cacheSettings = {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
      experimentalAutoDetectLongPolling: true,
    };
    if (databaseId && databaseId !== '(default)') {
      return initializeFirestore(app, cacheSettings, databaseId);
    }
    return initializeFirestore(app, cacheSettings);
  } catch {
    return databaseId && databaseId !== '(default)'
      ? getFirestore(app, databaseId)
      : getFirestore(app);
  }
}

export const db: Firestore = initOptimizedFirestore();

export const FIRESTORE_DATABASE_ID = databaseId || '(default)';

// Test connection on initial boot as required by Firebase skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error: any) {
    const msg = error?.message || '';
    const code = error?.code || '';
    if (msg.includes('the client is offline') || msg.includes('unavailable') || code === 'unavailable') {
      console.info('[Firebase] Firestore initialized in offline-first mode. Real-time synchronizer will reconnect seamlessly.');
    } else {
      console.warn('[Firebase] Connection diagnostic notice:', msg || error);
    }
  }
}
testConnection();

// Temporary SAFE diagnostic that displays/logs ONLY: projectId, authDomain, appId (NEVER the API key)
export const firebaseDiagnostic = {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  appId: firebaseConfig.appId,
  firestoreDatabaseId: FIRESTORE_DATABASE_ID,
};

console.info('[Firebase Diagnostic] Runtime Config:', firebaseDiagnostic);

