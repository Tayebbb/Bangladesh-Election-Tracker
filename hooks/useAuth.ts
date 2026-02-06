'use client';

// Authentication hook for admin panel

import { useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { signIn, signOut, onAuthChange, isAdmin, getAdminUser } from '@/lib/auth';
import type { AdminUser } from '@/types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setLoading(true);
      setError(null);

      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Check if user is admin
        const isAdminUser = await isAdmin(firebaseUser.uid);
        if (isAdminUser) {
          const admin = await getAdminUser(firebaseUser.uid);
          setAdminUser(admin);
        } else {
          setError('You do not have admin access');
          await signOut();
          setUser(null);
          setAdminUser(null);
        }
      } else {
        setUser(null);
        setAdminUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
      throw err;
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    adminUser,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user && !!adminUser,
  };
}
