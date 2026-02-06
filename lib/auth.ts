// Authentication utilities for admin
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseAuth, firestore } from './firebase';
import { COLLECTIONS } from './constants';
import type { AdminUser } from '@/types';

// Sign in with email and password
export async function signIn(email: string, password: string): Promise<User> {
  const result = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return result.user;
}

// Sign out
export async function signOut(): Promise<void> {
  await firebaseSignOut(firebaseAuth);
}

// Get current user
export function getCurrentUser(): User | null {
  return firebaseAuth.currentUser;
}

// Subscribe to auth state changes
export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(firebaseAuth, callback);
}

// Check if user is admin
export async function isAdmin(uid: string): Promise<boolean> {
  const docRef = doc(firestore, COLLECTIONS.ADMIN_USERS, uid);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() && ['admin', 'data-entry'].includes(docSnap.data()?.role);
}

// Get admin user details
export async function getAdminUser(uid: string): Promise<AdminUser | null> {
  const docRef = doc(firestore, COLLECTIONS.ADMIN_USERS, uid);
  const docSnap = await getDoc(docRef);
  
  if (!docSnap.exists()) return null;
  
  const data = docSnap.data();
  return {
    uid: docSnap.id,
    email: data.email,
    displayName: data.displayName,
    role: data.role,
    assignedDivisions: data.assignedDivisions,
    createdAt: data.createdAt?.toDate() || new Date(),
  };
}
