import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || (window as any).ENV?.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || (window as any).ENV?.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || (window as any).ENV?.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || (window as any).ENV?.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || (window as any).ENV?.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID || (window as any).ENV?.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || (window as any).ENV?.VITE_FIREBASE_MEASUREMENT_ID
};

if (firebaseConfig.apiKey === "YOUR_API_KEY") {
    console.warn("[Firebase] Warning: Using placeholder API key. Login might fail.");
} else {
    console.log("[Firebase] Initialized with config:", {
        authDomain: firebaseConfig.authDomain,
        storageBucket: firebaseConfig.storageBucket,
        projectId: firebaseConfig.projectId
    });
}

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const provider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
    try {
        const result = await signInWithPopup(auth, provider);
        return result.user;
    } catch (error) {
        console.error("Firebase Login Error", error);
        throw error;
    }
};

export const logout = async () => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error("Firebase Logout Error", error);
    }
};
