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
    // 관리자 지역 선택을 위한 상태 추가
    const [adminSelectedCity, setAdminSelectedCity] = useState(null);

    useEffect(() => {
        // onAuthStateChanged 콜백 함수를 async로 변경합니다.
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // [핵심 코드 추가] 사용자가 감지될 때마다 인증 토큰을 강제로 새로고침합니다.
                // 이렇게 하면 항상 최신 권한을 가지게 됩니다.
                await user.getIdToken(true);

                if (!db) {
                    console.error("Firestore가 초기화되지 않았습니다.");
                    setCurrentUser({ ...user, isFirestoreDataLoaded: true });
                    setLoading(false);
                    return;
                }
                
                const userRef = doc(db, "users", user.uid);
                const userUnsubscribe = onSnapshot(userRef, (userSnap) => {
                    let finalUser = { ...user, isFirestoreDataLoaded: true };
                    if (userSnap.exists()) {
                        finalUser = { ...finalUser, ...userSnap.data() };
                    }
                    
                    if (!finalUser.isAdmin) {
                        finalUser.isAdmin = finalUser.role === 'admin';
                    }
                    
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

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};