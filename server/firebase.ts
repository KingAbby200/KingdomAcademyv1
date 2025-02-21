import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

const firebaseConfig = {
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  clientEmail: process.env.VITE_FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

const app = initializeApp({
  credential: cert(firebaseConfig),
  storageBucket: `${firebaseConfig.projectId}.appspot.com`
});

export const storage = getStorage(app);
