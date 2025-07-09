// --- START OF FILE App.js ---

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    signOut,
    updateProfile,
    OAuthProvider,
    signInWithPopup
} from 'firebase/auth';
import {
    getFirestore,
    collection,
    addDoc,
    query,
    onSnapshot,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    increment,
    arrayUnion,
    arrayRemove,
    Timestamp,
    where,
    orderBy,
    limit,
    deleteDoc,
    getDocs,
    writeBatch
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import { Home, Newspaper, LayoutGrid, Users, TicketPercent, ArrowLeft, Heart, MessageCircle, Send, PlusCircle, ChevronLeft, ChevronRight, X, Search, Bell, Star, Pencil, LogOut, Edit, MessageSquare, Trash2, ImageUp, UserCircle, Lock, Edit2 } from 'lucide-react';

// 서비스 로직 import
import { fetchRegions, fetchCities } from './services/region.service';

// 관리자 UID 지정
const ADMIN_UID = 'mPEyGZqS1ZQmw381AYKi1Kd6epH2';

// Firebase 설정
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_FIREBASE_APP_ID,
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// =================================================================
// ▼▼▼ 인증 Context ▼▼▼
// =================================================================
// App.js 상단의 AuthProvider 컴포넌트를 찾아서 수정합니다.

const AuthContext = createContext();

// App.js에서 AuthProvider를 이 코드로 교체하세요.

const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [adminSelectedCity, setAdminSelectedCity] = useState(null); 

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userUnsubscribe = onSnapshot(userRef, (userSnap) => {
                    let finalUser = { ...user };
                    // ★★★ 수정: isFirestoreDataLoaded 플래그 추가

  			if (finalUser.photoURL && finalUser.photoURL.startsWith('http://')) {
                 	   finalUser.photoURL = finalUser.photoURL.replace('http://', 'https://');
              	  }
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        finalUser = { ...user, ...userData, photoURL: userData.photoURL || user.photoURL, isFirestoreDataLoaded: true };
                    } else {
                        // Firestore 문서가 없어도 로드 시도는 끝났음을 표시
                        finalUser.isFirestoreDataLoaded = true;
                    }
                    finalUser.isAdmin = user.uid === ADMIN_UID;
                    setCurrentUser(finalUser);
                    setLoading(false);
                }, (error) => {
                    console.error("User doc snapshot error:", error);
                    const finalUser = { ...user, isAdmin: user.uid === ADMIN_UID, isFirestoreDataLoaded: true };
                    setCurrentUser(finalUser);
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

const useAuth = () => {
    return useContext(AuthContext);
};


// =================================================================
// ▼▼▼ 로고, 헬퍼, 공용 컴포넌트 ▼▼▼
// =================================================================
const Logo = ({ size = 28 }) => (
    <img src="https://lh3.googleusercontent.com/d/1gkkNelRAltEEfKv9V4aOScws7MS28IUn" alt="Logo" width={size} height={size} style={{ objectFit: 'contain' }}/>
);

const categoryStyles = {
    '일상': { text: 'text-purple-600', bg: 'bg-purple-100', bgStrong: 'bg-purple-500' },
    '친목': { text: 'text-pink-600', bg: 'bg-pink-100', bgStrong: 'bg-pink-500' },
    '10대': { text: 'text-cyan-600', bg: 'bg-cyan-100', bgStrong: 'bg-cyan-500' },
    '청년': { text: 'text-indigo-600', bg: 'bg-indigo-100', bgStrong: 'bg-indigo-500' },
    '중년': { text: 'text-yellow-600', bg: 'bg-yellow-100', bgStrong: 'bg-yellow-500' },
    '마을맘': { text: 'text-teal-600', bg: 'bg-teal-100', bgStrong: 'bg-teal-500' },
    '질문': { text: 'text-blue-600', bg: 'bg-blue-100', bgStrong: 'bg-blue-500' },
    '기타': { text: 'text-gray-600', bg: 'bg-gray-100', bgStrong: 'bg-gray-500' }
};

const getCategoryStyle = (category, city = '') => {
    const dynamicCategoryName = `${city}맘`;
    if (category === dynamicCategoryName) {
        return categoryStyles['마을맘'];
    }
    return categoryStyles[category] || categoryStyles['기타'];
};

const timeSince = (date) => {
    if (!date || typeof date.toDate !== 'function') return '';
    const jsDate = date.toDate();
    const seconds = Math.floor((new Date() - jsDate) / 1000);
    if (seconds < 60) return `방금 전`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    return jsDate.toLocaleDateString('ko-KR');
};

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
                    <div className="w-6"></div>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-full pt-20">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00462A]"></div>
    </div>
);

const NewsCard = ({ news, isAdmin, openDetailModal, handleDeleteNews, handleLikeNews, isLiked }) => {
    const navigate = useNavigate();
    return (
        <div className="flex-shrink-0 w-full rounded-xl shadow-lg overflow-hidden group bg-gray-200 flex flex-col relative">
            {news.imageUrl && <img src={news.imageUrl} alt={news.title} className="w-full h-48 object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/eeeeee/333333?text=Image' }} />}
            {isAdmin && (
                <div className="absolute top-2 left-2 flex gap-2 z-10">
                    <button onClick={(e) => { e.stopPropagation(); navigate(`/news/edit/${news.id}`, { state: { itemToEdit: news } }); }} className="bg-white/70 p-1.5 rounded-full text-blue-600 shadow"><Pencil size={20} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteNews(news.id, news.imagePath); }} className="bg-white/70 p-1.5 rounded-full text-red-600 shadow"><Trash2 size={20} /></button>
                </div>
            )}
             <button onClick={(e) => { e.stopPropagation(); handleLikeNews(news); }} className="absolute top-2 right-2 bg-white/70 p-1.5 rounded-full">
                <Heart size={20} className={isLiked ? "text-red-500 fill-current" : "text-gray-500"} />
            </button>
            <div className="p-3 bg-white flex-grow"><h3 className="font-bold truncate">{news.title}</h3></div>
            <div className="grid grid-cols-2 gap-px bg-gray-200">
                <button onClick={() => openDetailModal(news)} className="bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">자세히 보기</button>
                {news.applyUrl ? (
                    <a href={news.applyUrl} target="_blank" rel="noopener noreferrer" className="bg-white py-2 text-sm font-semibold text-center text-blue-600 hover:bg-blue-50 flex items-center justify-center">
                        신청하기
                    </a>
                ) : (
                    <button className="bg-white py-2 text-sm font-semibold text-gray-400 cursor-not-allowed" disabled>신청하기</button>
                )}
            </div>
        </div>
    );
};

const Calendar = ({events = {}, onDateClick = () => {}}) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const daysOfWeek = ['일', '월', '화', '수', '목', '금', '토'];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
    const dates = [];
    for (let i = 0; i < firstDayOfMonth; i++) dates.push(<div key={`empty-${i}`} className="p-2"></div>);
    for (let i = 1; i <= lastDateOfMonth; i++) {
        const d = new Date(year, month, i);
        const isToday = d.toDateString() === new Date().toDateString();
        const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const hasEvent = events[dateString] && events[dateString].length > 0;
        dates.push(
            <div key={i} className="relative py-1 text-center text-sm cursor-pointer" onClick={() => onDateClick(dateString)}>
                <span className={`w-7 h-7 flex items-center justify-center rounded-full mx-auto ${isToday ? 'bg-[#00462A] text-white font-bold' : ''} ${d.getDay() === 0 ? 'text-red-500' : ''} ${d.getDay() === 6 ? 'text-blue-500' : ''}`}>{i}</span>
                {hasEvent && <div className={`absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-red-500`}></div>}
            </div>
        );
    }
    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
    return (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
                <button onClick={prevMonth} className="p-1 rounded-full hover:bg-gray-100"><ChevronLeft size={20} /></button>
                <h3 className="text-md font-bold">{`${year}년 ${month + 1}월`}</h3>
                <button onClick={nextMonth} className="p-1 rounded-full hover:bg-gray-100"><ChevronRight size={20} /></button>
            </div>
            <div className="grid grid-cols-7 text-center text-sm">{daysOfWeek.map((day, i) => (<div key={day} className={`font-bold mb-2 ${i === 0 ? 'text-red-500' : ''} ${i === 6 ? 'text-blue-500' : ''}`}>{day}</div>))}{dates}</div>
        </div>
    );
};


// =================================================================
// ▼▼▼ 페이지 컴포넌트들 ▼▼▼
// =================================================================

// App.js 파일에서 기존 StartPage 컴포넌트를 이 코드로 완전히 교체하세요.

const StartPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleKakaoLogin = async () => {
        setLoading(true);
        setError('');
        try {
            const provider = new OAuthProvider('oidc.kakao.com');
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, provider);
        } catch (error) {
            console.error("Kakao Login Error:", error);
            if (error.code !== 'auth/popup-closed-by-user') {
                 setError("카카오톡 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-green-50 p-4">
            {/* ★★★ 이 부분이 수정되었습니다 ★★★ */}
            <div className="text-center mb-8 flex flex-col items-center">
                <Logo size={80} />
                <h1 className="text-3xl font-bold text-gray-800 mt-4">마을N</h1>
                <p className="text-gray-600 mt-2 text-center">전국 모든 지역. 우리 마을 이야기<br/>'마을N'에서 확인하세요!</p>
            </div>
            <div className="w-full max-w-xs">
                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                <button onClick={handleKakaoLogin} disabled={loading} className="w-full bg-[#FEE500] text-[#3C1E1E] font-bold py-3 px-4 rounded-lg flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors disabled:bg-gray-400">
                    <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.89 0 1.75-.12 2.56-.34l-1.39 4.34c-.08.24.16.45.4.39l4.9-3.06c1.8-1.48 2.53-3.88 2.53-6.33C22 6.48 17.52 2 12 2z" fill="#3C1E1E"/></svg>
                    {loading ? "로그인 중..." : "카카오톡 간편 로그인"}
                </button>
            </div>
        </div>
    );
};

const RegionSetupPage = () => {
    const { currentUser } = useAuth();
    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiLoading, setApiLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadInitialRegions = async () => {
            setApiLoading(true);
            const regionData = await fetchRegions();
            setRegions(regionData);
            setApiLoading(false);
        };
        loadInitialRegions();
    }, []);

    useEffect(() => {
        if (selectedRegion) {
            const loadCities = async () => {
                setApiLoading(true);
                setCities([]);
                setSelectedCity('');
                const cityData = await fetchCities(selectedRegion);
                setCities(cityData);
                
                if (cityData.length === 1) {
                    setSelectedCity(cityData[0]);
                }
                
                setApiLoading(false);
            };
            loadCities();
        } else {
            setCities([]);
        }
    }, [selectedRegion]);

// RegionSetupPage 컴포넌트의 handleSaveRegion 함수를 수정합니다.

const handleSaveRegion = async () => {
    if (!selectedRegion || !selectedCity) {
        setError('거주 지역을 모두 선택해주세요.');
        return;
    }
    setLoading(true);
    setError('');
    try {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, {
            displayName: currentUser.displayName,
            email: currentUser.email,
            photoURL: currentUser.photoURL,
            region: selectedRegion,
            city: selectedCity,
            town: '', 
            createdAt: Timestamp.now(),
            followers: [],
            following: [],
            likedNews: []
        }, { merge: true }); 
        
        // ★★★ 이 부분을 명시적으로 추가해도 좋지만,
        // 위에서 수정한 ProtectedRoute가 이 역할을 이미 잘 수행할 것입니다.
        // navigate('/home'); 
        // 하지만 만약을 위해 추가해두면 더 확실합니다.
        
    } catch (e) {
        // ...
    }
};

    const isCityDropdownDisabled = !selectedRegion || apiLoading || cities.length === 1;

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-white p-4">
            <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-800">환영합니다!</h1>
                <p className="text-gray-600 mt-2">서비스 이용을 위해<br />거주 지역을 설정해주세요.</p>
            </div>
            {apiLoading && !regions.length ? <LoadingSpinner/> : (
                <div className="w-full max-w-xs space-y-4">
                    <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A]">
                        <option value="">시/도 선택</option>
                        {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                    <select 
                        value={selectedCity} 
                        onChange={(e) => setSelectedCity(e.target.value)} 
                        disabled={isCityDropdownDisabled}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A] disabled:bg-gray-200"
                    >
                        <option value="">시/군/구 선택</option>
                        {apiLoading && selectedRegion ? <option>불러오는 중...</option> : cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button onClick={handleSaveRegion} disabled={loading || !selectedCity} className="w-full mt-4 bg-[#00462A] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#003a22] transition-colors shadow-lg disabled:bg-gray-400">
                        {loading ? "저장 중..." : "마을N 시작하기"}
                    </button>
                </div>
            )}
        </div>
    );
};


// App.js 파일에서 기존 HomePage 컴포넌트를 찾아서 아래 코드로 완전히 교체하세요.

const HomePage = () => {
    const { currentUser, adminSelectedCity } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState(null);
    const [buanNews, setBuanNews] = useState(null);
    const [followingPosts, setFollowingPosts] = useState([]);
    const [userEvents, setUserEvents] = useState({});
    const [likedNews, setLikedNews] = useState([]);

    const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);
    const displayCity = adminSelectedCity || (currentUser.isAdmin ? '전국' : currentUser.city);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);

    const openDetailModal = (news) => { setSelectedNews(news); setDetailModalOpen(true); };

    useEffect(() => {
        if (!currentUser) return;
        if (!currentUser.isAdmin && !currentUser.city) return;

        const currentTargetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);

        const unsubscribes = [];
        setLikedNews(currentUser.likedNews || []);

        let postsQuery;
        if (currentTargetCity) {
            postsQuery = query(collection(db, "posts"), where("city", "==", currentTargetCity), orderBy("createdAt", "desc"), limit(50));
        } else {
            postsQuery = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
        }
        unsubscribes.push(onSnapshot(postsQuery, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, () => setPosts([])));

        let newsQuery;
        if (currentTargetCity) {
            newsQuery = query(collection(db, "news"), where("city", "==", currentTargetCity), orderBy("createdAt", "desc"));
        } else {
            newsQuery = query(collection(db, "news"), orderBy("createdAt", "desc"));
        }
        unsubscribes.push(onSnapshot(newsQuery, (snapshot) => {
            setBuanNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, () => setBuanNews([])));

        unsubscribes.push(onSnapshot(query(collection(db, `users/${currentUser.uid}/events`)), (snapshot) => {
            const eventsData = {};
            snapshot.docs.forEach(doc => {
                const event = { id: doc.id, ...doc.data() };
                if (!eventsData[event.date]) eventsData[event.date] = [];
                eventsData[event.date].push(event);
            });
            setUserEvents(eventsData);
        }));

        if (currentUser.following?.length > 0) {
            const followingLimited = currentUser.following.slice(0, 10);
            unsubscribes.push(onSnapshot(query(collection(db, "posts"), where('authorId', 'in', followingLimited), orderBy("createdAt", "desc"), limit(10)),
                (snapshot) => setFollowingPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
            ));
        } else {
            setFollowingPosts([]);
        }

        return () => unsubscribes.forEach(unsub => unsub());
    }, [currentUser, adminSelectedCity]);

    const handleLikeNews = async (newsItem) => {
        const userRef = doc(db, 'users', currentUser.uid);
        try {
            await updateDoc(userRef, {
                likedNews: likedNews.includes(newsItem.id) ? arrayRemove(newsItem.id) : arrayUnion(newsItem.id)
            });
        } catch (error) { console.error("Error liking news:", error); }
    };

    const handleDeleteNews = async (newsId, imagePath) => {
        if (!currentUser.isAdmin) return;
        if (window.confirm("정말로 이 소식을 삭제하시겠습니까?")) {
            try {
                if (imagePath) await deleteObject(ref(storage, imagePath));
                await deleteDoc(doc(db, 'news', newsId));
                alert("소식이 삭제되었습니다.");
            } catch (error) { alert(`소식 삭제 중 오류: ${error.message}`); }
        }
    };

    if (posts === null || buanNews === null) {
        return <LoadingSpinner />;
    }

    const popularPosts = posts ? [...posts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 3) : [];

    return (
        <div className="p-4 space-y-8">
            <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
                {selectedNews && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">{selectedNews.title}</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedNews.content}</p>
                    </div>
                )}
            </Modal>

            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold">지금 {displayCity}에서는</h2>
                    <Link to="/news" className="text-sm font-medium text-gray-500 hover:text-gray-800">더 보기 <ChevronRight className="inline-block" size={14} /></Link>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {buanNews.length > 0 ? (
                        buanNews.map((news) => (
                            <div key={news.id} className="w-4/5 md:w-3/5 flex-shrink-0">
                                <NewsCard {...{ news, isAdmin: currentUser.isAdmin, openDetailModal, handleDeleteNews, handleLikeNews, isLiked: likedNews.includes(news.id) }} />
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 w-full p-8 bg-gray-100 rounded-lg">아직 등록된 소식이 없습니다.</div>
                    )}
                </div>
            </section>

            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold">{displayCity} 달력</h2>
                    <Link to="/calendar" className="text-sm font-medium text-gray-500 hover:text-gray-800">자세히 <ChevronRight className="inline-block" size={14} /></Link>
                </div>
                <Calendar events={userEvents} onDateClick={(date) => navigate('/calendar', { state: { date } })} />
            </section>

            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold">지금 인기있는 글</h2>
                    <Link to="/board" className="text-sm font-medium text-gray-500 hover:text-gray-800">더 보기 <ChevronRight className="inline-block" size={14} /></Link>
                </div>
                <div className="space-y-3">
                    {popularPosts.length > 0 ? (popularPosts.map(post => {
                        const style = getCategoryStyle(post.category, post.city);
                        return (
                            <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3 cursor-pointer">
                                <span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md`}>{post.category}</span>
                                <p className="truncate flex-1">{post.title}</p>
                                <div className="flex items-center text-xs text-gray-400 gap-2">
                                    <Heart size={14} className="text-red-400" />
                                    <span>{post.likes?.length || 0}</span>
                                </div>
                            </div>
                        );
                    })) : (<p className="text-center text-gray-500 py-4">아직 인기글이 없어요.</p>)}
                </div>
            </section>

            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold">팔로잉</h2>
                </div>
                <div className="space-y-3">
                    {followingPosts.length > 0 ? (followingPosts.map(post => {
                        const style = getCategoryStyle(post.category, post.city);
                        return (
                            <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md`}>{post.category}</span>
                                    <h3 className="font-bold text-md truncate flex-1">{post.title}</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-3 truncate">{post.content}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <div>
                                        <span onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.authorId}`); }} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span>
                                        <span className="mx-1">·</span>
                                        <span>{timeSince(post.createdAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <Heart size={14} className={post.likes?.includes(currentUser.uid) ? 'text-red-500 fill-current' : 'text-gray-400'} />
                                            <span>{post.likes?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageCircle size={14} className="text-gray-400" />
                                            <span>{post.commentCount || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })) : (<p className="text-center text-gray-500 py-4">팔로우하는 사용자의 글이 없습니다.</p>)}
                </div>
            </section>
        </div>
    );
};

const NewsPage = () => {
    const { currentUser, adminSelectedCity } = useAuth();
    const navigate = useNavigate();
    const [buanNews, setBuanNews] = useState(null);
    const [likedNews, setLikedNews] = useState(currentUser.likedNews || []);
    
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [activeTag, setActiveTag] = useState('전체');
    const tags = ['전체', '교육', '문화', '청년', '농업', '안전', '운동', '행사', '복지'];

    useEffect(() => {
        const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);

        if (!currentUser || (!targetCity && !currentUser.isAdmin)) {
            // 데이터를 가져올 조건이 안되면 빈 배열로 설정하여 로딩을 멈춤
            setBuanNews([]);
            return;
        }
        
        let q;
        if (targetCity) {
            q = query(collection(db, "news"), where("city", "==", targetCity), orderBy("createdAt", "desc"));
        } else {
            q = query(collection(db, "news"), orderBy("createdAt", "desc"));
        }
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setBuanNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching news:", error);
            setBuanNews([]); // 에러 발생 시에도 로딩을 멈추기 위해 빈 배열로 설정
        });

        return () => unsubscribe();
    }, [currentUser, adminSelectedCity]);

    const handleLikeNews = async (newsItem) => {
        const userRef = doc(db, 'users', currentUser.uid);
        const isLiked = likedNews.includes(newsItem.id);
        const newLikedNews = isLiked 
            ? likedNews.filter(id => id !== newsItem.id)
            : [...likedNews, newsItem.id];
        setLikedNews(newLikedNews);

        try {
            await updateDoc(userRef, { likedNews: newLikedNews });
        } catch (error) {
            console.error("Error liking news:", error);
            setLikedNews(likedNews);
        }
    };

    const handleDeleteNews = async (newsId, imagePath) => {
        if (!currentUser.isAdmin) return;
        if (window.confirm("정말로 이 소식을 삭제하시겠습니까?")) {
            try {
                if (imagePath) await deleteObject(ref(storage, imagePath));
                await deleteDoc(doc(db, 'news', newsId));
                alert("소식이 삭제되었습니다.");
            } catch (error) { alert(`소식 삭제 중 오류: ${error.message}`); }
        }
    };

    const openDetailModal = (news) => { setSelectedNews(news); setDetailModalOpen(true); };

    if (buanNews === null) {
        return <LoadingSpinner />;
    }
    
    const filteredNews = activeTag === '전체'
        ? buanNews
        : buanNews.filter(news => news.tags && news.tags.includes(activeTag));

    return (
        <div className="p-4">
            {currentUser.isAdmin && (
                <button onClick={() => navigate('/news/write')} className="w-full mb-4 bg-[#00462A] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#003a22] transition-colors shadow-lg flex items-center justify-center gap-2">
                    <PlusCircle size={20} /> 소식 글쓰기
                </button>
            )}
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {tags.map(tag => (
                    <button
                        key={tag}
                        onClick={() => setActiveTag(tag)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${
                            activeTag === tag ? 'bg-[#00462A] text-white' : 'bg-gray-200 text-gray-700'
                        }`}
                    >
                        {tag}
                    </button>
                ))}
            </div>
            <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
                {selectedNews && (
                    <div>
                        <h2 className="text-2xl font-bold mb-4">{selectedNews.title}</h2>
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedNews.content}</p>
                    </div>
                )}
            </Modal>
            <div className="space-y-4">
                {filteredNews.length > 0 ? (
                    filteredNews.map((news) => (
                        <NewsCard key={news.id} {...{news, isAdmin: currentUser.isAdmin, openDetailModal, handleDeleteNews, handleLikeNews, isLiked: likedNews.includes(news.id)}} />
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-10 p-8 bg-gray-100 rounded-lg">
                        {activeTag === '전체' ? '등록된 소식이 없습니다.' : `선택한 태그에 해당하는 소식이 없습니다.`}
                    </div>
                )}
            </div>
        </div>
    );
};
// NewsPage 컴포넌트가 끝나는 지점...

