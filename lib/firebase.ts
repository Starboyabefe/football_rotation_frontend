// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyBLMF6xEAjoLyhP72GlObn1Cl3sknPQL_I",
  authDomain: "street-football-tracker.firebaseapp.com",
  projectId: "street-football-tracker",
  storageBucket: "street-football-tracker.firebasestorage.app",
  messagingSenderId: "380156243249",
  appId: "1:380156243249:web:013a30404d12f30a145410"
}

// Prevent re-initializing on hot reload
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)
export const db = getFirestore(app)