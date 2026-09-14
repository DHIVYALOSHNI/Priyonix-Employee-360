import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'fourth-trees-dnm9t',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'fourth-trees-dnm9t.firebaseapp.com',
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:695719765999:web:f21ef572c3986b0713781a',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'fourth-trees-dnm9t.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '695719765999',
};

export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth: Auth = getAuth(app);

// Use the specific firestoreDatabaseId if provisioned, or default database
const databaseId = import.meta.env.VITE_FIRESTORE_DATABASE_ID;

export const db: Firestore = databaseId && databaseId !== '(default)'
  ? getFirestore(app, databaseId)
  : getFirestore(app);

export const FIRESTORE_DATABASE_ID = databaseId || '(default)';

// Temporary SAFE diagnostic that displays/logs ONLY: projectId, authDomain, appId (NEVER the API key)
export const firebaseDiagnostic = {
  projectId: firebaseConfig.projectId,
  authDomain: firebaseConfig.authDomain,
  appId: firebaseConfig.appId,
};

console.info('[Firebase Diagnostic] Runtime Config:', firebaseDiagnostic);

