// src/contexts/AuthContext.js

import React, { useState, useEffect, useContext, createContext } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase.config'; // 경로 확인 필요

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // 1단계: Firebase 인증 시스템의 순수한 사용자 상태
    const [firebaseUser, setFirebaseUser] = useState(null);
    // 2단계: Firestore DB에서 가져온 상세 정보가 포함된 최종 사용자 상태
    const [currentUser, setCurrentUser] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [adminSelectedCity, setAdminSelectedCity] = useState(null);

    // [1단계] Firebase의 인증 상태 변경만 감지합니다.
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // 토큰을 강제 갱신하여 최신 권한을 확보합니다.
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

    // [2단계] 1단계에서 인증된 사용자가 있을 때만, Firestore DB를 감시합니다.
    useEffect(() => {
        // firebaseUser가 null이면 아무것도 하지 않습니다.
        if (firebaseUser) {
            const userRef = doc(db, 'users', firebaseUser.uid);
            const unsubscribe = onSnapshot(userRef, (userSnap) => {
                // Firestore에서 가져온 상세 정보와 인증 정보를 결합합니다.
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
                // 오류 발생 시에도 기본 인증 정보는 유지합니다.
                setCurrentUser({ ...firebaseUser, isFirestoreDataLoaded: false });
                setLoading(false);
            });
            return () => unsubscribe();
        }
    }, [firebaseUser]); // firebaseUser가 변경될 때만 이 로직이 실행됩니다.

    const value = { currentUser, loading, adminSelectedCity, setAdminSelectedCity };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);