// ▼▼▼ 여기에 아래 코드를 붙여넣으세요 ▼▼▼
const NewsWritePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const itemToEdit = location.state?.itemToEdit;

    const { currentUser } = useAuth();
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [content, setContent] = useState(itemToEdit?.content || '');
    const [tags, setTags] = useState(itemToEdit?.tags?.join(', ') || '');
    const [applyUrl, setApplyUrl] = useState(itemToEdit?.applyUrl || '');
    const [date, setDate] = useState(itemToEdit?.date || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(itemToEdit?.imageUrl || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim() || !date) {
            alert('날짜, 제목, 내용을 모두 입력해주세요.');
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let imageUrl = itemToEdit?.imageUrl || null;
            let imagePath = itemToEdit?.imagePath || null;
            if (imageFile) {
                if (itemToEdit?.imagePath) {
                    await deleteObject(ref(storage, itemToEdit.imagePath)).catch(err => console.error("기존 이미지 삭제 실패:", err));
                }
                const newImagePath = `news_images/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, newImagePath);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
                imagePath = newImagePath;
            }

            const finalData = {
                title,
                content,
                imageUrl,
                imagePath,
                date,
                updatedAt: Timestamp.now(),
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                applyUrl,
                region: currentUser.region,
                city: currentUser.city,
            };

            if (itemToEdit) {
                await updateDoc(doc(db, 'news', itemToEdit.id), finalData);
            } else {
                finalData.createdAt = Timestamp.now();
                finalData.authorId = currentUser.uid;
                await addDoc(collection(db, 'news'), finalData);
            }
            navigate('/news');
        } catch (error) {
            alert(`오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const pageTitle = itemToEdit ? "소식 수정" : "소식 작성";
    return (
        <div>
            <div className="p-4 flex items-center border-b">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-lg font-bold mx-auto">{pageTitle}</h2>
                <button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">
                    {isSubmitting ? '등록 중...' : '완료'}
                </button>
            </div>
            <div className="p-4 space-y-4">
                 <input type="date" value={date} onChange={(e) => setDate(e.target.value)} placeholder="이벤트 날짜" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" required />
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="태그 (쉼표로 구분)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <input type="url" value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="신청하기 URL 링크 (선택 사항)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="w-full text-xl p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요..." className="w-full h-64 p-2 focus:outline-none resize-none" />
                <div className="border-t pt-4">
                    <label htmlFor="image-upload-news" className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#00462A]"><ImageUp size={20} /><span>사진 추가</span></label>
                    <input id="image-upload-news" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    {imagePreview && (
                        <div className="mt-4 relative w-32 h-32">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                            <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"><X size={14} /></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


// ▼▼▼ 여기에 아래 코드를 붙여넣으세요 ▼▼▼
const CalendarPage = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [userEvents, setUserEvents] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [eventTitle, setEventTitle] = useState('');

    useEffect(() => {
      const unsub = onSnapshot(query(collection(db, `users/${currentUser.uid}/events`)), (snapshot) => {
          const eventsData = {};
          snapshot.docs.forEach(doc => {
              const event = { id: doc.id, ...doc.data() };
              if (!eventsData[event.date]) eventsData[event.date] = [];
              eventsData[event.date].push(event);
          });
          setUserEvents(eventsData);
      });
      return () => unsub();
    }, [currentUser.uid]);

    useEffect(() => {
        if(location.state?.date) {
            setSelectedDate(location.state.date);
            setIsModalOpen(true);
        }
    }, [location.state]);

    const handleDateClick = (date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const handleAddEvent = async () => {
        if (!eventTitle.trim()) {
            alert("일정 제목을 입력해주세요.");
            return;
        }
        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'events'), {
                title: eventTitle,
                date: selectedDate,
                createdAt: Timestamp.now(),
                type: 'user'
            });
            setIsModalOpen(false);
            setEventTitle('');
        } catch(error) {
            console.error("Error adding event: ", error);
            alert("일정 추가 중 오류가 발생했습니다.");
        }
    };
    
    const eventsForSelectedDate = selectedDate && userEvents[selectedDate] ? userEvents[selectedDate] : [];

    return (
        <div className="p-4">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-2">
                    <h3 className="text-lg font-bold mb-4">{selectedDate}</h3>
                    <div className="mb-4">
                        <input
                            type="text"
                            value={eventTitle}
                            onChange={(e) => setEventTitle(e.target.value)}
                            placeholder="새로운 일정"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00462A] focus:border-[#00462A]"
                        />
                    </div>
                    <button onClick={handleAddEvent} className="w-full bg-[#00462A] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#003a22]">
                        저장
                    </button>
                    <div className="mt-6">
                        <h4 className="font-bold mb-2">이 날의 일정:</h4>
                        {eventsForSelectedDate.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                                {eventsForSelectedDate.map(event => <li key={event.id}>{event.title}</li>)}
                            </ul>
                        ) : (
                            <p className="text-gray-500">등록된 일정이 없습니다.</p>
                        )}
                    </div>
                </div>
            </Modal>
            <Calendar events={userEvents} onDateClick={handleDateClick} />
        </div>
    );
};

// 예시: BoardPage

// App.js 파일에서 기존 BoardPage 컴포넌트를 이 코드로 완전히 교체하세요.

const BoardPage = () => {
    const { currentUser, adminSelectedCity } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState(null);
    const [filter, setFilter] = useState('전체');

    const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);
    const userCity = currentUser?.city;
    const dynamicMomCategory = `${userCity}맘`;
    const categories = ['전체', '일상', '친목', '10대', '청년', '중년', dynamicMomCategory, '질문', '기타'];

    useEffect(() => {
        if (!currentUser || (!targetCity && !currentUser.isAdmin)) {
            setPosts([]);
            return;
        };
        
        const postsCollection = collection(db, "posts");
        let queryConstraints = [];

        // 지역 필터링
        if (targetCity) {
            queryConstraints.push(where("city", "==", targetCity));
        }

        // 카테고리 필터링
        if (filter !== '전체') {
            queryConstraints.push(where("category", "==", filter));
        }

        // 정렬 및 제한
        queryConstraints.push(orderBy("createdAt", "desc"));
        queryConstraints.push(limit(50));
        
        const q = query(postsCollection, ...queryConstraints);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching posts: ", error);
            setPosts([]);
        });

        return () => unsubscribe();
    }, [filter, currentUser, adminSelectedCity]);

    if (posts === null) {
        return <LoadingSpinner />;
    }

    return (
        <div className="p-4 pb-20">
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {categories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${filter === cat ? 'bg-[#00462A] text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {cat}
                    </button>
                ))}
            </div>
            <div className="space-y-3">
                {posts.length > 0 ? (
                    posts.map(post => {
                        const style = getCategoryStyle(post.category, post.city);
                        return (
                            <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md`}>{post.category}</span>
                                    <h3 className="font-bold text-md truncate flex-1">{post.title}</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-3 truncate">{post.content}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                <div>
                                        <span onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.authorId}`); }} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span>
                                        <span className="mx-1">·</span>
                                        <span>{timeSince(post.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1">
                                            <Heart size={14} className={post.likes?.includes(currentUser.uid) ? 'text-red-500 fill-current' : 'text-gray-400'} />
                                            <span>{post.likes?.length || 0}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <MessageCircle size={14} className="text-gray-400"/>
                                            <span>{post.commentCount || 0}</span>
                                        </div>
                                </div>
                                </div>
                            </div>
                        );
                    })
                ) : ( <p className="text-center text-gray-500 py-10">해당 카테고리에 글이 없습니다.</p> )}
            </div>
             <button
                onClick={() => navigate('/post/write')}
                className="fixed bottom-24 right-5 bg-[#00462A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[#003a22] transition-transform transform hover:scale-110">
                <PlusCircle size={28} />
            </button>
        </div>
    );
};

