// src/contexts/AuthContext.js

import React, { useState, useEffect, useContext, createContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [firebaseUser, setFirebaseUser] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adminSelectedCity, setAdminSelectedCity] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await user.getIdToken(true);
                setFirebaseUser(user);
            } else {
                setFirebaseUser(null);
                setCurrentUser(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (firebaseUser) {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const unsubscribe = onSnapshot(userRef, (userSnap) => {
                const fullUserData = {
                    ...firebaseUser,
                    ...userSnap.data(),
                    isAdmin: userSnap.data()?.role === 'admin',
                    isFirestoreDataLoaded: true,
                };
                setCurrentUser(fullUserData);
                setLoading(false);
            }, (error) => {
                console.error("Firestore snapshot listener error:", error);
                setCurrentUser({ ...firebaseUser, isFirestoreDataLoaded: false });
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [firebaseUser]);

    const value = { currentUser, loading, adminSelectedCity, setAdminSelectedCity };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);