// src/contexts/AuthContext.js

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AuthContext = createContext();

export const useAuth = () => {
    return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userUnsubscribe = onSnapshot(userRef, (userSnap) => {
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        const finalUser = { ...user, ...userData, photoURL: userData.photoURL || user.photoURL };
                        setCurrentUser(finalUser);
                    } else {
                        setCurrentUser(user);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("User doc snapshot error:", error);
                    setCurrentUser(user);
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

    const value = { currentUser, loading };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};