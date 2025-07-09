// src/App.js

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, updateProfile, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, setDoc, getDoc, updateDoc, increment, arrayUnion, arrayRemove, Timestamp, where, orderBy, limit, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Home, Newspaper, LayoutGrid, Users, TicketPercent, ArrowLeft, Heart, MessageCircle, Send, PlusCircle, ChevronLeft, ChevronRight, X, Search, Bell, Star, Pencil, LogOut, Edit, MessageSquare, Trash2, ImageUp, UserCircle, Lock, Edit2 } from 'lucide-react';

// 외부 파일에서 함수 및 변수 import
import { fetchRegions, fetchCities } from './services/region.service';
import { timeSince } from './utils/timeSince';
import { ADMIN_UID, categoryStyles, getCategoryStyle } from './constants';

// Firebase 초기화 (App.js 내에서 한 번만 수행)
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
const AuthContext = createContext();

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
                    if (finalUser.photoURL && finalUser.photoURL.startsWith('http://')) {
                        finalUser.photoURL = finalUser.photoURL.replace('http://', 'https://');
                    }
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        let firestorePhotoURL = userData.photoURL || finalUser.photoURL;
                        if (firestorePhotoURL && firestorePhotoURL.startsWith('http://')) {
                            firestorePhotoURL = firestorePhotoURL.replace('http://', 'https://');
                        }
                        finalUser = { ...user, ...userData, photoURL: firestorePhotoURL, isFirestoreDataLoaded: true };
                    } else {
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
    <img src="/logo192.png" alt="Logo" width={size} height={size} style={{ objectFit: 'contain' }}/>
);

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
                    <div className="w-6"></div>
                    <h2 className="text-lg font-bold"> </h2> {/* 모달 제목 필요시 여기에 */}
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

const PwaInstallModal = ({ isOpen, onClose }) => {
    const [isIOS, setIsIOS] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        setIsIOS(/iphone|ipad|ipod/.test(userAgent));
    }, []);

    if (!isOpen) return null;

    const ShareIosIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block w-5 h-5 mx-1 align-middle"><path d="M12 22V8"/><path d="m7 13 5-5 5 5"/><path d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5"/></svg>
    );
    const PlusSquareIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block w-5 h-5 mx-1 align-middle"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>
    );
    const MoreVerticalIcon = () => (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block w-5 h-5 mx-1 align-middle"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
    );

    const iosInstructions = (
        <div className="text-center">
            <p className="text-lg font-semibold mb-4">iOS에서는</p>
            <p className="mb-4">공유 버튼 <ShareIosIcon /> 을 누른 후</p>
            <p className="mb-6">'홈 화면에 추가' <PlusSquareIcon /> 를 선택해주세요.</p>
        </div>
    );

    const androidInstructions = (
        <div className="text-center">
            <p className="text-lg font-semibold mb-4">Android에서는</p>
            <p className="mb-4">오른쪽 상단 메뉴 <MoreVerticalIcon /> 를 누른 후</p>
            <p className="mb-6">'홈 화면에 추가' 또는 '앱 설치'를 선택해주세요.</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700">
                    <X size={24} />
                </button>
                {isIOS ? iosInstructions : androidInstructions}
                <button
                    onClick={onClose}
                    className="w-full mt-4 text-center text-blue-600 font-semibold py-2"
                >
                    닫기
                </button>
            </div>
        </div>
    );
};

