'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';

interface User extends Omit<FirebaseUser, 'photoURL'> {
  photoURL?: string | null;
  region?: string;
  city?: string;
  town?: string;
  bio?: string;
  role?: string;
  isAdmin?: boolean;
  isFirestoreDataLoaded?: boolean;
  likedNews?: string[];
  following?: string[];
  followers?: string[];
  createdAt?: any;
}

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  adminSelectedCity: string | null;
  setAdminSelectedCity: (city: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [adminSelectedCity, setAdminSelectedCity] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userUnsubscribe = onSnapshot(userRef, (userSnap) => {
          let finalUser: User = { ...user, isFirestoreDataLoaded: true };
          if (userSnap.exists()) {
            finalUser = { ...finalUser, ...userSnap.data() };
          }
          finalUser.isAdmin = finalUser.role === 'admin';
          if (finalUser.photoURL?.startsWith('http://')) {
            finalUser.photoURL = finalUser.photoURL.replace('http://', 'https://');
          }
          setCurrentUser(finalUser);
          setLoading(false);
        }, (error) => {
          console.error("User doc snapshot error:", error);
          setCurrentUser({ ...user, isFirestoreDataLoaded: true });
          setLoading(false);
        });
        return () => userUnsubscribe();
      } else {
        setCurrentUser(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const value = { currentUser, loading, adminSelectedCity, setAdminSelectedCity };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 