// App.js 파일에서 기존 WritePage 컴포넌트를 이 코드로 완전히 교체하세요.

const WritePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const itemToEdit = location.state?.itemToEdit;
    
    const { currentUser } = useAuth();
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [content, setContent] = useState(itemToEdit?.content || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(itemToEdit?.imageUrl || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 관리자용 지역 선택 상태
    const [allRegions, setAllRegions] = useState([]);
    const [selectedPostRegion, setSelectedPostRegion] = useState(itemToEdit ? `${itemToEdit.region}|${itemToEdit.city}` : '');

    const userCity = currentUser?.city;
    const dynamicMomCategory = `${userCity}맘`;
    const categories = ['일상', '친목', '10대', '청년', '중년', dynamicMomCategory, '질문', '기타'];
    const [category, setCategory] = useState(itemToEdit?.category || '일상');

    // 관리자일 경우 지역 목록 불러오기
    useEffect(() => {
        if (currentUser?.isAdmin) {
            const loadAllRegions = async () => {
                const sidos = await fetchRegions();
                const allCitiesPromises = sidos.map(sido => fetchCities(sido));
                const allCitiesArrays = await Promise.all(allCitiesPromises);
                
                const flattenedRegions = [];
                sidos.forEach((sido, index) => {
                    allCitiesArrays[index].forEach(city => {
                        if (sido === city) {
                             if (!flattenedRegions.find(r => r.city === sido)) {
                                flattenedRegions.push({ region: sido, city: city, label: sido });
                            }
                        } else {
                            flattenedRegions.push({ region: sido, city: city, label: `${sido} ${city}` });
                        }
                    });
                });
                setAllRegions(flattenedRegions);
                // 수정 모드일 경우, 기본값을 설정
                if (itemToEdit) {
                    setSelectedPostRegion(`${itemToEdit.region}|${itemToEdit.city}`);
                }
            };
            loadAllRegions();
        }
    }, [currentUser?.isAdmin, itemToEdit]);

    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }
        if (currentUser.isAdmin && !selectedPostRegion) {
            alert('게시글을 등록할 지역을 선택해주세요.');
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let imageUrl = itemToEdit?.imageUrl || null;
            let imagePath = itemToEdit?.imagePath || null;

            if (imageFile) {
                if (itemToEdit?.imagePath) {
                    await deleteObject(ref(storage, itemToEdit.imagePath)).catch(err => console.error("기존 이미지 삭제 실패:", err));
                }
                const newImagePath = `posts/${currentUser.uid}/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, newImagePath);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
                imagePath = newImagePath;
            }

            const [region, city] = currentUser.isAdmin 
                ? selectedPostRegion.split('|') 
                : [currentUser.region, currentUser.city];

            const postData = {
                title,
                content,
                category,
                imageUrl,
                imagePath,
                updatedAt: Timestamp.now(),
                region,
                city,
            };
            
            // 수정일 경우, 생성 관련 필드는 건드리지 않음
            if (!itemToEdit) {
                postData.authorId = currentUser.uid;
                postData.authorName = currentUser.displayName;
                postData.createdAt = Timestamp.now();
                postData.likes = [];
                postData.bookmarks = [];
                postData.commentCount = 0;
            }

            if (itemToEdit) {
                await updateDoc(doc(db, 'posts', itemToEdit.id), postData);
            } else {
                await addDoc(collection(db, 'posts'), postData);
            }
            navigate('/board');
        } catch (error) {
            alert(`오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const pageTitle = itemToEdit ? "글 수정" : "글쓰기";

    return (
        <div>
            <div className="p-4 flex items-center border-b">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-lg font-bold mx-auto">{pageTitle}</h2>
                <button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">
                    {isSubmitting ? '등록 중...' : '완료'}
                </button>
            </div>
            <div className="p-4 space-y-4">
                {currentUser.isAdmin && (
                    <div>
                        <label htmlFor="post-region-select" className="block text-sm font-medium text-gray-700 mb-1">게시 지역 선택</label>
                        <select
                            id="post-region-select"
                            value={selectedPostRegion}
                            onChange={(e) => setSelectedPostRegion(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A]"
                        >
                            <option value="">지역을 선택하세요</option>
                            {allRegions.map(r => (
                                <option key={r.label} value={`${r.region}|${r.city}`}>{r.label}</option>
                            ))}
                        </select>
                    </div>
                )}
                <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${category === cat ? `${getCategoryStyle(cat, userCity).bgStrong} text-white` : 'bg-gray-200 text-gray-700'}`}>{cat}</button>
                    ))}
                </div>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="w-full text-xl p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요..." className="w-full h-64 p-2 focus:outline-none resize-none" />
                <div className="border-t pt-4">
                    <label htmlFor="image-upload-post" className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#00462A]"><ImageUp size={20} /><span>사진 추가</span></label>
                    <input id="image-upload-post" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    {imagePreview && (
                        <div className="mt-4 relative w-32 h-32">
                            <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" />
                            <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"><X size={14} /></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const PostDetailPage = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        if (!postId) {
            navigate('/board');
            return;
        }
        const postRef = doc(db, `posts`, postId);
        const unsubscribePost = onSnapshot(postRef, (doc) => {
            if (doc.exists()) {
                setPost({ id: doc.id, ...doc.data() });
            } else {
                alert("삭제된 게시글입니다.");
                navigate('/board');
            }
        });

        const commentsRef = collection(db, `posts/${postId}/comments`);
        const q = query(commentsRef, orderBy("createdAt", "asc"));
        const unsubscribeComments = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setComments(commentsData);
        });

        return () => {
            unsubscribePost();
            unsubscribeComments();
        };
    }, [postId, navigate]);

    const handleLike = async () => {
        if (!post || !currentUser) return;
        const postRef = doc(db, 'posts', postId);
        try {
            await updateDoc(postRef, {
                likes: post.likes?.includes(currentUser.uid) ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
            });
        } catch (e) { console.error("Error updating like: ", e); }
    };

    const handleBookmark = async () => {
        if (!post || !currentUser) return;
        const postRef = doc(db, 'posts', postId);
        try {
             await updateDoc(postRef, {
                bookmarks: post.bookmarks?.includes(currentUser.uid) ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
            });
        } catch(e) { console.error("Error updating bookmark:", e); }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;
        try {
            const batch = writeBatch(db);
            const postRef = doc(db, 'posts', postId);
            const newCommentRef = doc(collection(db, `posts/${postId}/comments`));

            batch.set(newCommentRef, {
                text: newComment.trim(),
                authorId: currentUser.uid,
                authorName: currentUser.displayName,
                createdAt: Timestamp.now(),
                likes: []
            });
            batch.update(postRef, { commentCount: increment(1) });
            await batch.commit();
            setNewComment('');
        } catch (error) { console.error("Error adding comment: ", error); }
    };

    const handleCommentLike = async (commentId) => {
        if (!currentUser) return;
        const commentRef = doc(db, `posts/${postId}/comments`, commentId);
        try {
            const commentSnap = await getDoc(commentRef);
            if (!commentSnap.exists()) return;
            const currentLikes = commentSnap.data().likes || [];
            await updateDoc(commentRef, {
                likes: currentLikes.includes(currentUser.uid) ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
            });
        } catch(e) { console.error("Error liking comment:", e); }
    };

    const handleDelete = async (postId, imagePath) => {
        if (!post || post.authorId !== currentUser.uid) return;
        if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
            try {
                const commentsRef = collection(db, 'posts', postId, 'comments');
                const commentsSnap = await getDocs(commentsRef);
                const deletePromises = commentsSnap.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
                
                if (imagePath) { await deleteObject(ref(storage, imagePath)); }
                await deleteDoc(doc(db, 'posts', postId));
                alert("게시글이 삭제되었습니다.");
                navigate('/board');
            } catch (error) {
                console.error("Error deleting post:", error)
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    if (post === null) return <LoadingSpinner />;
    
    const isAuthor = post.authorId === currentUser.uid;
    const isLiked = post.likes?.includes(currentUser.uid);
    const isBookmarked = post.bookmarks?.includes(currentUser.uid);
    const style = getCategoryStyle(post.category, post.city);

    return (
        <div className="pb-20">
            <div className="p-4">
                <div className="mb-4 pb-4 border-b">
                    <span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md mb-2 inline-block`}>{post.category}</span>
                    <div className="flex justify-between items-start mt-2">
                        <h1 className="text-2xl font-bold flex-1 pr-4">{post.title}</h1>
                        <div className="flex items-center gap-2">
                            {isAuthor && (
                                <>
                                    <button onClick={() => navigate(`/post/edit/${post.id}`, { state: { itemToEdit: post }})} className="p-1 text-gray-500 hover:text-blue-600"><Pencil size={20} /></button>
                                    <button onClick={() => handleDelete(post.id, post.imagePath)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={20} /></button>
                                </>
                            )}
                            <button onClick={handleBookmark} className="p-1 -mr-1">
                                <Star size={22} className={isBookmarked ? "text-yellow-400 fill-current" : "text-gray-400"} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 overflow-hidden flex items-center justify-center" onClick={() => navigate(`/profile/${post.authorId}`)}>
                            {post.authorPhotoURL ? <img src={post.authorPhotoURL} alt={post.authorName} className="w-full h-full object-cover" /> : <UserCircle size={32} className="text-gray-400" />}
                        </div>
                        <span onClick={() => navigate(`/profile/${post.authorId}`)} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span>
                        <span className="mx-2">·</span>
                        <span>{timeSince(post.createdAt)}</span>
                    </div>
                    {post.imageUrl && ( <div className="my-4"><img src={post.imageUrl} alt="Post" className="w-full h-auto rounded-lg object-cover" /></div> )}
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mt-4">{post.content}</p>
                </div>
                <div className="flex items-center gap-4 mb-4">
                    <button onClick={handleLike} className="flex items-center gap-1 text-gray-600 hover:text-red-500">
                        <Heart size={20} className={isLiked ? "text-red-500 fill-current" : ""} />
                        <span>좋아요 {post.likes?.length || 0}</span>
                    </button>
                    <div className="flex items-center gap-1 text-gray-600">
                        <MessageCircle size={20} /> <span>댓글 {comments.length}</span>
                    </div>
                </div>
                <div className="space-y-4">
                    {comments.map(comment => (
                        <div key={comment.id} className="flex gap-3">
                             <div className="w-8 h-8 rounded-full bg-gray-200 mt-1 flex-shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${comment.authorId}`)}></div>
                             <div className="flex-1">
                                <div className="bg-gray-100 p-3 rounded-lg">
                                    <p onClick={() => navigate(`/profile/${comment.authorId}`)} className="font-semibold text-sm cursor-pointer hover:underline">{comment.authorName}</p>
                                    <p className="text-gray-800">{comment.text}</p>
                                </div>
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                    <span>{timeSince(comment.createdAt)}</span>
                                    <button onClick={() => handleCommentLike(comment.id)} className="ml-4 flex items-center hover:text-red-500">
                                      <Heart size={12} className={comment.likes?.includes(currentUser.uid) ? 'text-red-500 fill-current' : ''} />
                                      <span className="ml-1">{comment.likes?.length || 0}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white border-t p-3">
                <form onSubmit={handleCommentSubmit} className="relative flex items-center">
                    <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="댓글을 입력하세요."
                        className="w-full pl-4 pr-12 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]"
                    />
                    <button type="submit" className="absolute right-2 p-2 rounded-full text-gray-500 hover:bg-gray-200">
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

const ProfileEditPage = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [bio, setBio] = useState(currentUser?.bio || '');
    const [town, setTown] = useState(currentUser?.town || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(currentUser?.photoURL || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            const userDocRef = doc(db, 'users', currentUser.uid);
            let photoURL = currentUser.photoURL;

            if (imageFile) {
                const imagePath = `profile_images/${currentUser.uid}/profile.jpg`;
                const storageRef = ref(storage, imagePath);
                await uploadBytes(storageRef, imageFile);
                photoURL = await getDownloadURL(storageRef);
            }

            const dataToUpdate = { bio, town, photoURL };
            await updateDoc(userDocRef, dataToUpdate);
            
            if (photoURL !== currentUser.photoURL) {
                await updateProfile(auth.currentUser, { photoURL });
            }

            alert('프로필이 성공적으로 업데이트되었습니다.');
            navigate(`/profile/${currentUser.uid}`);

        } catch (error) {
            console.error("프로필 업데이트 오류:", error);
            alert(`오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="p-4 flex items-center border-b">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-lg font-bold mx-auto">프로필 편집</h2>
                <button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">
                    {isSubmitting ? '저장 중...' : '저장'}
                </button>
            </div>
            <div className="p-4 flex flex-col items-center">
                <div className="relative w-24 h-24 mb-4">
                    <div className="w-full h-full rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">
                        {imagePreview ? (
                            <img src={imagePreview} alt="프로필 미리보기" className="w-full h-full object-cover" />
                        ) : (
                            <UserCircle size={96} className="text-gray-400" />
                        )}
                    </div>
                    <label htmlFor="profile-image-upload" className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-gray-100">
                        <Pencil size={16} className="text-gray-600" />
                    </label>
                    <input id="profile-image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                
                <div className="w-full space-y-4 mt-4">
                    <div>
                        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">자기소개</label>
                        <textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="자기소개를 입력해주세요." className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00462A]" rows="3"/>
                    </div>
                    <div>
                         <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-1">상세 동네 (직접 입력)</label>
                        <input type="text" id="town" value={town} onChange={(e) => setTown(e.target.value)} placeholder="예: 부안읍, 효자동" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00462A]" />
                    </div>
                </div>
            </div>
        </div>
    );
};


// App.js 파일에서 기존 UserProfilePage 컴포넌트를 찾아서 아래 코드로 완전히 교체하세요.

const UserProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { currentUser, adminSelectedCity, setAdminSelectedCity } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState(null);
    const [allRegions, setAllRegions] = useState([]);
    
    // 관리자 모드(특정 지역 뷰) 활성화 여부 상태
    const [isAdminModeOn, setIsAdminModeOn] = useState(!!adminSelectedCity);

    useEffect(() => {
        if (currentUser?.isAdmin) {
            const loadAllRegions = async () => {
                const sidos = await fetchRegions();
                const allCitiesPromises = sidos.map(sido => fetchCities(sido));
                const allCitiesArrays = await Promise.all(allCitiesPromises);
                
                const flattenedRegions = [];
                sidos.forEach((sido, index) => {
                    allCitiesArrays[index].forEach(city => {
                        if (sido === city) {
                            if (!flattenedRegions.find(r => r.city === sido)) {
                                flattenedRegions.push({ region: sido, city: city, label: sido });
                            }
                        } else {
                            flattenedRegions.push({ region: sido, city: city, label: `${sido} ${city}` });
                        }
                    });
                });
                setAllRegions(flattenedRegions);
            };
            loadAllRegions();
        }
    }, [currentUser?.isAdmin]);

    useEffect(() => {
        if (!userId) return;
        const userRef = doc(db, 'users', userId);
        const unsubscribeUser = onSnapshot(userRef, (doc) => {
            if(doc.exists()){
                const userData = doc.data();
                setProfileUser({...userData, id: doc.id, uid: doc.id, photoURL: userData.photoURL || null });
            } else {
              setProfileUser(null);
            }
        });

        const userPostsQuery = query(collection(db, 'posts'), where("authorId", "==", userId), orderBy("createdAt", "desc"));
        const unsubscribePosts = onSnapshot(userPostsQuery, (snapshot) => {
            setUserPosts(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
        
        return () => { unsubscribeUser(); unsubscribePosts(); };
    }, [userId]);

    const handleAdminModeToggle = () => {
        const newAdminModeState = !isAdminModeOn;
        setIsAdminModeOn(newAdminModeState);
        // 관리자 모드를 끄면 항상 전체 뷰로 돌아감
        if (!newAdminModeState) {
            setAdminSelectedCity(null);
        }
    };

    const handleRegionViewChange = (e) => {
        const value = e.target.value;
        setAdminSelectedCity(value === "admin_view" ? null : value);
        navigate('/home'); 
    };
    
    const handleLogout = async () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            await signOut(auth);
            navigate('/start');
        }
    };

    if(profileUser === null || userPosts === null) return <LoadingSpinner />;
    if(!profileUser) return <div className='p-4 text-center'>사용자를 찾을 수 없습니다.</div>;

    const isMyProfile = currentUser.uid === userId;
    const userLocation = (isMyProfile && currentUser.isAdmin) ? '관리자' : (profileUser.region && profileUser.city ? `${profileUser.region} ${profileUser.city}` : '지역 정보 없음');

    return (
        <div className="p-4 pb-16">
            <div className="flex items-center mb-6">
                 <div className="w-16 h-16 rounded-full mr-4 flex-shrink-0 bg-gray-200 overflow-hidden flex items-center justify-center">
                    {profileUser.photoURL ? (
                        <img src={profileUser.photoURL} alt={profileUser.displayName} className="w-full h-full object-cover" />
                    ) : (
                        <UserCircle size={64} className="text-gray-400" />
                    )}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold">{profileUser.displayName}</h2>
                    <p className="text-sm text-gray-600 mt-1">{profileUser.bio || '자기소개를 입력해주세요.'}</p>
                    <p className="text-xs text-gray-500 mt-1">{userLocation}</p>
                    <div className="text-sm text-gray-500 mt-2">
                        <span>팔로워 {profileUser.followers?.length || 0}</span>
                        <span className="mx-2">·</span>
                        <span>팔로잉 {profileUser.following?.length || 0}</span>
                    </div>
                </div>
            </div>
            
            <div className="flex gap-2 mb-6">
                {isMyProfile ? (
                    <>
                        <button onClick={() => navigate('/profile/edit')} className="flex-1 p-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 flex items-center justify-center gap-1">
                            <Edit size={16} /> 프로필 편집
                        </button>
                        <button onClick={handleLogout} className="flex-1 p-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 flex items-center justify-center gap-1">
                            <LogOut size={16} /> 로그아웃
                        </button>
                    </>
                ) : (
                    <>
                        {/* 팔로우/메시지 버튼 (기존 로직과 동일) */}
                    </>
                )}
            </div>

            {isMyProfile && currentUser.isAdmin && (
                <div className="mb-6 p-4 bg-gray-100 rounded-lg space-y-4">
                    <h3 className="text-md font-bold text-gray-800">관리자 도구</h3>
                    <div className="flex items-center justify-between">
                        <label htmlFor="admin-mode-toggle" className="font-semibold text-gray-700">관리자 모드</label>
                        <button onClick={handleAdminModeToggle} id="admin-mode-toggle" className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isAdminModeOn ? 'bg-green-600' : 'bg-gray-300'}`}>
                            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isAdminModeOn ? 'translate-x-6' : 'translate-x-1'}`}/>
                        </button>
                    </div>
                    
                    {isAdminModeOn && (
                        <div>
                            <label htmlFor="region-view-select" className="block text-sm font-medium text-gray-600 mb-1">지역 뷰 선택</label>
                            <select 
                                id="region-view-select"
                                value={adminSelectedCity || 'admin_view'}
                                onChange={handleRegionViewChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A]"
                            >
                                <option value="admin_view">전체 보기 (관리자)</option>
                                {allRegions.map(r => (
                                    <option key={r.label} value={r.city}>{r.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
            )}

            <div className="space-y-3">
                <h3 className="text-lg font-bold">작성한 글</h3>
                {userPosts && userPosts.length > 0 ? userPosts.map(post => (
                     <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                        <h4 className="font-bold text-md truncate mb-1">{post.title}</h4>
                        <p className="text-gray-600 text-sm truncate">{post.content}</p>
                    </div>
                )) : ( <p className="text-center text-gray-500 py-10">아직 작성한 글이 없습니다.</p> )}
            </div>
        </div>
    );
};

const SearchPage = () => {
    const { currentUser, adminSelectedCity } = useAuth();
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);
    const displayCity = adminSelectedCity || (currentUser.isAdmin ? '전체' : currentUser.city);

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const postsRef = collection(db, 'posts');
            let q;

            if (targetCity) {
                // 관리자가 특정 지역을 보거나, 일반 사용자인 경우
                q = query(postsRef,
                    where('city', '==', targetCity),
                    where('title', '>=', searchTerm),
                    where('title', '<=', searchTerm + '\uf8ff')
                );
            } else {
                // 관리자가 전체 뷰에서 검색하는 경우
                q = query(postsRef,
                    where('title', '>=', searchTerm),
                    where('title', '<=', searchTerm + '\uf8ff')
                );
            }
            
            const querySnapshot = await getDocs(q);
            const fetchedPosts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setResults(fetchedPosts);
        } catch (error) {
            console.error("Search error: ", error);
            alert("검색 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="relative mb-4 flex gap-2">
                <input type="text" value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder={targetCity ? `${displayCity} 내에서 검색...` : '전체 게시물에서 검색...'}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]" />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <button onClick={handleSearch} className="px-4 py-2 bg-[#00462A] text-white rounded-full font-semibold">검색</button>
            </div>
 	        {loading ? <LoadingSpinner /> : (
                <div className="space-y-3">
                    {results.length === 0 && searchTerm && !loading && ( <p className="text-center text-gray-500 py-10">검색 결과가 없습니다.</p> )}
                    {results.map(post => (
                        <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                            <h3 className="font-bold text-md truncate mb-1">{post.title}</h3>
                            <p className="text-gray-600 text-sm truncate">{post.content}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const NotificationsPage = () => {
    const notifications = [
        { id: 1, text: '알림 기능은 APP 버전에서만 작동합니다.', time: '방금 전' },
        { id: 2, text: '7월 정식 앱 출시를 기대해주세요!', time: '방금 전' },
    ];
    return ( <div className="p-4"> {notifications.map(notif => ( <div key={notif.id} className="p-3 border-b border-gray-200"> <p className="text-sm">{notif.text}</p> <p className="text-xs text-gray-500 mt-1">{notif.time}</p> </div> ))} </div> );
};

const ChatListPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState(null);

    useEffect(() => {
        const q = query(collection(db, 'chats'), where('members', 'array-contains', currentUser.uid));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const chatsData = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const chatData = docSnap.data();
                const otherMemberId = chatData.members.find(id => id !== currentUser.uid);
                if (!otherMemberId) return null;
                const userDoc = await getDoc(doc(db, 'users', otherMemberId));
                return { 
                    id: docSnap.id, 
                    ...chatData, 
                    otherUser: userDoc.exists() ? {uid: userDoc.id, ...userDoc.data()} : { displayName: '알 수 없음', uid: otherMemberId }, 
                };
            }));
            setChats(chatsData.filter(Boolean));
        });
        return () => unsubscribe();
    }, [currentUser.uid]);

    if (chats === null) return <LoadingSpinner />;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">채팅 목록</h2>
            <div className="space-y-3">
                {chats.length > 0 ? chats.map(chat => (
                    <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`, { state: { recipientId: chat.otherUser.uid, recipientName: chat.otherUser.displayName }})}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 overflow-hidden flex items-center justify-center">
                            {chat.otherUser.photoURL ? <img src={chat.otherUser.photoURL} alt={chat.otherUser.displayName} className="w-full h-full object-cover" /> : <UserCircle size={48} className="text-gray-400"/>}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-bold">{chat.otherUser.displayName}</h3>
                            <p className="text-sm text-gray-500 truncate">{chat.lastMessage?.text || '메시지를 보내보세요.'}</p>
                        </div>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 py-10">진행중인 대화가 없습니다.</p>
                )}
            </div>
        </div>
    );
};

const ChatPage = () => {
    const { currentUser } = useAuth();
    const { chatId } = useParams();
    const location = useLocation();
    const { recipientId } = location.state || {};

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    
    useEffect(() => {
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        const unsubscribe = onSnapshot(q, snapshot => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return unsubscribe;
    }, [chatId]);
    
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !recipientId) return;

        const messageData = {
            text: newMessage,
            senderId: currentUser.uid,
            createdAt: Timestamp.now(),
        };
        
        try {
            const batch = writeBatch(db);
            const chatRef = doc(db, 'chats', chatId);
            const newMessageRef = doc(collection(chatRef, 'messages'));

            batch.set(newMessageRef, messageData);
            batch.set(chatRef, {
                members: [currentUser.uid, recipientId],
                lastMessage: messageData,
            }, { merge: true });

            await batch.commit();
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };
    
    return (
         <div className="flex flex-col h-full"> 
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs p-3 rounded-lg ${msg.senderId === currentUser.uid ? 'bg-green-500 text-white' : 'bg-gray-200'}`}>
                            <p>{msg.text}</p>
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>
            <div className="bg-white border-t p-3">
                 <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="메시지를 입력하세요."
                        className="w-full pl-4 pr-12 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]"
                    />
                    <button type="submit" className="absolute right-2 p-2 rounded-full text-gray-500 hover:bg-gray-200">
                        <Send size={20} />
                    </button>
                </form>
            </div>
        </div>
    );
};

const ClubListPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [clubs, setClubs] = useState(null);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [selectedClub, setSelectedClub] = useState(null);
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('내 모임');

    useEffect(() => {
        const q = query(collection(db, "clubs"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setClubs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        return () => unsubscribe();
    }, []);

    if (clubs === null) return <LoadingSpinner />;

    const myClubs = clubs.filter(club => club.members && club.members.includes(currentUser.uid));
    const displayedClubs = activeTab === '내 모임' ? myClubs : clubs;

    const handleEnterClub = (club) => {
        if ((club.members && club.members.includes(currentUser.uid)) || !club.password) {
            navigate(`/clubs/${club.id}`);
        } else {
            setSelectedClub(club);
            setPasswordModalOpen(true);
        }
    };

    const handlePasswordSubmit = async () => {
        if (!selectedClub || !password) return;
        if (password === selectedClub.password) {
            const clubRef = doc(db, 'clubs', selectedClub.id);
            try {
                await updateDoc(clubRef, { members: arrayUnion(currentUser.uid) });
                navigate(`/clubs/${selectedClub.id}`);
                setPasswordModalOpen(false);
                setPassword('');
                setSelectedClub(null);
            } catch (error) {
                console.error("멤버 추가 오류:", error);
                alert("모임 입장에 실패했습니다. 다시 시도해주세요.");
            }
        } else {
            alert('비밀번호가 일치하지 않습니다.');
        }
    };
    
    const handleCreatorClick = (e, creatorId) => {
        e.stopPropagation();
        navigate(`/profile/${creatorId}`);
    };

    return (
        <div className="p-4">
            <Modal isOpen={passwordModalOpen} onClose={() => { setPasswordModalOpen(false); setPassword(''); }}>
                <h3 className="text-lg font-bold mb-4">{selectedClub?.name}</h3>
                <p className="mb-4">이 모임은 비밀번호가 필요합니다.</p>
                <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                    placeholder="비밀번호" 
                    className="w-full p-2 border rounded mb-4"
                />
                <button onClick={handlePasswordSubmit} className="w-full bg-[#00462A] text-white py-2 rounded">입장하기</button>
            </Modal>
            
            <div className="flex justify-between items-center mb-4">
                <div className="flex bg-gray-200 rounded-lg p-1">
                    <button 
                        onClick={() => setActiveTab('내 모임')}
                        className={`px-4 py-1 text-sm font-semibold rounded-md ${activeTab === '내 모임' ? 'bg-white shadow' : 'text-gray-600'}`}
                    >
                        내 모임
                    </button>
                    <button 
                        onClick={() => setActiveTab('전체 모임')}
                        className={`px-4 py-1 text-sm font-semibold rounded-md ${activeTab === '전체 모임' ? 'bg-white shadow' : 'text-gray-600'}`}
                    >
                        전체 모임
                    </button>
                </div>
                <button onClick={() => navigate('/clubs/create')} className="bg-[#00462A] text-white font-bold py-2 px-3 rounded-lg hover:bg-[#003a22] flex items-center gap-1 text-sm">
                    <PlusCircle size={16} /> 만들기
                </button>
            </div>
            <div className="space-y-3">
                {displayedClubs.length > 0 ? displayedClubs.map(club => (
                    <div key={club.id} onClick={() => handleEnterClub(club)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer flex items-center gap-4">
                        <img src={club.photoURL} alt={club.name} className="w-16 h-16 rounded-lg object-cover bg-gray-200 flex-shrink-0" />
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-bold text-lg">{club.name}</h3>
                            <p className="text-sm text-gray-500 truncate">{club.description}</p>
                            <div className="text-xs text-gray-400 mt-1 flex items-center">
                                {club.password && <Lock size={12} className="mr-1" />}
                                <span>멤버 {club.members?.length || 1}명</span>
                                <span className="mx-1">·</span>
                                <span onClick={(e) => handleCreatorClick(e, club.creatorId)} className="hover:underline">
                                    {club.creatorName}
                                </span>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="text-center text-gray-500 py-20">
                        {activeTab === '내 모임' ? '가입한 모임이 없습니다.' : '생성된 모임이 없습니다.'}
                    </div>
                )}
            </div>
        </div>
    );
};

const ClubCreatePage = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('');
    const [password, setPassword] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name || !description || !imageFile) {
            alert('모임 이름, 소개, 대표 사진은 필수입니다.');
            return;
        }
        setIsSubmitting(true);
        try {
            const imagePath = `club_images/${currentUser.uid}/${Date.now()}_${imageFile.name}`;
            const storageRef = ref(storage, imagePath);
            await uploadBytes(storageRef, imageFile);
            const photoURL = await getDownloadURL(storageRef);

            await addDoc(collection(db, 'clubs'), {
                name,
                description,
                category,
                password,
                photoURL,
                imagePath,
                creatorId: currentUser.uid,
                creatorName: currentUser.displayName,
                members: [currentUser.uid],
                createdAt: Timestamp.now(),
            });
            navigate('/clubs');
        } catch (error) {
            console.error(error);
            alert('모임 생성 중 오류가 발생했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    return (
        <div>
            <div className="p-4 flex items-center border-b">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-lg font-bold mx-auto">모임 만들기</h2>
                <button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">{isSubmitting ? '생성 중...' : '완료'}</button>
            </div>
            <div className="p-4 space-y-4">
                <div className="flex justify-center">
                    <label htmlFor="club-image-upload" className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden">
                        {imagePreview ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" /> : <ImageUp />}
                    </label>
                    <input id="club-image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="모임 이름" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]"/>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="모임 소개" className="w-full p-2 border-b-2 h-24 resize-none focus:outline-none focus:border-[#00462A]"/>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="카테고리 (예: 등산, 독서)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]"/>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 (없으면 공개 모임)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]"/>
            </div>
        </div>
    );
};

const ClubDetailPage = () => {
    const { clubId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [club, setClub] = useState(null);
    const [members, setMembers] = useState([]);
    const [posts, setPosts] = useState([]);
    
    useEffect(() => {
        if (!clubId) {
            navigate('/clubs');
            return;
        }

        const clubRef = doc(db, 'clubs', clubId);
        const unsubscribeClub = onSnapshot(clubRef, (doc) => {
            if (doc.exists()) {
                const clubData = { id: doc.id, ...doc.data() };
                setClub(clubData);
                if (clubData.members && clubData.members.length > 0) {
                    fetchMembers(clubData.members);
                } else {
                    setMembers([]);
                }
            } else {
                alert("삭제되거나 존재하지 않는 모임입니다.");
                navigate('/clubs');
            }
        });

        const postsQuery = query(collection(db, 'clubs', clubId, 'club_posts'), orderBy('createdAt', 'desc'), limit(5));
        const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });

        const fetchMembers = async (memberIds) => {
            try {
                const memberPromises = [];
                // Firestore 'in' 쿼리는 30개 아이템 제한이 있음 (최신 SDK)
                for (let i = 0; i < memberIds.length; i += 30) {
                    const chunk = memberIds.slice(i, i + 30);
                    const q = query(collection(db, 'users'), where('__name__', 'in', chunk));
                    memberPromises.push(getDocs(q));
                }
                const memberSnapshots = await Promise.all(memberPromises);
                const fetchedMembers = [];
                memberSnapshots.forEach(snapshot => {
                    snapshot.forEach(doc => fetchedMembers.push({id: doc.id, ...doc.data()}));
                });
                setMembers(fetchedMembers);
            } catch (error) {
                console.error("멤버 정보 가져오기 오류:", error);
                setMembers([]);
            }
        };

        return () => {
            unsubscribeClub();
            unsubscribePosts();
        };
    }, [clubId, navigate]);

    if (club === null) return <LoadingSpinner />;

    const isCreator = currentUser.uid === club.creatorId;

    return (
        <div>
             <div className="relative">
                <img src={club.photoURL} alt={club.name} className="w-full h-48 object-cover bg-gray-300"/>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute top-4 left-4"><button onClick={() => navigate(-1)} className="text-white bg-black/30 p-2 rounded-full"><ArrowLeft/></button></div>
                {isCreator && <div className="absolute top-4 right-4"><button onClick={() => alert('수정 기능은 준비중입니다.')} className="text-white bg-black/30 p-2 rounded-full"><Edit2/></button></div>}
                <div className="absolute bottom-4 left-4 text-white">
                    <h2 className="text-2xl font-bold">{club.name}</h2>
                    <p className="text-sm">{club.description}</p>
                </div>
            </div>
            <div className="p-4">
                <section className="mb-6">
                     <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold">게시글</h3>
                        <a href="#" onClick={(e) => { e.preventDefault(); alert("준비중입니다.") }} className="text-sm font-medium text-gray-500 hover:text-gray-800">더 보기 <ChevronRight className="inline-block" size={14}/></a>
                    </div>
                </section>
                <section>
                    <h3 className="text-lg font-bold mb-3">멤버 ({club.members?.length || 0})</h3>
                    <div className="space-y-2">
                        {members.map(member => (
                            <div key={member.id} onClick={() => navigate(`/profile/${member.id}`)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
                                {member.photoURL ? <img src={member.photoURL} alt={member.displayName} className="w-8 h-8 rounded-full bg-gray-300 object-cover" /> : <UserCircle size={32} className="text-gray-400" />}
                                <span>{member.displayName}</span>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
             <button onClick={() => alert("준비중입니다.")} className="fixed bottom-24 right-5 bg-[#00462A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg"><PlusCircle size={28} /></button>
        </div>
    )
}

// =================================================================
// ▼▼▼ 레이아웃 및 라우팅 설정 ▼▼▼
// =================================================================

const MainLayout = ({ children }) => {
    return (
        <div className="relative">
            <Header />
            <main className="bg-white" style={{ minHeight: 'calc(100vh - 61px)'}}>
                {children}
            </main>
            <BottomNav />
        </div>
    );
};

// App.js 파일에서 기존 Header 컴포넌트를 찾아서 아래 코드로 완전히 교체하세요.

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, adminSelectedCity } = useAuth(); // adminSelectedCity도 가져옴
    
    // currentUser가 로드되기 전에는 헤더를 렌더링하지 않음 (오류 방지)
    if (!currentUser) {
        return null;
    }
    
    const hideHeaderOn = ['/post/write', '/news/write', '/profile/edit', '/clubs/create'];
    const shouldHide = hideHeaderOn.some(path => location.pathname.startsWith(path) || location.pathname.includes('/edit/'));
    if (shouldHide) return null;

    const mainPages = ['/home'];
    const isSubPage = !mainPages.includes(location.pathname) && location.pathname !== '/';
    
    const getPageTitle = () => {
        const { pathname } = location;

        if (pathname === '/home') {
            // 관리자가 특정 지역 뷰를 보고 있다면 해당 지역 이름 표시
            if (adminSelectedCity) {
                const cityName = adminSelectedCity.replace(/(특별시|광역시|특별자치시|도|시|군|구)$/, '');
                return `마을N ${cityName}`;
            }
            // 관리자 전체 뷰일 경우
            if (currentUser.isAdmin) {
                return '마을N';
            }
            // 일반 사용자일 경우
            const city = currentUser.city || '';
            const shortCityName = city.replace(/(특별시|광역시|특별자치시|도|시|군|구)$/, '');
            return `마을N ${shortCityName}`;
        }

        if(pathname.startsWith('/profile/')) return '프로필';
        if(pathname.startsWith('/post/')) return '게시글';
        if(pathname.startsWith('/chat/')) {
            return location.state?.recipientName || '채팅';
        }
        if(pathname.startsWith('/clubs/')) return '모임';

        const titleMap = {
            '/news': '소식', '/board': '게시판', '/clubs': '모임',
            '/calendar': '달력', '/search': '검색', '/notifications': '알림', '/chats': '채팅',
        };
        return titleMap[pathname] || '마을N';
    }
    const title = getPageTitle();

    return (
        <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-4 py-3 flex justify-between items-center border-b border-gray-200">
            <div className="flex items-center gap-2 flex-1">
                {isSubPage ? (<button onClick={() => navigate(-1)} className="p-1 -ml-2"><ArrowLeft size={24} /></button>) : (<Logo size={28} />)}
                <h1 className="text-xl font-bold text-gray-800 truncate">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
                <Link to="/search" className="p-1"><Search size={24} className="text-gray-600" /></Link>
                <Link to="/chats" className="p-1"><MessageSquare size={24} className="text-gray-600" /></Link>
                <Link to="/notifications" className="p-1"><Bell size={24} className="text-gray-600" /></Link>
                {currentUser && (
                    <Link to={`/profile/${currentUser.uid}`}>
                        {currentUser.photoURL ? 
                           <img src={currentUser.photoURL} alt="profile" className="w-8 h-8 rounded-full bg-gray-200 object-cover"/> :
                           <UserCircle size={32} className="text-gray-400"/>
                        }
                    </Link>
                )}
            </div>
        </header>
    );
};

const BottomNav = () => {
    const location = useLocation();
    const navItems = [
        { path: '/home', icon: Home, label: '홈' }, 
        { path: '/board', icon: LayoutGrid, label: '게시판' },
        { path: '/news', icon: Newspaper, label: '소식' },
        { path: '/clubs', icon: Users, label: '클럽' },
        { path: '/benefits', icon: TicketPercent, label: '혜택' },
    ];

    const hideNavOn = ['/post', '/profile', '/chat', '/search', '/notifications', '/calendar', '/post/write', '/news/write', '/profile/edit', '/clubs/create'];
    const shouldHide = hideNavOn.some(path => location.pathname.startsWith(path) || location.pathname.includes('/edit/'));
    if (shouldHide) return null;

    return (
        <footer className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto z-20">
            <div className="bg-white px-3 pt-2 pb-3 border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.05)]" style={{paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))'}}>
                <div className="flex justify-around items-center">
                    {navItems.map(item => {
                        const isActive = location.pathname.startsWith(item.path);
                        const IconComponent = item.icon;
                        return (
                            <Link to={item.path} key={item.path} onClick={(e) => {
                                if (item.path === '/benefits') {
                                    e.preventDefault();
                                    alert('서비스 준비중입니다.');
                                }
                            }} className="text-center p-2 rounded-lg w-1/5">
                                <IconComponent className={`w-6 h-6 mx-auto ${isActive ? 'text-[#00462A]' : 'text-gray-500'}`} />
                                <span className={`text-xs font-medium ${isActive ? 'text-[#00462A] font-bold' : 'text-gray-500'}`}>{item.label}</span>
                            </Link>
                        );
                    })}
                </div>
            </div>
        </footer>
    );
};

// App.js에서 ProtectedRoute를 이 코드로 교체하세요.

// App.js에서 기존 ProtectedRoute 컴포넌트를 이 코드로 완전히 교체하세요.

// App.js 파일에서 기존 ProtectedRoute 컴포넌트를 이 코드로 완전히 교체하세요.

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // 1. 최우선: 로딩 중일 때는 무조건 로딩 스피너 표시
    if (loading) {
        return (
            <div className="max-w-sm mx-auto bg-white min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // 2. 로그인하지 않은 사용자 처리
    if (!currentUser) {
        // /start 페이지에 있다면 그대로 머물게 함
        if (location.pathname === '/start') {
            return children;
        }
        // 다른 페이지에 접근하려고 하면 /start로 보냄
        return <Navigate to="/start" replace />;
    }

    // --- 여기서부터는 currentUser가 있는 경우 (로그인 한 사용자) ---
    
    // 3. 관리자 처리
    if (currentUser.isAdmin) {
        // 관리자가 /start나 /region-setup에 있다면 /home으로 보냄
        if (location.pathname === '/start' || location.pathname === '/region-setup') {
            return <Navigate to="/home" replace />;
        }
        // 그 외의 페이지는 정상적으로 보여줌
        return children;
    }
    
    // 4. 일반 사용자 처리
    if (!currentUser.isAdmin) {
        // 지역 정보가 있는 경우 (설정 완료)
        if (currentUser.city) {
            // /start나 /region-setup에 있다면 /home으로 보냄
            if (location.pathname === '/start' || location.pathname === '/region-setup') {
                return <Navigate to="/home" replace />;
            }
            // 그 외의 페이지는 정상적으로 보여줌
            return children;
        }
        
        // 지역 정보가 없는 경우 (설정 필요)
        if (!currentUser.city) {
            // /region-setup이 아닌 다른 곳에 있다면 /region-setup으로 보냄
            if (location.pathname !== '/region-setup') {
                return <Navigate to="/region-setup" replace />;
            }
            // /region-setup 페이지에 있다면 정상적으로 보여줌
            return children;
        }
    }

    // 위 모든 조건에 해당하지 않는 예외적인 경우를 위해 기본 children 반환
    return children;
};
// --- 최상위 App 컴포넌트 ---
// App.js에서 최상위 App 컴포넌트를 이 코드로 완전히 교체하세요.

// 최상위 App 컴포넌트

// App.js에서 최상위 App 컴포넌트를 이 코드로 완전히 교체하세요.

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <div className="max-w-sm mx-auto bg-gray-50 shadow-lg min-h-screen font-sans text-gray-800">
                    <Routes>
                        {/* 1. 로그인/지역설정이 필요 없는 공개 라우트 */}
                        <Route path="/start" element={<StartPage />} />
                        <Route path="/region-setup" element={<RegionSetupPage />} />

                        {/* 2. 로그인이 필요한 보호된 라우트 */}
                        <Route path="/*" element={
                            <ProtectedRoute>
                                <MainLayout>
                                    <Routes>
                                        <Route path="/home" element={<HomePage />} />
                                        <Route path="/news" element={<NewsPage />} />
                                        <Route path="/news/write" element={<NewsWritePage />} />
                                        <Route path="/news/edit/:newsId" element={<NewsWritePage />} />
                                        <Route path="/board" element={<BoardPage />} />
                                        <Route path="/post/write" element={<WritePage />} />
                                        <Route path="/post/edit/:postId" element={<WritePage />} />
                                        <Route path="/post/:postId" element={<PostDetailPage />} />
                                        <Route path="/calendar" element={<CalendarPage />} />
                                        <Route path="/profile/:userId" element={<UserProfilePage />} />
                                        <Route path="/profile/edit" element={<ProfileEditPage />} />
                                        <Route path="/search" element={<SearchPage />} />
                                        <Route path="/notifications" element={<NotificationsPage />} />
                                        <Route path="/chats" element={<ChatListPage />} />
                                        <Route path="/chat/:chatId" element={<ChatPage />} />
                                        <Route path="/clubs" element={<ClubListPage />} />
                                        <Route path="/clubs/create" element={<ClubCreatePage />} />
                                        <Route path="/clubs/:clubId" element={<ClubDetailPage />} />
                                        {/* 다른 모든 경로를 /home으로 리디렉션 */}
                                        <Route path="*" element={<Navigate to="/home" replace />} />
                                    </Routes>
                                </MainLayout>
                            </ProtectedRoute>
                        } />
                    </Routes>
                </div>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
// --- END OF FILE App.js ---