const NewsCard = ({ news, isAdmin, openDetailModal, handleDeleteNews, handleLikeNews, isLiked }) => {
    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            {news.imageUrl && <img src={news.imageUrl} alt={news.title} className="w-full h-32 object-cover" />}
            <div className="p-4">
                <h3 className="font-bold text-lg truncate mb-1">{news.title}</h3>
                <p className="text-gray-600 text-sm h-10 overflow-hidden text-ellipsis mb-3">{news.content}</p>
                <div className="flex justify-between items-center text-xs text-gray-500">
                    <button onClick={() => openDetailModal(news)} className="font-semibold text-blue-600 hover:underline">자세히 보기</button>
                    <div className="flex items-center gap-2">
                        {isAdmin && <button onClick={() => handleDeleteNews(news.id, news.imagePath)} className="text-red-500"><Trash2 size={16} /></button>}
                        <button onClick={() => handleLikeNews(news)} className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-400'}`}>
                            <Heart size={16} className={isLiked ? 'fill-current' : ''}/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Calendar = ({ events, onDateClick }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const today = new Date();
    
    const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();

    const changeMonth = (offset) => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow">
            <div className="flex justify-between items-center mb-4">
                <button onClick={() => changeMonth(-1)}><ChevronLeft/></button>
                <h3 className="font-bold text-lg">{`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}</h3>
                <button onClick={() => changeMonth(1)}><ChevronRight/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => <div key={day} className="font-semibold text-gray-600">{day}</div>)}
                {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                {Array.from({ length: daysInMonth }).map((_, day) => {
                    const date = day + 1;
                    const fullDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    const isToday = today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth() && today.getDate() === date;
                    const hasEvent = events[fullDateStr] && events[fullDateStr].length > 0;
                    return (
                        <div key={date} onClick={() => onDateClick(fullDateStr)} className="py-2 cursor-pointer relative">
                            <span className={`mx-auto flex items-center justify-center rounded-full w-8 h-8 ${isToday ? 'bg-red-500 text-white' : ''} ${hasEvent ? 'font-bold' : ''}`}>
                                {date}
                            </span>
                            {hasEvent && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// =================================================================
// ▼▼▼ 페이지 컴포넌트들 ▼▼▼
// =================================================================

const StartPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);

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
                 setError("카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>마을N - 우리 동네 SNS, 대한민국 지역기반 커뮤니티</title>
                <meta name="description" content="우리 동네의 새로운 소식과 정보를 마을N에서 확인하세요! 마을N은 주민들이 함께 만들고 소통하는 한국형 지역기반 소셜 네트워크 서비스입니다." />
                <meta property="og:type" content="website" />
                <meta property="og:title" content="마을N - 우리 동네 SNS" />
                <meta property="og:description" content="주민들이 함께 만들고 소통하는 지역기반 커뮤니티, 마을N에서 우리 동네의 새로운 소식을 확인하세요!" />
                <meta property="og:url" content="https://www.maeuln.net/" />
                <meta property="og:image" content="https://www.maeuln.net/logo512.png" />
            </Helmet>

            <PwaInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

            <div className="flex flex-col items-center justify-center h-screen bg-green-50 p-4">
                <div className="text-center mb-8 flex flex-col items-center">
                    <Logo size={80} />
                    <h1 className="text-3xl font-bold text-gray-800 mt-4">마을N</h1>
                    <p className="text-gray-600 mt-2 text-center">전국 모든 마을의 이야기<br/>'마을N'에서 확인하세요!</p>
                </div>
                <div className="w-full max-w-xs">
                    {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
                    <button onClick={handleKakaoLogin} disabled={loading} className="w-full bg-[#FEE500] text-[#3C1E1E] font-bold py-3 px-4 rounded-lg flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors disabled:bg-gray-400">
                        <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.89 0 1.75-.12 2.56-.34l-1.39 4.34c-.08.24.16.45.4.39l4.9-3.06c1.8-1.48 2.53-3.88 2.53-6.33C22 6.48 17.52 2 12 2z" fill="#3C1E1E"/></svg>
                        {loading ? "로그인 중..." : "카카오로 3초만에 시작하기"}
                    </button>
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="text-sm text-gray-600 hover:text-gray-900 font-semibold underline"
                        >
                            마을N 앱 다운받기
                        </button>
                    </div>
                </div>
            </div>
        </>
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
                followerCount: 0,
                followers: [],
                following: [],
                likedNews: []
            }, { merge: true });
        } catch (e) {
            console.error("Region save error:", e);
            setError("저장에 실패했습니다. 다시 시도해주세요.");
            setLoading(false);
        }
    };

    const isCityDropdownDisabled = !selectedRegion || apiLoading || cities.length <= 1;

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

const HomePage = () => {
    const { currentUser, adminSelectedCity } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState(null);
    const [buanNews, setBuanNews] = useState(null);
    const [followingPosts, setFollowingPosts] = useState([]);
    const [userEvents, setUserEvents] = useState({});
    const [likedNews, setLikedNews] = useState([]);

    const displayCity = adminSelectedCity || (currentUser.isAdmin ? '전국' : currentUser.city);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);

    const openDetailModal = (news) => { setSelectedNews(news); setDetailModalOpen(true); };

    useEffect(() => {
        if (!currentUser || (!currentUser.isAdmin && !currentUser.city)) return;

        const currentTargetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);

        if (!currentUser.isAdmin && !currentTargetCity) {
            setPosts([]); setBuanNews([]); return;
        }

        const unsubscribes = [];
        setLikedNews(currentUser.likedNews || []);

        const basePostsQuery = currentTargetCity ? [where("city", "==", currentTargetCity)] : [];
        const postsQuery = query(collection(db, "posts"), ...basePostsQuery, orderBy("createdAt", "desc"), limit(50));
        unsubscribes.push(onSnapshot(postsQuery, (snapshot) => setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), () => setPosts([])));

        const baseNewsQuery = currentTargetCity ? [where("city", "==", currentTargetCity)] : [];
        const newsQuery = query(collection(db, "news"), ...baseNewsQuery, orderBy("createdAt", "desc"));
        unsubscribes.push(onSnapshot(newsQuery, (snapshot) => setBuanNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))), () => setBuanNews([])));

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

    if (posts === null || buanNews === null) return <LoadingSpinner />;

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
    const [likedNews, setLikedNews] = useState(currentUser?.likedNews || []);

    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [activeTag, setActiveTag] = useState('전체');
    const tags = ['전체', '교육', '문화', '청년', '농업', '안전', '운동', '행사', '복지'];

    useEffect(() => {
        if (!currentUser) return;
        const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);

        if (!currentUser.isAdmin && !targetCity) {
            setBuanNews([]); return;
        }

        const baseQuery = targetCity ? [where("city", "==", targetCity)] : [];
        const q = query(collection(db, "news"), ...baseQuery, orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setBuanNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching news:", error);
            setBuanNews([]);
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

    if (buanNews === null) return <LoadingSpinner />;

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

const CalendarPage = () => {
    const { currentUser } = useAuth();
    const location = useLocation();
    const [userEvents, setUserEvents] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [eventTitle, setEventTitle] = useState('');

    useEffect(() => {
        if (!currentUser) return;
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
    }, [currentUser]);

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

const BoardPage = () => {
    const { currentUser, adminSelectedCity } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState(null);
    const [filter, setFilter] = useState('전체');

    const userCity = currentUser?.city;
    const dynamicMomCategory = userCity ? `${userCity}맘` : '마을맘';
    const categories = ['전체', '일상', '친목', '10대', '청년', '중년', dynamicMomCategory, '질문', '기타'];

    useEffect(() => {
        if (!currentUser) return;
        const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);
        if (!currentUser.isAdmin && !targetCity) {
            setPosts([]); return;
        };

        const postsCollection = collection(db, "posts");
        let queryConstraints = [];

        if (targetCity) queryConstraints.push(where("city", "==", targetCity));
        if (filter !== '전체') queryConstraints.push(where("category", "==", filter));
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

    if (posts === null) return <LoadingSpinner />;

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

    const [allRegions, setAllRegions] = useState([]);
    const [selectedPostRegion, setSelectedPostRegion] = useState(itemToEdit ? `${itemToEdit.region}|${itemToEdit.city}` : '');

    const userCity = currentUser?.city;
    const dynamicMomCategory = userCity ? `${userCity}맘` : '마을맘';
    const categories = ['일상', '친목', '10대', '청년', '중년', dynamicMomCategory, '질문', '기타'];
    const [category, setCategory] = useState(itemToEdit?.category || '일상');

    useEffect(() => {
        if (currentUser?.isAdmin) {
            const loadAllRegions = async () => {
                const sidos = await fetchRegions();
                const allCitiesPromises = sidos.map(sido => fetchCities(sido));
                const allCitiesArrays = await Promise.all(allCitiesPromises);

                const flattenedRegions = sidos.flatMap((sido, index) =>
                    allCitiesArrays[index].map(city => ({
                        region: sido,
                        city: city,
                        label: sido === city ? sido : `${sido} ${city}`
                    }))
                ).filter((v,i,a)=>a.findIndex(t=>(t.label === v.label))===i); // 중복 제거

                setAllRegions(flattenedRegions);
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
            alert('제목과 내용을 모두 입력해주세요.'); return;
        }
        if (currentUser.isAdmin && !selectedPostRegion) {
            alert('게시글을 등록할 지역을 선택해주세요.'); return;
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
                title, content, category, imageUrl, imagePath,
                updatedAt: Timestamp.now(), region, city,
            };

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
        if (!postId) { navigate('/board'); return; }
        const postRef = doc(db, `posts`, postId);
        const unsubscribePost = onSnapshot(postRef, (doc) => {
            if (doc.exists()) {
                setPost({ id: doc.id, ...doc.data() });
            } else {
                alert("삭제된 게시글입니다."); navigate('/board');
            }
        });

        const commentsRef = collection(db, `posts/${postId}/comments`);
        const q = query(commentsRef, orderBy("createdAt", "asc"));
        const unsubscribeComments = onSnapshot(q, (snapshot) => {
            setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubscribePost(); unsubscribeComments(); };
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
                authorPhotoURL: currentUser.photoURL,
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
        const commentSnap = await getDoc(commentRef);
        if (!commentSnap.exists()) return;
        const currentLikes = commentSnap.data().likes || [];
        await updateDoc(commentRef, {
            likes: currentLikes.includes(currentUser.uid) ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
        });
    };

    const handleDelete = async (postId, imagePath) => {
        if (!post || (post.authorId !== currentUser.uid && !currentUser.isAdmin)) return;
        if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
            try {
                await deleteDoc(doc(db, 'posts', postId));
                if (imagePath) { await deleteObject(ref(storage, imagePath)); }
                alert("게시글이 삭제되었습니다.");
                navigate('/board');
            } catch (error) {
                console.error("Error deleting post:", error);
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    if (post === null) return <LoadingSpinner />;

    const isAuthor = post.authorId === currentUser?.uid;
    const isLiked = post.likes?.includes(currentUser?.uid);
    const isBookmarked = post.bookmarks?.includes(currentUser?.uid);
    const style = getCategoryStyle(post.category, post.city);

    return (
        <div className="pb-20">
            <div className="p-4">
                <div className="mb-4 pb-4 border-b">
                    <span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md mb-2 inline-block`}>{post.category}</span>
                    <div className="flex justify-between items-start mt-2">
                        <h1 className="text-2xl font-bold flex-1 pr-4">{post.title}</h1>
                        <div className="flex items-center gap-2">
                            {(isAuthor || currentUser.isAdmin) && (
                                <>
                                    {isAuthor && <button onClick={() => navigate(`/post/edit/${post.id}`, { state: { itemToEdit: post }})} className="p-1 text-gray-500 hover:text-blue-600"><Pencil size={20} /></button>}
                                    <button onClick={() => handleDelete(post.id, post.imagePath)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={20} /></button>
                                </>
                            )}
                            <button onClick={handleBookmark} className="p-1 -mr-1">
                                <Star size={22} className={isBookmarked ? "text-yellow-400 fill-current" : "text-gray-400"} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-4 cursor-pointer" onClick={() => navigate(`/profile/${post.authorId}`)}>
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-2 overflow-hidden flex items-center justify-center">
                            {post.authorPhotoURL ? <img src={post.authorPhotoURL} alt={post.authorName} className="w-full h-full object-cover" /> : <UserCircle size={32} className="text-gray-400" />}
                        </div>
                        <span className="font-semibold hover:underline">{post.authorName}</span>
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
                             <div className="w-8 h-8 rounded-full bg-gray-200 mt-1 flex-shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${comment.authorId}`)}>
                                 {comment.authorPhotoURL ? <img src={comment.authorPhotoURL} alt={comment.authorName} className="w-full h-full object-cover rounded-full" /> : <UserCircle size={32} className="text-gray-400"/>}
                             </div>
                             <div className="flex-1">
                                <div className="bg-gray-100 p-3 rounded-lg">
                                    <p onClick={() => navigate(`/profile/${comment.authorId}`)} className="font-semibold text-sm cursor-pointer hover:underline">{comment.authorName}</p>
                                    <p className="text-gray-800">{comment.text}</p>
                                </div>
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                    <span>{timeSince(comment.createdAt)}</span>
                                    <button onClick={() => handleCommentLike(comment.id)} className="ml-4 flex items-center hover:text-red-500">
                                      <Heart size={12} className={comment.likes?.includes(currentUser?.uid) ? 'text-red-500 fill-current' : ''} />
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

const UserProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { currentUser, adminSelectedCity, setAdminSelectedCity } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState(null);
    const [allRegions, setAllRegions] = useState([]);
    const [isAdminModeOn, setIsAdminModeOn] = useState(!!adminSelectedCity);

    useEffect(() => {
        if (currentUser?.isAdmin) {
            const loadAllRegions = async () => {
                const sidos = await fetchRegions();
                const allCitiesPromises = sidos.map(sido => fetchCities(sido));
                const allCitiesArrays = await Promise.all(allCitiesPromises);

                const flattenedRegions = sidos.flatMap((sido, index) =>
                    allCitiesArrays[index].map(city => ({
                        region: sido,
                        city: city,
                        label: sido === city ? sido : `${sido} ${city}`
                    }))
                ).filter((v,i,a)=>a.findIndex(t=>(t.label === v.label))===i);

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
        if (!newAdminModeState) {
            setAdminSelectedCity(null);
        }
    };

    const handleRegionViewChange = (e) => {
        const value = e.target.value;
        setAdminSelectedCity(value === "admin_view" ? null : value.split('|')[1]);
        navigate('/home');
    };

    const handleFollow = async () => {
        if (!currentUser || !profileUser) return;
        const currentUserRef = doc(db, 'users', currentUser.uid);
        const profileUserRef = doc(db, 'users', userId);
        try {
            const isCurrentlyFollowing = profileUser.followers?.includes(currentUser.uid);
            const batch = writeBatch(db);
            if (isCurrentlyFollowing) {
                batch.update(currentUserRef, { following: arrayRemove(userId) });
                batch.update(profileUserRef, { followers: arrayRemove(currentUser.uid) });
            } else {
                batch.update(currentUserRef, { following: arrayUnion(userId) });
                batch.update(profileUserRef, { followers: arrayUnion(currentUser.uid) });
            }
            await batch.commit();
        } catch (error) {
            console.error("팔로우 처리 중 오류:", error);
            alert("팔로우 처리 중 오류가 발생했습니다.");
        }
    };

    const handleLogout = async () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            await signOut(auth);
            navigate('/start');
        }
    };

    const handleMessage = () => {
        const chatId = [currentUser.uid, userId].sort().join('_');
        navigate(`/chat/${chatId}`, { state: { recipientId: userId, recipientName: profileUser.displayName }});
    };

    if(profileUser === null || userPosts === null) return <LoadingSpinner />;
    if(!profileUser) return <div className='p-4 text-center'>사용자를 찾을 수 없습니다.</div>;

    const isMyProfile = currentUser.uid === userId;
    const isFollowing = profileUser.followers?.includes(currentUser.uid) || false;
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
                        <button
                            onClick={handleFollow}
                            className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                                isFollowing
                                ? 'bg-gray-200 text-[#00462A]'
                                : 'bg-[#00462A] text-white'
                            }`}
                        >
                            {isFollowing ? '✓ 팔로잉' : '+ 팔로우'}
                        </button>
                        <button
                            onClick={handleMessage}
                            className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-[#00462A] border border-[#00462A] flex items-center justify-center gap-1.5"
                        >
                             <MessageSquare size={16} /> 메시지
                        </button>
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
                                value={adminSelectedCity ? `${allRegions.find(r=>r.city===adminSelectedCity)?.region}|${adminSelectedCity}` : 'admin_view'}
                                onChange={handleRegionViewChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A]"
                            >
                                <option value="admin_view">전체 보기 (관리자)</option>
                                {allRegions.map(r => (
                                    <option key={r.label} value={`${r.region}|${r.city}`}>{r.label}</option>
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
            setResults([]); return;
        }
        setLoading(true);
        try {
            const postsRef = collection(db, 'posts');
            let q;
            if (targetCity) {
                q = query(postsRef,
                    where('city', '==', targetCity),
                    where('title', '>=', searchTerm),
                    where('title', '<=', searchTerm + '\uf8ff')
                );
            } else {
                q = query(postsRef,
                    where('title', '>=', searchTerm),
                    where('title', '<=', searchTerm + '\uf8ff')
                );
            }

            const querySnapshot = await getDocs(q);
            setResults(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
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
                    {results.length > 0 ? results.map(post => (
                        <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                            <h3 className="font-bold text-md truncate mb-1">{post.title}</h3>
                            <p className="text-gray-600 text-sm truncate">{post.content}</p>
                        </div>
                    )) : searchTerm && (
                        <p className="text-center text-gray-500 py-10">검색 결과가 없습니다.</p>
                    )}
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
        if (!currentUser) return;

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
        }, (error) => {
            console.error("Error listening to chat list:", error);
            setChats([]);
        });

        return () => unsubscribe();
    }, [currentUser]);

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

    const recipientId = location.state?.recipientId;

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isAllowed, setIsAllowed] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!chatId || !currentUser) return;

        const chatRef = doc(db, 'chats', chatId);
        const unsubscribe = onSnapshot(chatRef, (chatSnap) => {
            if (chatSnap.exists()) {
                const data = chatSnap.data();
                if (data.members?.includes(currentUser.uid)) {
                    setIsAllowed(true);
                } else {
                    console.warn("접근 권한이 없습니다."); setIsAllowed(false);
                }
            } else {
                 setIsAllowed(true); // 새 채팅방
            }
            setLoading(false);
        }, (error) => {
            console.error("Error listening to chat document:", error);
            setIsAllowed(false); setLoading(false);
        });

        const messagesRef = collection(chatRef, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        const messagesUnsubscribe = onSnapshot(q, (snapshot) => {
            setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        return () => { unsubscribe(); messagesUnsubscribe(); };
    }, [chatId, currentUser]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !recipientId) return;

        const messageData = {
            text: newMessage, senderId: currentUser.uid, createdAt: Timestamp.now(),
        };

        const chatRef = doc(db, 'chats', chatId);
        try {
            const chatSnap = await getDoc(chatRef);
            const batch = writeBatch(db);

            if (!chatSnap.exists()) {
                batch.set(chatRef, { members: [currentUser.uid, recipientId], lastMessage: messageData });
            } else {
                batch.update(chatRef, { lastMessage: messageData });
            }

            const newMessageRef = doc(collection(chatRef, 'messages'));
            batch.set(newMessageRef, messageData);
            await batch.commit();
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
            alert("메시지 전송 중 오류가 발생했습니다.");
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!isAllowed) return <div className="p-4 text-center text-red-500">이 채팅방에 접근할 권한이 없습니다.</div>;

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

    const myClubs = clubs.filter(club => club.members?.includes(currentUser.uid));
    const displayedClubs = activeTab === '내 모임' ? myClubs : clubs;

    const handleEnterClub = (club) => {
        if (club.members?.includes(currentUser.uid) || !club.password) {
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
            } catch (error) { alert("모임 입장에 실패했습니다."); }
             finally {
                setPasswordModalOpen(false); setPassword(''); setSelectedClub(null);
            }
        } else {
            alert('비밀번호가 일치하지 않습니다.');
        }
    };

    const handleCreatorClick = (e, creatorId) => {
        e.stopPropagation(); navigate(`/profile/${creatorId}`);
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
                    >내 모임</button>
                    <button
                        onClick={() => setActiveTab('전체 모임')}
                        className={`px-4 py-1 text-sm font-semibold rounded-md ${activeTab === '전체 모임' ? 'bg-white shadow' : 'text-gray-600'}`}
                    >전체 모임</button>
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
            alert('모임 이름, 소개, 대표 사진은 필수입니다.'); return;
        }
        setIsSubmitting(true);
        try {
            const imagePath = `club_images/${currentUser.uid}/${Date.now()}_${imageFile.name}`;
            const storageRef = ref(storage, imagePath);
            await uploadBytes(storageRef, imageFile);
            const photoURL = await getDownloadURL(storageRef);

            await addDoc(collection(db, 'clubs'), {
                name, description, category, password, photoURL, imagePath,
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
        if (!clubId) { navigate('/clubs'); return; }

        const clubRef = doc(db, 'clubs', clubId);
        const unsubscribeClub = onSnapshot(clubRef, (doc) => {
            if (doc.exists()) {
                const clubData = { id: doc.id, ...doc.data() };
                setClub(clubData);
                if (clubData.members?.length > 0) fetchMembers(clubData.members);
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
            } catch (error) { console.error("멤버 정보 가져오기 오류:", error); }
        };

        return () => { unsubscribeClub(); unsubscribePosts(); };
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

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, adminSelectedCity } = useAuth();

    if (!currentUser) return null;

    const hideHeaderOn = ['/post/write', '/news/write', '/profile/edit', '/clubs/create', '/post/edit', '/news/edit'];
    const shouldHide = hideHeaderOn.some(path => location.pathname.startsWith(path));
    if (shouldHide) return null;

    const mainPages = ['/home'];
    const isSubPage = !mainPages.includes(location.pathname) && location.pathname !== '/';

    const getPageTitle = () => {
        const { pathname } = location;

        if (pathname === '/home') {
            if (adminSelectedCity) {
                return `마을N ${adminSelectedCity.replace(/(특별시|광역시|특별자치시|도|시|군|구)$/, '')}`;
            }
            if (currentUser.isAdmin) return '마을N';
            return `마을N ${currentUser.city?.replace(/(특별시|광역시|특별자치시|도|시|군|구)$/, '') || ''}`;
        }

        if(pathname.startsWith('/profile/')) return '프로필';
        if(pathname.startsWith('/post/')) return '게시글';
        if(pathname.startsWith('/chat/')) return location.state?.recipientName || '채팅';
        if(pathname.startsWith('/clubs/')) return '모임';

        const titleMap = {
            '/news': '소식', '/board': '게시판', '/calendar': '달력',
            '/search': '검색', '/notifications': '알림', '/chats': '채팅',
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

    const hideNavOn = ['/start', '/region-setup', '/post/', '/profile/', '/chat/', '/search', '/notifications', '/calendar'];
    const shouldHide = hideNavOn.some(path => location.pathname.startsWith(path));
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

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    // 1. 인증 정보를 확인하거나, Firestore에서 프로필 정보를 불러오는 중이면 로딩 화면을 보여줍니다.
    // currentUser.isFirestoreDataLoaded 체크가 핵심입니다!
    if (loading || (currentUser && !currentUser.isFirestoreDataLoaded)) {
        return (
            <div className="max-w-sm mx-auto bg-white min-h-screen flex items-center justify-center">
                <LoadingSpinner />
            </div>
        );
    }

    // --- 여기부터는 로딩이 끝난 후의 로직입니다 ---

    // 2. 로그인하지 않은 사용자 처리
    if (!currentUser) {
        // /start 페이지만 허용하고, 다른 곳으로 가려고 하면 /start로 보냅니다.
        return location.pathname === '/start' ? children : <Navigate to="/start" replace />;
    }

    // 3. 관리자 사용자 처리
    if (currentUser.isAdmin) {
        // 관리자가 실수로 설정 페이지로 가면 /home으로 보냅니다.
        if (location.pathname === '/start' || location.pathname === '/region-setup') {
            return <Navigate to="/home" replace />;
        }
        // 그 외 모든 페이지는 접근 가능합니다.
        return children;
    }

    // 4. 지역 설정이 필요한 일반 사용자 처리
    if (!currentUser.city) {
        // /region-setup 페이지만 허용하고, 다른 곳으로 가려고 하면 /region-setup으로 보냅니다.
        return location.pathname === '/region-setup' ? children : <Navigate to="/region-setup" replace />;
    }

    // 5. 모든 설정이 완료된 일반 사용자 처리
    if (currentUser.city) {
        // 설정이 끝난 사용자가 다시 설정 페이지로 가면 /home으로 보냅니다.
        if (location.pathname === '/start' || location.pathname === '/region-setup') {
            return <Navigate to="/home" replace />;
        }
        // 그 외 모든 페이지는 접근 가능합니다.
        return children;
    }

    // 혹시 모를 예외 상황 시 안전하게 /start로 보냅니다.
    return <Navigate to="/start" replace />;
};
// --- 최상위 App 컴포넌트 ---
function App() {
    return (
        <HelmetProvider>
            <AuthProvider>
                <BrowserRouter>
                    <div className="max-w-sm mx-auto bg-gray-50 shadow-lg min-h-screen font-sans text-gray-800">
                        {/* 모든 라우트를 ProtectedRoute가 감싸도록 구조를 변경합니다. */}
                        <Routes>
                            <Route path="/*" element={
                                <ProtectedRoute>
                                    <Routes>
                                        {/* 보호되지 않아야 할 경로는 여기에 둡니다. */}
                                        <Route path="/start" element={<StartPage />} />
                                        <Route path="/region-setup" element={<RegionSetupPage />} />
                                        
                                        {/* 보호되어야 할 경로는 MainLayout으로 감쌉니다. */}
                                        <Route path="/home" element={<MainLayout><HomePage /></MainLayout>} />
                                        <Route path="/news" element={<MainLayout><NewsPage /></MainLayout>} />
                                        <Route path="/news/write" element={<MainLayout><NewsWritePage /></MainLayout>} />
                                        <Route path="/news/edit/:newsId" element={<MainLayout><NewsWritePage /></MainLayout>} />
                                        <Route path="/board" element={<MainLayout><BoardPage /></MainLayout>} />
                                        <Route path="/post/write" element={<MainLayout><WritePage /></MainLayout>} />
                                        <Route path="/post/edit/:postId" element={<MainLayout><WritePage /></MainLayout>} />
                                        <Route path="/post/:postId" element={<MainLayout><PostDetailPage /></MainLayout>} />
                                        <Route path="/calendar" element={<MainLayout><CalendarPage /></MainLayout>} />
                                        <Route path="/profile/:userId" element={<MainLayout><UserProfilePage /></MainLayout>} />
                                        <Route path="/profile/edit" element={<MainLayout><ProfileEditPage /></MainLayout>} />
                                        <Route path="/search" element={<MainLayout><SearchPage /></MainLayout>} />
                                        <Route path="/notifications" element={<MainLayout><NotificationsPage /></MainLayout>} />
                                        <Route path="/chats" element={<MainLayout><ChatListPage /></MainLayout>} />
                                        <Route path="/chat/:chatId" element={<MainLayout><ChatPage /></MainLayout>} />
                                        <Route path="/clubs" element={<MainLayout><ClubListPage /></MainLayout>} />
                                        <Route path="/clubs/create" element={<MainLayout><ClubCreatePage /></MainLayout>} />
                                        <Route path="/clubs/:clubId" element={<MainLayout><ClubDetailPage /></MainLayout>} />
                                        
                                        {/* 다른 모든 경로는 /home으로 리디렉션 */}
                                        <Route path="*" element={<Navigate to="/home" replace />} />
                                    </Routes>
                                </ProtectedRoute>
                            }/>
                        </Routes>
                    </div>
                </BrowserRouter>
            </AuthProvider>
        </HelmetProvider>
    );
}

export default App;