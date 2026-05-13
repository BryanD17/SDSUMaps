import { initializeApp, getApps, getApp, type FirebaseOptions } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';

const requiredEnvKeys = [
  'EXPO_PUBLIC_FIREBASE_API_KEY',
  'EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'EXPO_PUBLIC_FIREBASE_PROJECT_ID',
  'EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'EXPO_PUBLIC_FIREBASE_APP_ID',
] as const;

const missing = requiredEnvKeys.filter((k) => !process.env[k]);

export const firebaseReady: boolean = missing.length === 0;

function unconfiguredProxy<T extends object>(name: string): T {
  return new Proxy({} as T, {
    get: () => {
      throw new Error(
        `Firebase ${name} not configured. Missing env vars: ${missing.join(', ')}. ` +
          `Copy .env.example to .env and fill in values from the Firebase console.`,
      );
    },
  });
}

let db: Firestore;
let auth: Auth;

if (firebaseReady) {
  const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
} else {
  console.warn(
    `Firebase not configured (missing: ${missing.join(', ')}). Running in mock-data mode.`,
  );
  db = unconfiguredProxy<Firestore>('Firestore');
  auth = unconfiguredProxy<Auth>('Auth');
}

export { db, auth };
