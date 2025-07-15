// src/App.js

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, updateProfile, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, setDoc, getDoc, updateDoc, increment, arrayUnion, arrayRemove, Timestamp, where, orderBy, limit, deleteDoc, getDocs, writeBatch, runTransaction } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Home, Newspaper, LayoutGrid, Users, TicketPercent, ArrowLeft, Heart, MessageCircle, Send, PlusCircle, ChevronLeft, ChevronRight, X, Search, Bell, Star, Pencil, LogOut, Edit, MessageSquare, Trash2, ImageUp, UserCircle, Lock, Edit2, Calendar as CalendarIcon, Settings, AlertTriangle, Building, Briefcase, Store, HelpCircle } from 'lucide-react';

// 외부 파일 import
import { fetchRegions, fetchCities, getAllRegionCityMap } from './services/region.service';
import { timeSince } from './utils/timeSince';
import { ADMIN_UID, categoryStyles, getCategoryStyle } from './constants';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Firebase 초기화
const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "demo-api-key",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "demo.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "demo-project",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "demo.appspot.com",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "123456789",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "demo-app-id",
    measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID || "demo-measurement-id"
};

let app, auth, db, storage;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
} catch (error) {
    console.error("Firebase 초기화 오류:", error);
    // 기본값으로 초기화
    app = null;
    auth = null;
    db = null;
    storage = null;
}

// =================================================================
// ▼▼▼ 로고, 헬퍼, 공용 컴포넌트 ▼▼▼
// =================================================================
const Logo = ({ size = 28 }) => (<img src="/logo192.png" alt="Logo" width={size} height={size} style={{ objectFit: 'contain' }}/>);

const Modal = ({ isOpen, onClose, children, title = " " }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10">
                    <h2 className="text-lg font-bold">{title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
};

const LoadingSpinner = () => (<div className="flex justify-center items-center h-full pt-20"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00462A]"></div></div>);

const SkeletonUI = () => (
    <div className="p-4 space-y-4">
        <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
        <div className="h-24 bg-gray-200 rounded-lg animate-pulse"></div>
    </div>
);

const EmptyState = ({icon, message}) => (
    <div className="text-center py-20 text-gray-500 flex flex-col items-center bg-gray-50 rounded-lg">
        <div className="mb-4 text-gray-400">{icon}</div>
        <p>{message}</p>
    </div>
);

const NewsCard = ({ news, isAdmin, openDetailModal, handleDeleteNews, handleLikeNews, isLiked }) => (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden w-full"> 
        {news.imageUrl && <img src={news.imageUrl} alt={news.title} className="w-full h-40 object-cover" />}
        <div className="p-4">
            <h3 className="font-bold text-lg truncate mb-1">{news.title}</h3>
            <p className="text-gray-600 text-sm h-10 overflow-hidden text-ellipsis mb-3">{news.content}</p>
            <div className="flex justify-between items-center text-xs text-gray-500">
                <div className="flex items-center gap-2">
                    <button onClick={() => openDetailModal(news)} className="font-semibold text-blue-600 hover:underline">자세히 보기</button>
                    {/* '신청하기' 버튼 조건부 렌더링 */}
                    {news.linkUrl && (
                        <a 
                            href={news.linkUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()} // 카드 전체가 클릭되는 것을 방지
                            className="font-semibold text-green-600 hover:underline"
                        >
                            신청하기
                        </a>
                    )}
                </div>
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

const Calendar = ({ events = {}, onDateClick, showNewsEvents = true, showClubEvents = true }) => {
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
                <button onClick={() => changeMonth(-1)} className="p-2"><ChevronLeft/></button>
                <h3 className="font-bold text-lg">{`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}</h3>
                <button onClick={() => changeMonth(1)} className="p-2"><ChevronRight/></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-sm">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => <div key={day} className="font-semibold text-gray-600 py-2">{day}</div>)}
                
                {Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`}></div>)}
                
                {Array.from({ length: daysInMonth }).map((_, day) => {
                    const date = day + 1;
                    const fullDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    const isToday = today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth() && today.getDate() === date;
                    const dayEvents = events[fullDateStr] || [];

                    const hasUserEvent = dayEvents.some(e => e.type === 'user');
                    const hasNewsEvent = showNewsEvents && dayEvents.some(e => e.type === 'news');
                    const hasClubEvent = showClubEvents && dayEvents.some(e => e.type === 'club');

                    return (
                        <div key={date} onClick={() => onDateClick(fullDateStr)} className="py-2 cursor-pointer relative h-12 flex flex-col items-center">
                            <span className={`flex items-center justify-center rounded-full w-8 h-8 ${isToday ? 'bg-black text-white' : ''} ${hasUserEvent || hasNewsEvent || hasClubEvent ? 'font-bold' : ''}`}>
                                {date}
                            </span>
                            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1">
                                {hasUserEvent && <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" title="개인 일정"></div>}
                                {hasNewsEvent && <div className="w-1.5 h-1.5 bg-green-500 rounded-full" title="관심 일정"></div>}
                                {hasClubEvent && <div className="w-1.5 h-1.5 bg-lime-500 rounded-full" title="모임 일정"></div>}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// =================================================================
// ▼▼▼ 1단계: 앱의 시작과 핵심 기반 페이지 ▼▼▼
// =================================================================

const StartPage = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const handleKakaoLogin = async () => {
        setLoading(true);
        setError('');
        try {
            if (!auth) {
                throw new Error("Firebase 인증이 초기화되지 않았습니다.");
            }
            const provider = new OAuthProvider('oidc.kakao.com');
            provider.setCustomParameters({ prompt: 'select_account' });
            await signInWithPopup(auth, provider);
        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                setError("카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
            }
            console.error("Kakao Login Error:", error);
        } finally {
            setLoading(false);
        }
    };
    return (
        <>
            <Helmet><title>마을N - 우리 동네 SNS</title></Helmet>
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
                </div>
            </div>
        </>
    );
};

const RegionSetupPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    
    // 지역 선택을 위한 상태
    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedCity, setSelectedCity] = useState('');

    // 로딩 및 에러 상태
    const [loading, setLoading] = useState(false);
    const [apiLoading, setApiLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    // 1. 컴포넌트가 로드되면 전체 시/도 목록을 불러옵니다.
    useEffect(() => {
        fetchRegions().then(data => {
            setRegions(data);
            setApiLoading(false);
        });
    }, []);

    // 2. [핵심 수정] 시/도를 선택할 때마다 실행됩니다.
    useEffect(() => {
        // 시/도가 선택되지 않았으면 시/군 목록을 비웁니다.
        if (!selectedRegion) {
            setCities([]);
            setSelectedCity('');
            return;
        }

        const regionData = regions.find(r => r.name === selectedRegion);
        if (regionData) {
            setApiLoading(true);
            // fetchCities 함수에 code와 name을 모두 전달합니다.
            fetchCities(regionData.code, regionData.name).then(data => {
                setCities(data);
                // 만약 시/군 목록이 하나뿐이면 (광역시 등) 자동으로 선택합니다.
                if (data.length === 1) {
                    setSelectedCity(data[0]);
                } else {
                    setSelectedCity('');
                }
                setApiLoading(false);
            });
        }
    }, [selectedRegion, regions]);
    
    // 저장 후 페이지 이동 로직
    useEffect(() => {
        if (isSaving && currentUser?.city) {
            navigate('/home');
        }
    }, [currentUser, isSaving, navigate]);


    const handleSaveRegion = async () => {
        if (!selectedRegion || !selectedCity) {
            setError('거주 지역을 모두 선택해주세요.');
            return;
        }
        setLoading(true);
        setError('');
        setIsSaving(true);
        try {
            // 사용자의 첫 지역 설정이므로 Firestore에 저장합니다.
            await setDoc(doc(db, "users", currentUser.uid), {
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                region: selectedRegion,
                city: selectedCity,
                town: '', // 상세 동네는 프로필 수정에서 입력
                createdAt: Timestamp.now()
            }, { merge: true });
        } catch (e) {
            console.error("Region save error:", e);
            setError("저장에 실패했습니다. 다시 시도해주세요.");
            setLoading(false);
            setIsSaving(false);
        }
    };

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
                        {regions.map(r => <option key={r.code} value={r.name}>{r.name}</option>)}
                    </select>
                    <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedRegion || apiLoading || cities.length === 0} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A] disabled:bg-gray-200">
                        <option value="">시/군 선택</option>
                        {apiLoading && selectedRegion ? <option>불러오는 중...</option> : cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button onClick={handleSaveRegion} disabled={loading || !selectedCity} className="w-full mt-4 bg-[#00462A] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#003a22] transition-colors shadow-lg disabled:bg-gray-400">{loading ? "저장 중..." : "마을N 시작하기"}</button>
                </div>
            )}
        </div>
    );
};

const HomePage = () => {
    const { currentUser, adminSelectedCity } = useAuth();
    const navigate = useNavigate();
    const [news, setNews] = useState(null);
    const [userEvents, setUserEvents] = useState({});
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const displayCity = adminSelectedCity || (currentUser.isAdmin ? '전국' : currentUser.city);

    const openDetailModal = (newsItem) => { setSelectedNews(newsItem); setDetailModalOpen(true); };

    useEffect(() => {
        if (!currentUser) return;
        const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);
        
        const newsQuery = targetCity 
            ? query(collection(db, 'news'), where("city", "==", targetCity), orderBy("createdAt", "desc"), limit(10)) 
            : query(collection(db, 'news'), orderBy("createdAt", "desc"), limit(10));
        
        const unsubNews = onSnapshot(newsQuery, 
            snapshot => setNews(snapshot.docs.map(d => ({id:d.id, ...d.data()}))), 
            () => setNews([])
        );
        
        const eventsQuery = query(collection(db,`users/${currentUser.uid}/events`));
        const unsubEvents = onSnapshot(eventsQuery, snapshot => {
            const eventsData = {};
            snapshot.forEach(doc => {
                const event = {id: doc.id, ...doc.data()};
                if(!eventsData[event.date]) eventsData[event.date] = [];
                eventsData[event.date].push(event);
            });
            setUserEvents(eventsData);
        });

        return () => { unsubNews(); unsubEvents(); };
    }, [currentUser, adminSelectedCity]);
    
    const handleLikeNews = async (newsItem) => {
        if (!currentUser || !newsItem) return;
        const userRef = doc(db, 'users', currentUser.uid);
        const isLiked = currentUser.likedNews?.includes(newsItem.id) || false;

        try {
            await updateDoc(userRef, { likedNews: isLiked ? arrayRemove(newsItem.id) : arrayUnion(newsItem.id) });
            if (newsItem.date) {
                const eventsRef = collection(db, `users/${currentUser.uid}/events`);
                const q = query(eventsRef, where("newsId", "==", newsItem.id), limit(1));
                const existingEvents = await getDocs(q);

                if (!isLiked && existingEvents.empty) {
                    await addDoc(eventsRef, { title: newsItem.title, date: newsItem.date, type: 'news', newsId: newsItem.id });
                } else if (isLiked && !existingEvents.empty) {
                    const batch = writeBatch(db);
                    existingEvents.forEach(d => batch.delete(d.ref));
                    await batch.commit();
                }
            }
        } catch(e) {
            console.error("Like/Calendar Error:", e);
            alert("오류가 발생했습니다.");
        }
    };
    
    const handleDeleteNews = async (id, path) => {
        if (!currentUser.isAdmin || !window.confirm("삭제하시겠습니까?")) return;
        try {
            if(path) await deleteObject(ref(storage, path));
            await deleteDoc(doc(db, 'news', id));
            alert("삭제 완료");
        } catch(e){
            alert(`삭제 오류: ${e.message}`);
        }
    };

    if (news === null) return <LoadingSpinner />;

    return (
        <div className="p-4 space-y-8">
            <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={selectedNews?.title}>
                {selectedNews && (
                    <div>
                        {selectedNews.imageUrl && <img src={selectedNews.imageUrl} alt={selectedNews.title} className="w-full h-auto rounded-lg mb-4"/>}
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedNews.content}</p>
                    </div>
                )}
            </Modal>
            
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-2xl font-bold">지금 {displayCity}에서는</h2>
                    <Link to="/news" className="text-sm font-medium text-gray-500 hover:text-gray-800">더 보기 <ChevronRight className="inline-block" size={16} /></Link>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-3 -mx-4 px-4" style={{scrollbarWidth:'none', msOverflowStyle:'none'}}>
                    {news.length > 0 ? (
                        news.map(n => (
                            <div key={n.id} className="w-4/5 md:w-3/5 shrink-0">
                                <NewsCard {...{news:n, isAdmin:currentUser.isAdmin, openDetailModal, handleDeleteNews, handleLikeNews, isLiked:currentUser.likedNews?.includes(n.id)}}/>
                            </div>
                        ))
                    ) : (
                         <EmptyState icon={<Newspaper size={48}/>} message="등록된 소식이 없습니다."/>
                    )}
                </div>
            </section>
            
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-2xl font-bold">이번 달 달력</h2>
                </div>
                <Calendar events={userEvents} onDateClick={(date) => navigate('/calendar', { state: { date } })} />
            </section>
        </div>
    );
};

const SearchPage = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState({ posts: [], news: [], benefits: [] });
    const [loading, setLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim()) return;
        setLoading(true);
        setHasSearched(true);
        try {
            const searchPromises = [
                getDocs(query(collection(db, 'posts'), where('title', '>=', searchTerm), where('title', '<=', searchTerm + '\uf8ff'))),
                getDocs(query(collection(db, 'news'), where('title', '>=', searchTerm), where('title', '<=', searchTerm + '\uf8ff'))),
                getDocs(query(collection(db, 'benefits'), where('title', '>=', searchTerm), where('title', '<=', searchTerm + '\uf8ff'))),
            ];
            
            const [postSnap, newsSnap, benefitSnap] = await Promise.all(searchPromises);

            setResults({
                posts: postSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                news: newsSnap.docs.map(d => ({ id: d.id, ...d.data() })),
                benefits: benefitSnap.docs.map(d => ({ id: d.id, ...d.data() })),
            });
        } catch (e) {
            console.error("Search error: ", e);
            alert("검색 중 오류 발생");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4">
            <div className="relative mb-6 flex gap-2">
                <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()} 
                    placeholder='제목으로 검색...'
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
            {loading ? <LoadingSpinner /> : (
                <div className="space-y-6">
                    {hasSearched && (results.posts.length > 0 || results.news.length > 0 || results.benefits.length > 0) ? (
                        <>
                            {results.posts.length > 0 && (
                                <section>
                                    <h3 className="font-bold mb-2">게시판 검색 결과</h3>
                                    {results.posts.map(post => (
                                        <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="p-3 bg-white rounded-lg mb-2 shadow-sm cursor-pointer">
                                            {post.title}
                                        </div>
                                    ))}
                                </section>
                            )}
                             {results.news.length > 0 && (
                                <section>
                                    <h3 className="font-bold mb-2">소식 검색 결과</h3>
                                    {results.news.map(item => (
                                        <div key={item.id} className="p-3 bg-white rounded-lg mb-2 shadow-sm cursor-pointer">
                                            {item.title}
                                        </div>
                                    ))}
                                </section>
                            )}
                            {results.benefits.length > 0 && (
                                <section>
                                    <h3 className="font-bold mb-2">혜택 검색 결과</h3>
                                    {results.benefits.map(item => (
                                        <div key={item.id} onClick={() => navigate(`/benefit/${item.id}`)} className="p-3 bg-white rounded-lg mb-2 shadow-sm cursor-pointer">
                                            {item.title}
                                        </div>
                                    ))}
                                </section>
                            )}
                        </>
                    ) : ( hasSearched && <EmptyState icon={<Search size={48} />} message={`'${searchTerm}'에 대한 검색 결과가 없습니다.`} />
                    )}
                </div>
            )}
        </div>
    );
};

const NotificationsPage = () => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState(null);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, `users/${currentUser.uid}/notifications`), orderBy('createdAt', 'desc'), limit(30));
        const unsub = onSnapshot(q, (snapshot) => {
            setNotifications(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
        return unsub;
    }, [currentUser]);

    if (notifications === null) return <LoadingSpinner />;

    return (
        <div className="p-4">
            {notifications.length > 0 ? (
                notifications.map(n => (
                    <div key={n.id} className={`p-3 border-b ${!n.isRead ? 'bg-green-50' : ''}`}>
                        <p className="text-sm">{n.content}</p>
                        <p className="text-xs text-gray-500 mt-1">{timeSince(n.createdAt)}</p>
                    </div>
                ))
            ) : (
                <EmptyState icon={<Bell size={48} />} message="새로운 알림이 없습니다." />
            )}
        </div>
    );
};


// =================================================================
// ▼▼▼ 2단계: 메인 탭 콘텐츠 페이지 ▼▼▼
// =================================================================

const NewsPage = () => {
    const { currentUser, adminSelectedCity } = useAuth();
    const navigate = useNavigate();
    const [newsList, setNewsList] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [activeTag, setActiveTag] = useState('전체');
    const displayCity = adminSelectedCity || (currentUser?.isAdmin ? '전체' : currentUser?.city);
    const allTags = ['전체', '교육', '문화', '청년', '농업', '안전', '운동', '행사', '복지'];
    
    const [settingsModalOpen, setSettingsModalOpen] = useState(false);
    const [userInterestedTags, setUserInterestedTags] = useState(currentUser?.interestedTags || []);

    useEffect(() => {
        if (currentUser) {
            setUserInterestedTags(currentUser.interestedTags || []);
        }
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser) return;
        const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);
        
        let q;
        const baseQuery = [orderBy("createdAt", "desc")];
        if (targetCity) {
            q = query(collection(db, "news"), where("city", "==", targetCity), ...baseQuery);
        } else {
            q = query(collection(db, "news"), ...baseQuery);
        }
        
        const unsub = onSnapshot(q, (s) => setNewsList(s.docs.map(d => ({ id: d.id, ...d.data() }))), (e) => {
            console.error("Error fetching news:", e);
            setNewsList([]);
        });
        return () => unsub();
    }, [currentUser, adminSelectedCity]);
    
    const handleLikeNews = async (newsItem) => {
        if (!currentUser || !newsItem) return;
        const userRef = doc(db, 'users', currentUser.uid);
        const isLiked = currentUser.likedNews?.includes(newsItem.id) || false;

        try {
            await updateDoc(userRef, { likedNews: isLiked ? arrayRemove(newsItem.id) : arrayUnion(newsItem.id) });
            if (newsItem.date) {
                const eventsRef = collection(db, `users/${currentUser.uid}/events`);
                const q = query(eventsRef, where("newsId", "==", newsItem.id), limit(1));
                const existingEvents = await getDocs(q);

                if (!isLiked && existingEvents.empty) {
                    await addDoc(eventsRef, { title: newsItem.title, date: newsItem.date, type: 'news', newsId: newsItem.id });
                } else if (isLiked && !existingEvents.empty) {
                    const batch = writeBatch(db);
                    existingEvents.forEach(d => batch.delete(d.ref));
                    await batch.commit();
                }
            }
        } catch(e) {
            console.error("Like/Calendar Error:", e);
            alert("오류가 발생했습니다.");
        }
    };

    const handleDeleteNews = async (newsId, imagePath) => {
        if (!currentUser.isAdmin || !window.confirm("정말로 이 소식을 삭제하시겠습니까?")) return;
        try {
            if (imagePath) await deleteObject(ref(storage, imagePath));
            await deleteDoc(doc(db, 'news', newsId));
            alert("소식이 삭제되었습니다.");
        } catch (error) {
            alert(`소식 삭제 중 오류: ${error.message}`);
        }
    };
    
    const openDetailModal = (news) => {
        setSelectedNews(news);
        setDetailModalOpen(true);
    };

    const handleSaveTags = async () => {
        if (!currentUser) return;
        try {
            await updateDoc(doc(db, 'users', currentUser.uid), { interestedTags: userInterestedTags });
            alert('관심 태그가 저장되었습니다.');
            setSettingsModalOpen(false);
        } catch (e) {
            console.error("Error saving tags: ", e);
            alert('저장에 실패했습니다.');
        }
    };
    
    const toggleTag = (tag) => {
        setUserInterestedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    if (newsList === null) return <LoadingSpinner />;
    
    const filteredNews = activeTag === '전체' ? newsList : newsList.filter(news => news.tags?.includes(activeTag));
    const pageTitle = displayCity === '전체' ? '전체 소식' : `${displayCity} 소식`;
    
    return (
        <div className="p-4 pb-20">
            <h1 className="text-2xl font-bold mb-4">{pageTitle}</h1>
            {currentUser.isAdmin && (<button onClick={() => navigate('/news/write', { state: { city: displayCity } })} className="w-full mb-4 bg-[#00462A] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2"><PlusCircle size={20} /> 새 소식 작성</button>)}
            
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {allTags.map(tag => (<button key={tag} onClick={() => setActiveTag(tag)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${ activeTag === tag ? 'bg-[#00462A] text-white' : 'bg-gray-200 text-gray-700'}`}>{tag}</button>))}
            </div>
            
            <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} title={selectedNews?.title}>
                {selectedNews && (
                    <div>
                        {selectedNews.imageUrl && <img src={selectedNews.imageUrl} alt={selectedNews.title} className="w-full h-auto rounded-lg mb-4"/>}
                        <p className="text-gray-700 whitespace-pre-wrap">{selectedNews.content}</p>
                    </div>
                )}
            </Modal>
            
            <div className="space-y-4">
                {filteredNews.length > 0 ? (filteredNews.map((news) => (<NewsCard key={news.id} {...{news, isAdmin: currentUser.isAdmin, openDetailModal, handleDeleteNews, handleLikeNews, isLiked: currentUser.likedNews?.includes(news.id)}} />))) : (<EmptyState icon={<Newspaper size={48} />} message="해당 소식이 없습니다." />)}
            </div>

            <div className="text-center mt-6 py-4">
                <button onClick={() => setSettingsModalOpen(true)} className="text-sm text-gray-500 hover:underline flex items-center gap-2 justify-center mx-auto">
                    <Settings size={16} /> 관심 태그 설정
                </button>
            </div>

            <Modal isOpen={settingsModalOpen} onClose={() => setSettingsModalOpen(false)} title="관심 태그 설정">
                <p className="text-gray-600 mb-4">관심있는 태그를 선택하시면 관련 새 소식 알림을 보내드려요.</p>
                <div className="flex flex-wrap gap-2">
                    {allTags.filter(t => t !== '전체').map(tag => (
                        <button 
                            key={tag}
                            onClick={() => toggleTag(tag)}
                            className={`px-3 py-1.5 text-sm font-semibold rounded-full ${userInterestedTags.includes(tag) ? 'bg-[#00462A] text-white' : 'bg-gray-200 text-gray-700'}`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
                <button onClick={handleSaveTags} className="w-full bg-blue-600 text-white font-bold py-2 mt-6 rounded-lg hover:bg-blue-700">저장하기</button>
            </Modal>
        </div>
    );
};

const BoardPage = () => {
    const { currentUser, adminSelectedCity } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('전체');
    const [posts, setPosts] = useState(null);
    const [popularPosts, setPopularPosts] = useState(null);
    const [followingPosts, setFollowingPosts] = useState(null);
    const [clubs, setClubs] = useState(null);
    const [filter, setFilter] = useState('전체');

    const dynamicMomCategory = currentUser?.city ? `${currentUser.city}맘` : '마을맘';
    const categories = ['전체', '일상', '친목', '10대', '청년', '중년', dynamicMomCategory, '질문', '기타'];
    const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);

    useEffect(() => {
        if (!currentUser) return;
        
        let unsub;
        if (activeTab === '전체') {
            setPosts(null);
            let qCons = [];
            if (targetCity) qCons.push(where("city", "==", targetCity));
            if (filter !== '전체') qCons.push(where("category", "==", filter));
            const q = query(collection(db, "posts"), ...qCons, orderBy("createdAt", "desc"), limit(50));
            unsub = onSnapshot(q, s => setPosts(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => { console.error(e); setPosts([]); });
        } else if (activeTab === '인기글') {
            setPopularPosts(null);
            const q = targetCity 
                ? query(collection(db, "posts"), where("city", "==", targetCity), orderBy("likesCount", "desc"), limit(20))
                : query(collection(db, "posts"), orderBy("likesCount", "desc"), limit(20));
            unsub = onSnapshot(q, s => setPopularPosts(s.docs.map(d => ({ id: d.id, ...d.data()}))), e => { console.error(e); setPopularPosts([]); });
        } else if (activeTab === '팔로잉') {
            setFollowingPosts(null);
            if (currentUser.following?.length > 0) {
                 unsub = onSnapshot(query(collection(db, "posts"), where('authorId','in',currentUser.following.slice(0,10)), orderBy("createdAt","desc")), s => setFollowingPosts(s.docs.map(d=>({id:d.id,...d.data()}))), e => { console.error(e); setFollowingPosts([]); });
            } else {
                setFollowingPosts([]);
            }
        } else if (activeTab === '모임') {
            setClubs(null);
            unsub = onSnapshot(query(collection(db, "clubs"), orderBy("createdAt", "desc")), (s) => setClubs(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => { console.error(e); setClubs([]); });
        }
        
        return () => unsub && unsub();

    }, [activeTab, filter, currentUser, adminSelectedCity]);

    const renderContent = () => {
        switch (activeTab) {
            case '전체':
                if (posts === null) return <SkeletonUI />;
                return (
                    <>
                        <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                            {categories.map(cat => (
                                <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${filter === cat ? 'bg-[#00462A] text-white' : 'bg-gray-200 text-gray-700'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {posts.length > 0 ? (posts.map(post => {
                                const style = getCategoryStyle(post.category, post.city);
                                return (<div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer"><div className="flex items-center gap-2 mb-2"><span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md`}>{post.category}</span><h3 className="font-bold text-md truncate flex-1">{post.title}</h3></div><p className="text-gray-600 text-sm mb-3 truncate">{post.content}</p><div className="flex justify-between items-center text-xs text-gray-500"><div><span onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.authorId}`); }} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span><span className="mx-1">·</span><span>{timeSince(post.createdAt)}</span></div><div className="flex items-center gap-3"><div className="flex items-center gap-1"><Heart size={14} className={post.likes?.includes(currentUser.uid) ? 'text-red-500 fill-current' : 'text-gray-400'} /><span>{post.likesCount || 0}</span></div><div className="flex items-center gap-1"><MessageCircle size={14} className="text-gray-400"/><span>{post.commentCount || 0}</span></div></div></div></div>);
                            })) : <EmptyState icon={<LayoutGrid size={48}/>} message="아직 게시글이 없습니다." />}
                        </div>
                    </>
                );
            case '인기글':
                 if (popularPosts === null) return <SkeletonUI />;
                 return (
                     <div className="space-y-3">
                         {popularPosts.length > 0 ? (popularPosts.map(post => {
                             const style = getCategoryStyle(post.category, post.city);
                             return (<div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer"><div className="flex items-center gap-2 mb-2"><span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md`}>{post.category}</span><h3 className="font-bold text-md truncate flex-1">{post.title}</h3></div><p className="text-gray-600 text-sm mb-3 truncate">{post.content}</p><div className="flex justify-between items-center text-xs text-gray-500"><div><span onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.authorId}`); }} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span><span className="mx-1">·</span><span>{timeSince(post.createdAt)}</span></div><div className="flex items-center gap-3"><div className="flex items-center gap-1"><Heart size={14} className="text-red-500" /><span>{post.likesCount || 0}</span></div><div className="flex items-center gap-1"><MessageCircle size={14} className="text-gray-400"/><span>{post.commentCount || 0}</span></div></div></div></div>);
                         })) : <EmptyState icon={<Star size={48}/>} message="아직 인기글이 없습니다."/>}
                     </div>
                 );
            case '팔로잉':
                 if (followingPosts === null) return <SkeletonUI />;
                 return (
                     <div className="space-y-3">
                         {followingPosts.length > 0 ? (followingPosts.map(post => {
                             const style = getCategoryStyle(post.category, post.city);
                              return (<div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer"><div className="flex items-center gap-2 mb-2"><span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md`}>{post.category}</span><h3 className="font-bold text-md truncate flex-1">{post.title}</h3></div><p className="text-gray-600 text-sm mb-3 truncate">{post.content}</p><div className="flex justify-between items-center text-xs text-gray-500"><div><span onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.authorId}`); }} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span><span className="mx-1">·</span><span>{timeSince(post.createdAt)}</span></div><div className="flex items-center gap-3"><div className="flex items-center gap-1"><Heart size={14} className={post.likes?.includes(currentUser.uid) ? 'text-red-500 fill-current' : 'text-gray-400'} /><span>{post.likesCount || 0}</span></div><div className="flex items-center gap-1"><MessageCircle size={14} className="text-gray-400"/><span>{post.commentCount || 0}</span></div></div></div></div>);
                         })) : <EmptyState icon={<Users size={48}/>} message="팔로우하는 사용자의 글이 없습니다."/>}
                     </div>
                 );
             case '모임':
                if (clubs === null) return <SkeletonUI />;
                return <ClubListPage clubs={clubs} />;
            default:
                return null;
        }
    };
    
    return (
        <div className="p-4 pb-20">
            <div className="flex bg-gray-200 rounded-lg p-1 mb-4">
                {['전체', '인기글', '팔로잉', '모임'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`w-1/4 py-2 text-sm font-semibold rounded-md transition-colors ${activeTab === tab ? 'bg-white shadow text-[#00462A]' : 'text-gray-600'}`}>
                        {tab}
                    </button>
                ))}
            </div>
            <div className="mt-4">{renderContent()}</div>
            <button onClick={() => activeTab === '모임' ? navigate('/club/create') : navigate('/post/write')} className="fixed bottom-24 right-5 bg-[#00462A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[#003a22] hover:scale-110 transform transition-transform"><PlusCircle size={28} /></button>
        </div>
    );
};

const ClubListPage = ({ clubs }) => {
    const navigate = useNavigate();
    
    if (!clubs) return <SkeletonUI />;
    if (clubs.length === 0) return <EmptyState icon={<Users size={48} />} message="개설된 모임이 없습니다." />;

    return (
        <div className="space-y-3">
            {clubs.map(club => (
                <div key={club.id} onClick={() => navigate(`/club/${club.id}`)} className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer flex items-center gap-4 hover:bg-gray-50 transition-colors">
                    <img src={club.photoURL} alt={club.name} className="w-16 h-16 rounded-lg object-cover bg-gray-200 shrink-0" />
                    <div className="flex-1 overflow-hidden">
                        <h3 className="font-bold text-lg">{club.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{club.description}</p>
                        <div className="text-xs text-gray-400 mt-1 flex items-center">
                            {club.password && <Lock size={12} className="mr-1" />}
                            <span>멤버 {club.members?.length || 0}명</span>
                            <span className="mx-1">·</span>
                            <span className="hover:underline">{club.creatorName}</span>
                        </div>
                    </div>
                </div>
            ))}
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
    const [showNewsEvents, setShowNewsEvents] = useState(true);
    const [showClubEvents, setShowClubEvents] = useState(true);

    useEffect(() => {
        if (!currentUser) return;
        const unsub = onSnapshot(query(collection(db, `users/${currentUser.uid}/events`)), s => {
            const ev = {};
            s.docs.forEach(d => {
                const e = { id: d.id, ...d.data() };
                if (!ev[e.date]) ev[e.date] = [];
                ev[e.date].push(e);
            });
            setUserEvents(ev);
        });
        return unsub;
    }, [currentUser]);

    useEffect(() => {
        if (location.state?.date) {
            setSelectedDate(location.state.date);
            setIsModalOpen(true);
        }
    }, [location.state]);

    const handleDateClick = (date) => {
        setSelectedDate(date);
        setIsModalOpen(true);
    };

    const handleAddEvent = async () => {
        if (!eventTitle.trim()) { alert("일정 제목을 입력해주세요."); return; }
        try {
            await addDoc(collection(db, `users/${currentUser.uid}/events`), { title: eventTitle, date: selectedDate, type: 'user', createdAt: Timestamp.now() });
            setIsModalOpen(false);
            setEventTitle('');
        } catch(e) {
            console.error("Error adding event: ", e);
            alert("일정 추가 중 오류 발생");
        }
    };
    
    const eventsForSelectedDate = selectedDate ? (userEvents[selectedDate] || []) : [];

    return (
        <div className="p-4">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`${selectedDate} 일정`}>
                 <div className="space-y-4">
                     <div>
                         <h4 className="font-bold mb-2">새로운 개인 일정 추가</h4>
                         <div className="flex gap-2">
                             <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="일정 내용 입력" className="flex-grow px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00462A] focus:border-[#00462A]" />
                             <button onClick={handleAddEvent} className="bg-[#00462A] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#003a22]">저장</button>
                         </div>
                     </div>
                     <div>
                        <h4 className="font-bold mb-2">이 날의 일정</h4>
                        {eventsForSelectedDate.length > 0 ? (
                            <ul className="space-y-2">
                                {eventsForSelectedDate.map(event => (
                                    <li key={event.id} className="flex items-center gap-2 p-2 rounded-md bg-gray-50">
                                        <span className={`w-3 h-3 rounded-full ${event.type === 'user' ? 'bg-yellow-400' : event.type === 'news' ? 'bg-green-500' : 'bg-lime-500'}`}></span>
                                        <span>{event.title}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : (<p className="text-gray-500">등록된 일정이 없습니다.</p>)}
                    </div>
                 </div>
            </Modal>
            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                <h1 className="text-2xl font-bold">월간 달력</h1>
                <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                        <label htmlFor="news-toggle" className="cursor-pointer">관심</label>
                        <button onClick={() => setShowNewsEvents(!showNewsEvents)} id="news-toggle" className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors ${showNewsEvents ? 'bg-green-500' : 'bg-gray-300'}`}><span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${showNewsEvents ? 'translate-x-5' : 'translate-x-1'}`}/></button>
                    </div>
                     <div className="flex items-center gap-1">
                        <label htmlFor="club-toggle" className="cursor-pointer">모임</label>
                        <button onClick={() => setShowClubEvents(!showClubEvents)} id="club-toggle" className={`relative inline-flex items-center h-5 rounded-full w-9 transition-colors ${showClubEvents ? 'bg-lime-500' : 'bg-gray-300'}`}><span className={`inline-block w-3.5 h-3.5 transform bg-white rounded-full transition-transform ${showClubEvents ? 'translate-x-5' : 'translate-x-1'}`}/></button>
                    </div>
                </div>
            </div>
            <Calendar events={userEvents} onDateClick={handleDateClick} showNewsEvents={showNewsEvents} showClubEvents={showClubEvents} />
        </div>
    );
};

const BenefitsPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('가게');
    const [benefits, setBenefits] = useState(null);

    useEffect(() => {
        if (activeTab === '관리자 문의') return;
        setBenefits(null);
        if (!currentUser?.city) return;

        const q = query(collection(db, "benefits"), where("category", "==", activeTab), where("city", "==", currentUser.city), orderBy("createdAt", "desc"));
        const unsub = onSnapshot(q, (snapshot) => {
            setBenefits(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }, (error) => {
            console.error("Error fetching benefits:", error);
            setBenefits([]);
        });
        return () => unsub();
    }, [activeTab, currentUser?.city]);

    const getIconForTab = (tab) => {
        switch(tab) {
            case '가게': return <Store size={48} />;
            case '부동산': return <Building size={48} />;
            case '구인구직': return <Briefcase size={48} />;
            default: return <TicketPercent size={48} />;
        }
    };
    
    const renderContent = () => {
        if (activeTab === '관리자 문의') {
            return (
                <div className="p-8 text-center bg-white rounded-xl shadow-sm border">
                    <HelpCircle size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="mb-4 text-gray-600">서비스 이용 중 불편한 점이나 제휴 문의는<br/>관리자에게 직접 전달해주세요.</p>
                    <button onClick={() => navigate(`/profile/${ADMIN_UID}`)} className="bg-[#00462A] text-white font-bold py-2 px-6 rounded-lg hover:bg-[#003a22]">
                        관리자 프로필 보기
                    </button>
                </div>
            );
        }
        if (benefits === null) return <SkeletonUI />;
        if (benefits.length === 0) return <EmptyState icon={getIconForTab(activeTab)} message={`등록된 ${activeTab} 정보가 없습니다.`} />;
        
        return (
            <div className="space-y-4">
                {benefits.map(item => (
                    <div key={item.id} onClick={() => navigate(`/benefit/${item.id}`)} className="bg-white p-4 rounded-xl shadow-sm border cursor-pointer hover:bg-gray-50 transition-colors">
                         {item.imageUrl && <img src={item.imageUrl} alt={item.title} className="w-full h-32 object-cover rounded-lg mb-3"/>}
                        <h3 className="font-bold text-lg">{item.title}</h3>
                        <p className="text-sm text-gray-500 truncate">{item.content}</p>
                        <p className="text-sm text-gray-600 mt-2 font-semibold">{item.contact}</p>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div className="p-4 pb-20">
            <div className="flex bg-gray-200 rounded-lg p-1 mb-4">
                {['가게', '부동산', '구인구직', '관리자 문의'].map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-2 text-sm font-semibold rounded-md transition-colors text-center px-1 ${activeTab === tab ? 'bg-white shadow text-[#00462A]' : 'text-gray-600'}`}>
                        {tab}
                    </button>
                ))}
            </div>
            {renderContent()}
            {currentUser?.isAdmin && activeTab !== '관리자 문의' && (
                 <button onClick={() => navigate('/benefit/write', { state: { category: activeTab }})} className="fixed bottom-24 right-5 bg-[#00462A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg"><PlusCircle size={28} /></button>
            )}
        </div>
    );
};

// =================================================================
// ▼▼▼ 3단계: 상세 정보 조회 페이지 ▼▼▼
// =================================================================

const PostDetailPage = () => {
    const { postId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        const postRef = doc(db, 'posts', postId);
        const commentsRef = collection(postRef, 'comments');
        
        const postUnsub = onSnapshot(postRef, (d) => {
            if (d.exists()) {
                setPost({ id: d.id, ...d.data() });
            } else {
                alert("삭제된 게시글입니다.");
                navigate('/board');
            }
        });
        
        const commentsUnsub = onSnapshot(query(commentsRef, orderBy("createdAt", "asc")), s => {
            setComments(s.docs.map(d => ({ id: d.id, ...d.data() })));
        });

        return () => { postUnsub(); commentsUnsub(); };
    }, [postId, navigate]);

    const handlePostInteraction = async (field) => {
        if (!post || !currentUser) return;
        const postRef = doc(db, 'posts', postId);
        const currentArray = post[field] || [];
        const isIncluded = currentArray.includes(currentUser.uid);
        
        const updateData = {
            [field]: isIncluded ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
        };
        
        if (field === 'likes') {
            updateData.likesCount = increment(isIncluded ? -1 : 1);
        }

        try {
            await updateDoc(postRef, updateData);
        } catch (e) {
            console.error(`Error updating ${field}:`, e);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;
        const postRef = doc(db, 'posts', postId);
        const newCommentRef = doc(collection(postRef, 'comments'));
        
        try {
            const batch = writeBatch(db);
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
        } catch (e) {
            console.error("Error adding comment: ", e);
        }
    };
    
    const handleCommentLike = async (commentId) => {
        if (!currentUser) return;
        const commentRef = doc(db, `posts/${postId}/comments`, commentId);
        try {
            const commentDoc = await getDoc(commentRef);
            if (!commentDoc.exists()) return;
            const currentLikes = commentDoc.data().likes || [];
            await updateDoc(commentRef, {
                likes: currentLikes.includes(currentUser.uid) ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
            });
        } catch(e) {
            console.error("Comment like error", e);
        }
    };

    const handleDelete = async () => {
        if (!post || (post.authorId !== currentUser.uid && !currentUser.isAdmin) || !window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return;
        try {
            if (post.imagePath) {
                await deleteObject(ref(storage, post.imagePath));
            }
            await deleteDoc(doc(db, 'posts', postId));
            alert("게시글이 삭제되었습니다.");
            navigate('/board');
        } catch (e) {
            console.error("Error deleting post:", e);
            alert("삭제 중 오류가 발생했습니다.");
        }
    };
    
    const handleReportPost = async () => {
        if (!window.confirm("이 글을 관리자에게 신고하시겠습니까? 부적절한 신고는 제재의 사유가 될 수 있습니다.")) return;
        
        const postRef = doc(db, 'posts', postId);
        try {
            await runTransaction(db, async (transaction) => {
                const postDoc = await transaction.get(postRef);
                if (!postDoc.exists()) throw "문서가 존재하지 않습니다!";
                
                const newReportCount = (postDoc.data().reportCount || 0) + 1;
                transaction.update(postRef, { reportCount: newReportCount });
            });
            alert('게시글이 신고되었습니다.');
        } catch (e) {
            console.error("신고 처리 중 오류 발생: ", e);
            alert("오류가 발생했습니다.");
        }
    };

    if (!post) return <LoadingSpinner />;
    
    const isAuthor = post.authorId === currentUser?.uid;
    const style = getCategoryStyle(post.category, post.city);

    return (
        <div className="pb-24">
            <div className="p-4 border-b">
                <span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md mb-2 inline-block`}>{post.category}</span>
                <div className="flex justify-between items-start mt-2">
                    <h1 className="text-2xl font-bold flex-1 pr-4">{post.title}</h1>
                    <div className="flex items-center gap-2">
                        {(isAuthor || currentUser.isAdmin) && (
                            <>
                                {isAuthor && <button onClick={() => navigate(`/post/edit/${post.id}`, { state: { itemToEdit: post }})} className="p-1 text-gray-500 hover:text-blue-600"><Pencil size={20} /></button>}
                                <button onClick={handleDelete} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={20} /></button>
                            </>
                        )}
                        <button onClick={() => handlePostInteraction('bookmarks')} className="p-1 -mr-1"><Star size={22} className={post.bookmarks?.includes(currentUser?.uid) ? "text-yellow-400 fill-current" : "text-gray-400"} /></button>
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
                {post.imageUrl && <img src={post.imageUrl} alt="Post" className="my-4 w-full h-auto rounded-lg object-cover" />}
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mt-4">{post.content}</p>
                 <div className="flex justify-between items-center mt-6 pt-4 border-t">
                    <div className="flex items-center gap-4">
                        <button onClick={() => handlePostInteraction('likes')} className="flex items-center gap-1.5 text-gray-600 hover:text-red-500">
                            <Heart size={20} className={post.likes?.includes(currentUser.uid) ? "text-red-500 fill-current" : ""} />
                            <span>좋아요 {post.likes?.length || 0}</span>
                        </button>
                        <div className="flex items-center gap-1.5 text-gray-600">
                            <MessageCircle size={20} /> <span>댓글 {comments.length}</span>
                        </div>
                    </div>
                     <button onClick={handleReportPost} className="text-gray-400 hover:text-red-500 flex items-center gap-1 text-xs">
                        <AlertTriangle size={14} /> 신고
                    </button>
                 </div>
            </div>
            
            <div className="p-4 space-y-4">
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

            <div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white border-t p-3">
                <form onSubmit={handleCommentSubmit} className="relative flex items-center">
                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="댓글을 입력하세요." className="w-full pl-4 pr-12 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]" />
                    <button type="submit" className="absolute right-2 p-2 rounded-full text-gray-500 hover:bg-gray-200"><Send size={20} /></button>
                </form>
            </div>
        </div>
    );
};

const BenefitDetailPage = () => {
    const { benefitId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [benefit, setBenefit] = useState(null);

    useEffect(() => {
        const docRef = doc(db, 'benefits', benefitId);
        const unsub = onSnapshot(docRef, (doc) => {
            if (doc.exists()) {
                setBenefit({ id: doc.id, ...doc.data() });
            } else {
                alert("삭제되었거나 없는 정보입니다.");
                navigate('/benefits');
            }
        });
        return unsub;
    }, [benefitId, navigate]);

    const handleDelete = async () => {
        if (!benefit || !currentUser?.isAdmin || !window.confirm("정말로 삭제하시겠습니까?")) return;
        try {
            if (benefit.imagePath) {
                await deleteObject(ref(storage, benefit.imagePath));
            }
            await deleteDoc(doc(db, 'benefits', benefitId));
            alert("삭제되었습니다.");
            navigate('/benefits');
        } catch (e) {
            alert(`삭제 중 오류 발생: ${e.message}`);
        }
    };

    if (!benefit) return <LoadingSpinner />;

    return (
        <div className="pb-10">
            <div className="p-4">
                <span className="text-sm font-semibold text-white bg-[#00462A] px-3 py-1 rounded-full">{benefit.category}</span>
                <h1 className="text-3xl font-bold my-4">{benefit.title}</h1>
                <div className="text-sm text-gray-500">작성일: {new Date(benefit.createdAt.seconds * 1000).toLocaleDateString()}</div>
                 {currentUser?.isAdmin && (
                    <div className="flex gap-2 mt-4">
                        <button onClick={handleDelete} className="text-red-500 font-semibold">삭제</button>
                    </div>
                 )}
            </div>

            {benefit.imageUrl && <img src={benefit.imageUrl} alt={benefit.title} className="w-full h-64 object-cover" />}

            <div className="p-4 space-y-6">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h2 className="text-lg font-bold mb-2">상세 정보</h2>
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{benefit.content}</p>
                </div>
                {benefit.contact &&
                    <div className="bg-white p-4 rounded-lg shadow-sm">
                        <h2 className="text-lg font-bold mb-2">연락처 / 위치</h2>
                        <p className="text-gray-700">{benefit.contact}</p>
                    </div>
                }
            </div>
        </div>
    );
};

const ClubDetailPage = () => {
    const { clubId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [club, setClub] = useState(null);
    const [joinRequestStatus, setJoinRequestStatus] = useState(null);
    const [joinRequestModalOpen, setJoinRequestModalOpen] = useState(false);
    const [requestMessage, setRequestMessage] = useState('');

    useEffect(() => {
        const clubRef = doc(db, 'clubs', clubId);
        const unsubClub = onSnapshot(clubRef, (d) => {
            if (d.exists()) {
                setClub({ id: d.id, ...d.data() });
            } else {
                alert("존재하지 않는 모임입니다.");
                navigate('/board');
            }
        });

        const requestRef = collection(db, `clubs/${clubId}/joinRequests`);
        const q = query(requestRef, where("userId", "==", currentUser.uid));
        const unsubRequest = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const requestData = snapshot.docs[0].data();
                setJoinRequestStatus(requestData.status);
            } else {
                setJoinRequestStatus(null);
            }
        });

        return () => { unsubClub(); unsubRequest(); };
    }, [clubId, navigate, currentUser.uid]);

    const handleJoinRequest = async () => {
        if (!requestMessage.trim()) {
            alert('가입 메시지를 입력해주세요.');
            return;
        }
        const requestData = {
            userId: currentUser.uid,
            userName: currentUser.displayName,
            userPhotoURL: currentUser.photoURL || '',
            message: requestMessage,
            status: 'pending',
            createdAt: Timestamp.now(),
        };
        await addDoc(collection(db, `clubs/${clubId}/joinRequests`), requestData);
        alert('가입 신청이 완료되었습니다. 모임장의 승인을 기다려주세요.');
        setJoinRequestModalOpen(false);
    };

    const renderJoinButton = () => {
        if (!club) return null;
        if (club.members?.includes(currentUser.uid)) {
            return <span className="px-4 py-2 text-sm font-semibold rounded-lg bg-green-100 text-green-700">가입된 모임</span>;
        }
        if (joinRequestStatus === 'pending') {
            return <span className="px-4 py-2 text-sm font-semibold rounded-lg bg-yellow-100 text-yellow-700">승인 대기 중</span>;
        }
        if (joinRequestStatus === 'rejected') {
            return <span className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-100 text-red-700">가입이 거절되었습니다</span>;
        }
        return (
            <button onClick={() => setJoinRequestModalOpen(true)} className="px-4 py-2 text-sm font-semibold rounded-lg bg-[#00462A] text-white hover:bg-[#003a22]">
                가입 문의하기
            </button>
        );
    };

    if (!club) return <LoadingSpinner />;
    
    const isCreator = club.creatorId === currentUser.uid;

    return (
        <div>
            <div className="relative">
                <img src={club.photoURL} alt={club.name} className="w-full h-48 object-cover bg-gray-300"/>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute top-4 left-4"><button onClick={() => navigate(-1)} className="text-white bg-black/30 p-2 rounded-full"><ArrowLeft/></button></div>
                {isCreator && <div className="absolute top-4 right-4"><button onClick={() => navigate(`/club/manage/${clubId}`)} className="text-white bg-black/30 p-2 rounded-full"><Settings/></button></div>}
                <div className="absolute bottom-4 left-4 text-white">
                    <h2 className="text-2xl font-bold">{club.name}</h2>
                    <p className="text-sm">{club.description}</p>
                </div>
            </div>
            
            <div className="p-4 flex justify-end">
                {renderJoinButton()}
            </div>
            
            <Modal isOpen={joinRequestModalOpen} onClose={() => setJoinRequestModalOpen(false)} title="모임 가입 신청">
                <p className="mb-4 text-gray-600">모임장에게 자신을 소개하는 메시지를 보내주세요.</p>
                <textarea value={requestMessage} onChange={e => setRequestMessage(e.target.value)} placeholder="간단한 가입 인사를 남겨주세요." className="w-full h-24 p-2 border rounded-md" />
                <button onClick={handleJoinRequest} className="w-full bg-blue-600 text-white font-bold py-2 mt-4 rounded-lg hover:bg-blue-700">신청하기</button>
            </Modal>
            
            <div className="p-4">
                <section>
                    <h3 className="text-lg font-bold mb-3">모임 멤버 ({club.members?.length || 0})</h3>
                </section>
            </div>
        </div>
    );
};

const UserProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState(null);

    useEffect(() => {
        const userUnsub = onSnapshot(doc(db, 'users', userId), (d) => {
            setProfileUser(d.exists() ? { id: d.id, ...d.data() } : null);
        });
        const postsUnsub = onSnapshot(query(collection(db, 'posts'), where("authorId", "==", userId), orderBy("createdAt", "desc")), (s) => {
            setUserPosts(s.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return () => { userUnsub(); postsUnsub(); };
    }, [userId]);

    const handleFollow = async () => {
        if (!currentUser || !profileUser) return;
        const myRef = doc(db, 'users', currentUser.uid);
        const theirRef = doc(db, 'users', userId);
        try {
            const isFollowing = profileUser.followers?.includes(currentUser.uid);
            const batch = writeBatch(db);
            batch.update(myRef, { following: isFollowing ? arrayRemove(userId) : arrayUnion(userId) });
            batch.update(theirRef, { followers: isFollowing ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) });
            await batch.commit();
        } catch(e) {
            console.error("Follow error:", e);
            alert("팔로우 처리 중 오류 발생");
        }
    };
    
    const handleLogout = async () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            await signOut(auth);
            navigate('/start');
        }
    };

    const handleMessage = () => {
        navigate(`/chat/${[currentUser.uid, userId].sort().join('_')}`, { 
            state: { recipientId: userId, recipientName: profileUser.displayName }
        });
    };

    if (!profileUser || userPosts === null) return <LoadingSpinner />;

    const isMyProfile = currentUser.uid === userId;
    const isFollowing = profileUser.followers?.includes(currentUser.uid) || false;
    const userLocation = (isMyProfile && currentUser.isAdmin) ? '관리자' : (profileUser.region && profileUser.city ? `${profileUser.region} ${profileUser.city}` : '지역 정보 없음');

    return (
        <div className="p-4 pb-16">
            <div className="flex items-start mb-6">
                <div className="w-16 h-16 rounded-full mr-4 shrink-0 bg-gray-200 overflow-hidden flex items-center justify-center">
                    {profileUser.photoURL ? (<img src={profileUser.photoURL} alt={profileUser.displayName} className="w-full h-full object-cover" />) : (<UserCircle size={64} className="text-gray-400" />)}
                </div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold">{profileUser.displayName}</h2>
                    <p className="text-sm text-gray-600 mt-1">{profileUser.bio || '자기소개를 입력해주세요.'}</p>
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <span>{userLocation}</span>
                        {isMyProfile && 
                            <span className="cursor-pointer text-blue-500" title="지역 변경은 관리자에게 문의해주세요." onClick={() => navigate(`/profile/${ADMIN_UID}`)}>
                                <HelpCircle size={14} />
                            </span>
                        }
                    </div>
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
                        <button onClick={() => navigate('/profile/edit')} className="flex-1 p-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 flex items-center justify-center gap-1"><Edit size={16} /> 프로필 편집</button>
                        <button onClick={handleLogout} className="flex-1 p-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 flex items-center justify-center gap-1"><LogOut size={16} /> 로그아웃</button>
                    </>
                ) : (
                    <>
                        <button onClick={handleFollow} className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${isFollowing ? 'bg-gray-200 text-[#00462A]' : 'bg-[#00462A] text-white'}`} >
                            {isFollowing ? '✓ 팔로잉' : '+ 팔로우'}
                        </button>
                        <button onClick={handleMessage} className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-[#00462A] border border-[#00462A] flex items-center justify-center gap-1.5">
                            <MessageSquare size={16} /> 메시지
                        </button>
                    </>
                )}
            </div>

            <div className="space-y-3">
                <h3 className="text-lg font-bold">작성한 글</h3>
                {userPosts.length > 0 ? userPosts.map(post => (
                    <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                        <h4 className="font-bold text-md truncate mb-1">{post.title}</h4>
                        <p className="text-gray-600 text-sm truncate">{post.content}</p>
                    </div>
                )) : (
                    <p className="text-center text-gray-500 py-10">아직 작성한 글이 없습니다.</p>
                )}
            </div>
        </div>
    );
};

// =================================================================
// ▼▼▼ 4단계: 생성, 수정 및 기타 페이지 ▼▼▼
// =================================================================

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
    const userCity = currentUser?.city;
    const dynamicMomCategory = userCity ? `${userCity}맘` : '마을맘';
    const categories = ['일상', '친목', '10대', '청년', '중년', dynamicMomCategory, '질문', '기타'];
    const [category, setCategory] = useState(itemToEdit?.category || '일상');
    
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

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

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.');
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let imageUrl = itemToEdit?.imageUrl || null;
            let imagePath = itemToEdit?.imagePath || null;

            if (imageFile) {
                if (itemToEdit?.imagePath) {
                    await deleteObject(ref(storage, itemToEdit.imagePath)).catch(console.error);
                }
                const newImagePath = `posts/${currentUser.uid}/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, newImagePath);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
                imagePath = newImagePath;
            }

            const postData = {
                title,
                content,
                category,
                imageUrl,
                imagePath,
                updatedAt: Timestamp.now(),
                region: currentUser.region,
                city: currentUser.city,
            };

            if (itemToEdit) {
                await updateDoc(doc(db, 'posts', itemToEdit.id), postData);
            } else {
                Object.assign(postData, {
                    authorId: currentUser.uid,
                    authorName: currentUser.displayName,
                    authorPhotoURL: currentUser.photoURL,
                    createdAt: Timestamp.now(),
                    likes: [],
                    likesCount: 0,
                    bookmarks: [],
                    commentCount: 0,
                    reportCount: 0,
                });
                await addDoc(collection(db, 'posts'), postData);
            }
            navigate('/board');
        } catch (error) {
            alert(`오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="p-4 flex items-center border-b">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-lg font-bold mx-auto">{itemToEdit ? "글 수정" : "글쓰기"}</h2>
                <button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">
                    {isSubmitting ? '등록 중...' : '완료'}
                </button>
            </div>
            <div className="p-4 space-y-4">
                <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${category === cat ? `${getCategoryStyle(cat, userCity).bgStrong} text-white` : 'bg-gray-200 text-gray-700'}`}>
                            {cat}
                        </button>
                    ))}
                </div>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="w-full text-xl p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요..." className="w-full h-64 p-2 focus:outline-none resize-none" />
                <div className="border-t pt-4">
                    <label htmlFor="image-upload-post" className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#00462A]">
                        <ImageUp size={20} /><span>사진 추가</span>
                    </label>
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

const NewsWritePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const itemToEdit = location.state?.itemToEdit;
    
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [content, setContent] = useState(itemToEdit?.content || '');
    const [tags, setTags] = useState(itemToEdit?.tags?.join(', ') || '');
    const [date, setDate] = useState(itemToEdit?.date || '');
    const [linkUrl, setLinkUrl] = useState(itemToEdit?.linkUrl || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(itemToEdit?.imageUrl || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [regions, setRegions] = useState([]);
    const [cities, setCities] = useState([]);
    const [postRegion, setPostRegion] = useState(itemToEdit?.region || '');
    const [postCity, setPostCity] = useState(itemToEdit?.city || '');

    // 1. [코드 추가] 이미지 변경을 처리하는 함수입니다.
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // 기존 미리보기 URL이 있으면 메모리 누수 방지를 위해 해제합니다.
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    // 2. [코드 추가] 컴포넌트가 사라질 때 미리보기 URL을 메모리에서 정리합니다.
    useEffect(() => {
        return () => {
            if (imagePreview && imagePreview.startsWith('blob:')) {
                URL.revokeObjectURL(imagePreview);
            }
        };
    }, [imagePreview]);

    useEffect(() => {
        fetchRegions().then(setRegions);
    }, []);

    const handleRegionChange = async (e) => {
        const regionName = e.target.value;
        setPostRegion(regionName);
        setPostCity('');

        if (!regionName) {
            setCities([]);
            return;
        }

        const regionData = regions.find(r => r.name === regionName);
        if (regionData) {
            const fetchedCities = await fetchCities(regionData.code, regionData.name);
            setCities(fetchedCities);
        }
    };
    
    useEffect(() => {
        if(itemToEdit && regions.length > 0) {
            const regionData = regions.find(r => r.name === itemToEdit.region);
            if(regionData) {
                fetchCities(regionData.code, regionData.name).then(setCities);
            }
        }
    }, [itemToEdit, regions]);


    const handleSubmit = async () => {
        if (!title.trim() || !content.trim() || !date || !postRegion || !postCity) {
            alert('게시할 지역, 날짜, 제목, 내용을 모두 입력해주세요.');
            return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let imageUrl = itemToEdit?.imageUrl || null;
            let imagePath = itemToEdit?.imagePath || null;

            if (imageFile) {
                if(itemToEdit?.imagePath) await deleteObject(ref(storage, itemToEdit.imagePath));
                const newImagePath = `news_images/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, newImagePath);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
                imagePath = newImagePath;
            }

            const finalData = {
                title, content, imageUrl, imagePath, date, linkUrl,
                updatedAt: Timestamp.now(),
                tags: tags.split(',').map(t=>t.trim()).filter(Boolean),
                region: postRegion,
                city: postCity
            };

            if (itemToEdit) {
                await updateDoc(doc(db, 'news', itemToEdit.id), finalData);
            } else {
                await addDoc(collection(db, 'news'), { ...finalData, createdAt: Timestamp.now(), authorId: currentUser.uid });
            }
            navigate('/news');
        } catch (error) {
            alert(`오류: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="p-4 flex items-center border-b">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-lg font-bold mx-auto">{itemToEdit ? "소식 수정" : "소식 작성"}</h2>
                <button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">
                    {isSubmitting ? '등록 중' : '완료'}
                </button>
            </div>
            <div className="p-4 space-y-4">
                <div className="p-3 bg-gray-50 border rounded-lg space-y-2">
                    <p className="font-bold text-sm text-gray-700">게시 지역 선택</p>
                    <div className="flex gap-2">
                        <select 
                            value={postRegion} 
                            onChange={handleRegionChange}
                            className="w-1/2 p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">시/도 선택</option>
                            {regions.map(r => <option key={r.code} value={r.name}>{r.name}</option>)}
                        </select>
                        <select 
                            value={postCity}
                            onChange={(e) => setPostCity(e.target.value)}
                            disabled={cities.length === 0}
                            className="w-1/2 p-2 border border-gray-300 rounded-md"
                        >
                            <option value="">시/군 선택</option>
                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>
                <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <input type="text" value={tags} onChange={e=>setTags(e.target.value)} placeholder="태그 (쉼표로 구분)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                 <input type="url" value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="관련 링크 URL (선택사항)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목" className="w-full text-xl p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="내용을 입력하세요..." className="w-full h-64 p-2 focus:outline-none resize-none" />
                <div className="border-t pt-4">
                    <label htmlFor="image-upload-news" className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#00462A]">
                        <ImageUp size={20} /><span>사진 추가</span>
                    </label>
                    {/* 3. [코드 수정] onChange 핸들러를 새로 만든 함수로 연결합니다. */}
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

const BenefitWritePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { category: initialCategory } = location.state || { category: '가게' };

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [contact, setContact] = useState('');
    const [category, setCategory] = useState(initialCategory);
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim() || !category) {
            alert('카테고리, 제목, 내용은 필수 항목입니다.');
            return;
        }
        if (!currentUser?.city) {
            alert('혜택을 등록할 지역 정보가 없습니다.');
            return;
        }
        setIsSubmitting(true);

        try {
            let imageUrl = null;
            let imagePath = null;
            if (imageFile) {
                imagePath = `benefits_images/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, imagePath);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
            }

            const benefitData = {
                title,
                content,
                contact,
                category,
                imageUrl,
                imagePath,
                city: currentUser.city,
                region: currentUser.region,
                authorId: currentUser.uid,
                createdAt: Timestamp.now(),
            };
            
            await addDoc(collection(db, 'benefits'), benefitData);
            navigate('/benefits');

        } catch (error) {
            console.error("Error adding benefit: ", error);
            alert(`오류가 발생했습니다: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div>
            <div className="p-4 flex items-center border-b">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-lg font-bold mx-auto">혜택 정보 작성</h2>
                <button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">
                    {isSubmitting ? '등록 중' : '완료'}
                </button>
            </div>
            <div className="p-4 space-y-4">
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full p-3 border border-gray-300 rounded-lg">
                    <option value="가게">가게</option>
                    <option value="부동산">부동산</option>
                    <option value="구인구직">구인구직</option>
                </select>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="제목" className="w-full text-xl p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <input type="text" value={contact} onChange={e => setContact(e.target.value)} placeholder="연락처 또는 주소" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="상세 내용을 입력하세요..." className="w-full h-48 p-2 focus:outline-none resize-none" />
                <div className="border-t pt-4">
                    <label htmlFor="image-upload-benefit" className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#00462A]">
                        <ImageUp size={20} /><span>대표 사진 추가</span>
                    </label>
                    <input id="image-upload-benefit" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
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

const ClubCreatePage = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [name, setName] = useState('');
    const [desc, setDesc] = useState('');
    const [category, setCat] = useState('');
    const [password, setPassword] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!name || !desc || !imageFile) {
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
                description: desc,
                category,
                password,
                photoURL,
                imagePath,
                creatorId: currentUser.uid,
                creatorName: currentUser.displayName,
                members: [currentUser.uid],
                createdAt: Timestamp.now(),
            });
            navigate('/board');
        } catch (e) {
            console.error(e);
            alert('모임 생성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleImageChange = (e) => {
        const f = e.target.files[0];
        if (f) {
            if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
            setImageFile(f);
            setImagePreview(URL.createObjectURL(f));
        }
    };

    return (
        <div>
            <div className="p-4 flex items-center border-b">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-lg font-bold mx-auto">모임 만들기</h2>
                <button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">
                    {isSubmitting ? '생성 중...' : '완료'}
                </button>
            </div>
            <div className="p-4 space-y-4">
                <div className="flex justify-center">
                    <label htmlFor="club-image-upload" className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden">
                        {imagePreview ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" /> : <ImageUp />}
                    </label>
                    <input id="club-image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </div>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="모임 이름" className="w-full p-3 border-b-2 focus:outline-none focus:border-[#00462A]"/>
                <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="모임 소개" className="w-full p-3 border-b-2 h-24 resize-none focus:outline-none focus:border-[#00462A]"/>
                <input type="text" value={category} onChange={(e) => setCat(e.target.value)} placeholder="카테고리 (예: 등산, 독서)" className="w-full p-3 border-b-2 focus:outline-none focus:border-[#00462A]"/>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 (없으면 공개 모임)" className="w-full p-3 border-b-2 focus:outline-none focus:border-[#00462A]"/>
            </div>
        </div>
    );
};

const ClubManagePage = () => {
    const { clubId } = useParams();
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const q = query(collection(db, `clubs/${clubId}/joinRequests`), where('status', '==', 'pending'));
        const unsub = onSnapshot(q, (snapshot) => {
            setRequests(snapshot.docs.map(d => ({id: d.id, ...d.data()})));
        });
        return unsub;
    }, [clubId]);

    const handleRequest = async (requestId, newStatus) => {
        const clubRef = doc(db, 'clubs', clubId);
        const requestRef = doc(db, `clubs/${clubId}/joinRequests`, requestId);
        const userId = requests.find(r => r.id === requestId)?.userId;

        try {
            const batch = writeBatch(db);
            batch.update(requestRef, { status: newStatus });
            if (newStatus === 'approved') {
                batch.update(clubRef, { members: arrayUnion(userId) });
            }
            await batch.commit();
        } catch (error) {
            console.error("Error handling request: ", error);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">모임 가입 신청 관리</h2>
            <div className="space-y-3">
                {requests.length > 0 ? requests.map(req => (
                    <div key={req.id} className="bg-white p-4 rounded-lg shadow-sm border">
                        <div className="flex items-center gap-3">
                            <img src={req.userPhotoURL} alt={req.userName} className="w-10 h-10 rounded-full bg-gray-200" />
                            <div>
                                <p className="font-bold">{req.userName}</p>
                                <p className="text-sm text-gray-600">{req.message}</p>
                            </div>
                        </div>
                        <div className="flex gap-2 mt-3 justify-end">
                            <button onClick={() => handleRequest(req.id, 'approved')} className="bg-green-500 text-white px-3 py-1 text-sm rounded-md hover:bg-green-600">승인</button>
                            <button onClick={() => handleRequest(req.id, 'rejected')} className="bg-red-500 text-white px-3 py-1 text-sm rounded-md hover:bg-red-600">거절</button>
                        </div>
                    </div>
                )) : <EmptyState icon={<Users size={48} />} message="새로운 가입 신청이 없습니다." />}
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
            let photoURL = currentUser.photoURL;
            if (imageFile) {
                const imagePath = `profile_images/${currentUser.uid}/profile.jpg`;
                const storageRef = ref(storage, imagePath);
                await uploadBytes(storageRef, imageFile);
                photoURL = await getDownloadURL(storageRef);
            }
            await updateDoc(doc(db, 'users', currentUser.uid), { bio, town, photoURL });
            if (photoURL !== currentUser.photoURL) {
                await updateProfile(auth.currentUser, { photoURL });
            }
            alert('프로필이 성공적으로 업데이트되었습니다.');
            navigate(`/profile/${currentUser.uid}`);
        } catch (e) {
            console.error("Profile update error:", e);
            alert(`오류 발생: ${e.message}`);
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
                        {imagePreview ? (<img src={imagePreview} alt="프로필 미리보기" className="w-full h-full object-cover" />) : (<UserCircle size={96} className="text-gray-400" />)}
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

const ChatListPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState(null);

    useEffect(() => {
        if (!currentUser) return;
        const q = query(collection(db, 'chats'), where('members', 'array-contains', currentUser.uid), orderBy('lastMessage.createdAt', 'desc'));
        
        const unsub = onSnapshot(q, async (s) => {
            const cData = await Promise.all(s.docs.map(async d => {
                const cd = d.data();
                const oId = cd.members.find(id => id !== currentUser.uid);
                if (!oId) return null;

                const uDoc = await getDoc(doc(db, 'users', oId));
                if (!uDoc.exists()) {
                    return { id: d.id, ...cd, otherUser: { displayName: '알 수 없음', uid: oId } };
                }

                const otherUserData = uDoc.data();
                // ▼▼▼▼▼ [핵심 수정] 상대방의 photoURL이 http://로 시작하면 https://로 변경합니다. ▼▼▼▼▼
                if (otherUserData.photoURL?.startsWith('http://')) {
                    otherUserData.photoURL = otherUserData.photoURL.replace('http://', 'https://');
                }
                // ▲▲▲▲▲ 수정 완료 ▲▲▲▲▲

                return { id: d.id, ...cd, otherUser: { uid: uDoc.id, ...otherUserData } };
            }));
            setChats(cData.filter(Boolean));
        }, (e) => {
            console.error("Chat list error:", e);
            setChats([]);
        });

        return () => unsub();
    }, [currentUser]);

    if (chats === null) return <LoadingSpinner />;

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">채팅 목록</h2>
            <div className="space-y-3">
                {chats.length > 0 ? chats.map(chat => (
                    <div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`, { state: { recipientId: chat.otherUser.uid, recipientName: chat.otherUser.displayName }})} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-300 shrink-0 overflow-hidden flex items-center justify-center">
                            {chat.otherUser.photoURL ? <img src={chat.otherUser.photoURL} alt={chat.otherUser.displayName} className="w-full h-full object-cover" /> : <UserCircle size={48} className="text-gray-400"/>}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h3 className="font-bold">{chat.otherUser.displayName}</h3>
                            <p className="text-sm text-gray-500 truncate">{chat.lastMessage?.text || '메시지를 보내보세요.'}</p>
                        </div>
                    </div>
                )) : (
                    <EmptyState icon={<MessageSquare size={48} />} message="진행중인 대화가 없습니다." />
                )}
            </div>
        </div>
    );
};

const ChatPage = () => {
    const { currentUser } = useAuth();
    const { chatId } = useParams();
    const location = useLocation();
    
    const getRecipientId = () => {
        if (location.state?.recipientId) return location.state.recipientId;
        if (currentUser?.uid && chatId) {
            const ids = chatId.split('_');
            return ids.find(id => id !== currentUser.uid);
        }
        return null;
    };
    
    const recipientId = getRecipientId();

    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isAllowed, setIsAllowed] = useState(true);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!chatId || !currentUser || !recipientId) {
            setLoading(false);
            setIsAllowed(false);
            return;
        }
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));
        
        const unsub = onSnapshot(q, s => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => setLoading(false));
        
        return () => unsub();
    }, [chatId, currentUser, recipientId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !recipientId) return;

        // ================================================================
        // ▼▼▼▼▼ [진단 코드] 보내주신 점검 코드를 여기에 추가했습니다 ▼▼▼▼▼
        // ================================================================
        try {
            console.log("--- 채팅방 권한 점검 시작 ---");
            const chatRef = doc(db, "chats", chatId);
            const chatSnap = await getDoc(chatRef);

            if (!chatSnap.exists()) {
              console.error("❌ 점검 결과: 채팅방 문서가 존재하지 않습니다. 첫 메시지를 보내기 전에 채팅방부터 생성해야 합니다.");
            } else {
              const data = chatSnap.data();
              const members = data.members || [];
              const uid = auth.currentUser?.uid;

              console.log("✅ 채팅방 members:", members);
              console.log("🧑 현재 유저 UID:", uid);
              console.log("멤버 포함 여부:", members.includes(uid) ? "✅ 포함됨 (정상)" : "❌ 포함 안 됨 (오류 원인!)");
            }
            console.log("--- 채팅방 권한 점검 종료 ---");
        } catch (error) {
            console.error("점검 코드 실행 중 오류:", error);
        }
        // ================================================================
        // ▲▲▲▲▲ [진단 코드] 여기까지 추가했습니다 ▲▲▲▲▲
        // ================================================================


        // 메시지 전송 로직 (이전과 동일)
        const chatRef = doc(db, 'chats', chatId);
        const messagesColRef = collection(chatRef, 'messages');
        
        try {
            const chatDoc = await getDoc(chatRef);

            if (!chatDoc.exists()) {
                await setDoc(chatRef, {
                    members: [currentUser.uid, recipientId],
                    createdAt: Timestamp.now(),
                    lastMessage: null
                });
            }

            const messageData = { 
                text: newMessage, 
                senderId: currentUser.uid, 
                createdAt: Timestamp.now() 
            };
            await addDoc(messagesColRef, messageData);
            
            await updateDoc(chatRef, { lastMessage: messageData });

            setNewMessage('');

        } catch (error) {
            console.error("Send message error:", error);
            alert("메시지 전송에 실패했습니다. 개발자 콘솔의 '점검 결과'를 확인해주세요.");
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!isAllowed) return <div className="p-4 text-center text-red-500">채팅방 접근 권한이 없습니다.</div>;

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
            <div className="bg-white border-t p-3 sticky bottom-0" style={{paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))'}}>
                <form onSubmit={handleSendMessage} className="relative flex items-center">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="메시지 입력" className="w-full pl-4 pr-12 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]" />
                    <button type="submit" className="absolute right-2 p-2 rounded-full text-gray-500 hover:bg-gray-200"><Send size={20} /></button>
                </form>
            </div>
        </div>
    );
};

// =================================================================
// ▼▼▼ 레이아웃 및 라우팅 설정 ▼▼▼
// =================================================================

const PageLayout = ({ children, hasHeader = true, hasFooter = true, isChat = false }) => {
    return (
        <div className="flex flex-col" style={{minHeight:'100vh'}}>
            {hasHeader && <Header />}
            <main className={`flex-grow bg-gray-50 ${isChat ? 'flex flex-col' : ''}`}>
                {children}
            </main>
            {hasFooter && <BottomNav />}
        </div>
    );
};

const Header = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, adminSelectedCity, setAdminSelectedCity } = useAuth();
    
    // 지역 선택 UI를 위한 상태
    const [regions, setRegions] = useState([]); // 시/도 목록
    const [cities, setCities] = useState([]);   // 선택된 시/도에 따른 시/군 목록
    const [selectedRegionName, setSelectedRegionName] = useState(''); // 선택된 시/도 이름

    // 1. 앱이 시작되면 전체 시/도 목록을 한번만 불러옵니다.
    useEffect(() => {
        fetchRegions().then(setRegions);
    }, []);

    // 2. 시/도를 선택할 때마다 실행됩니다.
    const handleRegionChange = async (e) => {
        const regionName = e.target.value;
        setSelectedRegionName(regionName);

        // 선택을 초기화하면 시/군 목록도 비웁니다.
        if (!regionName) {
            setCities([]);
            setAdminSelectedCity(null);
            return;
        }

        // 선택된 시/도 이름으로 해당 지역의 전체 정보(코드 포함)를 찾습니다.
        const regionData = regions.find(r => r.name === regionName);
        if (regionData) {
            // 해당 지역의 시/군 목록을 불러옵니다.
            const fetchedCities = await fetchCities(regionData.code, regionData.name);
            setCities(fetchedCities);
            // 시/도를 바꾸면 시/군 선택은 '전체'로, 전역 상태는 초기화합니다.
            setAdminSelectedCity(null); 
        }
    };

    // 3. 시/군을 선택할 때마다 실행됩니다.
    const handleCityChange = (e) => {
        const cityName = e.target.value;
        if (cityName === '전체' || !cityName) {
            setAdminSelectedCity(null);
        } else {
            setAdminSelectedCity(cityName);
        }
    };

    // (페이지 제목을 가져오는 함수 등 나머지 부분은 동일합니다)
    const getPageTitle = () => {
        const { pathname } = location;
        if (pathname.startsWith('/profile/')) return '프로필';
        if (pathname.startsWith('/post/')) return '게시글';
        if (pathname.startsWith('/club/')) return '모임 상세';
        if (pathname.startsWith('/benefit/')) return '혜택 정보';
        if (pathname.startsWith('/chat/')) return location.state?.recipientName || '채팅';
        
        const titles = {
            '/home': '마을N', '/news': '소식', '/board': '게시판',
            '/calendar': '달력', '/benefits': '혜택', '/search': '검색',
            '/notifications': '알림', '/chats': '채팅',
        };
        return titles[pathname] || '마을N';
    };
    
    const isHomePage = location.pathname === '/home';
    if (!currentUser) return null;

    return (
        <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 w-full max-w-sm mx-auto">
            <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 h-16">
                <div className="flex items-center gap-2 flex-1">
                    {isHomePage ? <Logo className="w-7 h-7" /> : <button onClick={() => navigate(-1)} className="p-1 -ml-2"><ArrowLeft size={24} /></button>}
                    {!isHomePage && <h1 className="text-xl font-bold text-gray-800 truncate">{getPageTitle()}</h1>}
                </div>
                <div className="flex items-center gap-3">
                    <Link to="/search" className="p-1"><Search size={24} className="text-gray-600" /></Link>
                    <Link to="/chats" className="p-1"><MessageSquare size={24} className="text-gray-600" /></Link>
                    <Link to="/notifications" className="p-1"><Bell size={24} className="text-gray-600" /></Link>
                    <Link to={`/profile/${currentUser.uid}`}>
                        {currentUser.photoURL ? 
                            <img src={currentUser.photoURL} alt="profile" className="w-8 h-8 rounded-full bg-gray-200 object-cover"/> : 
                            <UserCircle size={32} className="text-gray-400"/>
                        }
                    </Link>
                </div>
            </div>
            
            {currentUser.isAdmin && (
                <div className="p-2 bg-gray-100 border-b flex items-center gap-2 text-sm">
                    <span className="font-bold text-gray-600 pl-2">지역뷰:</span>
                    <select 
                        value={selectedRegionName} 
                        onChange={handleRegionChange}
                        className="p-1 border border-gray-300 rounded-md"
                    >
                        <option value="">시/도</option>
                        {regions.map(r => <option key={r.code} value={r.name}>{r.name}</option>)}
                    </select>
                    <select
                        onChange={handleCityChange} 
                        disabled={cities.length === 0}
                        className="p-1 border border-gray-300 rounded-md flex-1"
                        // 시/도 변경 시 값을 초기화하기 위해 key 속성 추가
                        key={selectedRegionName} 
                    >
                        <option value="전체">전체</option>
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
            )}
        </header>
    );
};

const BottomNav = () => {
    const location = useLocation();
    const navItems = [
        { path: '/home', icon: Home, label: '홈' },
        { path: '/news', icon: Newspaper, label: '소식' },
        { path: '/board', icon: LayoutGrid, label: '게시판' },
        { path: '/calendar', icon: CalendarIcon, label: '달력' },
        { path: '/benefits', icon: TicketPercent, label: '혜택' }
    ];

    if (['/start', '/region-setup'].some(p => location.pathname.startsWith(p))) return null;

    return (
        <footer className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto z-40 bg-white/80 backdrop-blur-sm border-t border-gray-200">
            <div className="flex justify-around items-center" style={{paddingBottom: 'env(safe-area-inset-bottom)'}}>
                {navItems.map(item => (
                    <Link
                        to={item.path}
                        key={item.path}
                        className="text-center p-2 rounded-lg w-1/5 flex flex-col items-center justify-center h-16"
                    >
                        <item.icon className={`w-6 h-6 mb-1 ${location.pathname.startsWith(item.path) ? 'text-[#00462A]' : 'text-gray-500'}`} />
                        <span className={`text-xs font-medium ${location.pathname.startsWith(item.path) ? 'text-[#00462A] font-bold' : 'text-gray-500'}`}>{item.label}</span>
                    </Link>
                ))}
            </div>
        </footer>
    );
};

const ProtectedRoute = ({ children }) => {
    const { currentUser, loading } = useAuth();
    const location = useLocation();

    if (loading || (currentUser && !currentUser.isFirestoreDataLoaded)) {
        return (
            <div className="max-w-sm mx-auto bg-white min-h-screen flex items-center justify-center"><LoadingSpinner /></div>
        );
    }

    if (!currentUser) {
        return location.pathname === '/start' ? children : <Navigate to="/start" replace />;
    }

    if (currentUser.isAdmin) {
        if (['/start', '/region-setup'].includes(location.pathname)) {
            return <Navigate to="/home" replace />;
        }
        return children;
    }

    if (!currentUser.city) {
        return location.pathname === '/region-setup' ? children : <Navigate to="/region-setup" replace />;
    }

    if (currentUser.city) {
        if (['/start', '/region-setup'].includes(location.pathname)) {
            return <Navigate to="/home" replace />;
        }
        return children;
    }

    return <Navigate to="/start" replace />;
};

function App() {
    return (
        <HelmetProvider>
            <AuthProvider>
                <BrowserRouter>
                    <div className="max-w-sm mx-auto bg-gray-50 shadow-lg min-h-screen font-sans text-gray-800">
                        <Routes>
                            <Route path="/*" element={
                                <ProtectedRoute>
                                    <Routes>
                                        {/* 시작 및 인증 */}
                                        <Route path="/start" element={<StartPage />} />
                                        <Route path="/region-setup" element={<RegionSetupPage />} />
                                        
                                        {/* 핵심 탭 페이지 */}
                                        <Route path="/home" element={<PageLayout><HomePage /></PageLayout>} />
                                        <Route path="/news" element={<PageLayout><NewsPage /></PageLayout>} />
                                        <Route path="/board" element={<PageLayout><BoardPage /></PageLayout>} />
                                        <Route path="/calendar" element={<PageLayout><CalendarPage /></PageLayout>} />
                                        <Route path="/benefits" element={<PageLayout><BenefitsPage /></PageLayout>} />
                                        
                                        {/* 서브 페이지 */}
                                        <Route path="/post/:postId" element={<PageLayout hasFooter={false}><PostDetailPage /></PageLayout>} />
                                        <Route path="/benefit/:benefitId" element={<PageLayout hasFooter={false}><BenefitDetailPage /></PageLayout>} />
                                        <Route path="/club/:clubId" element={<PageLayout hasFooter={false}><ClubDetailPage /></PageLayout>} />
                                        <Route path="/profile/:userId" element={<PageLayout hasFooter={false}><UserProfilePage /></PageLayout>} />
                                        <Route path="/chats" element={<PageLayout><ChatListPage /></PageLayout>} />
                                        <Route path="/chat/:chatId" element={<PageLayout hasHeader={true} hasFooter={false} isChat={true}><ChatPage /></PageLayout>} />
                                        <Route path="/notifications" element={<PageLayout><NotificationsPage /></PageLayout>} />
                                        <Route path="/search" element={<PageLayout><SearchPage /></PageLayout>} />

                                        {/* 작성/수정/설정 페이지 */}
                                        <Route path="/post/write" element={<PageLayout hasHeader={false} hasFooter={false}><WritePage /></PageLayout>} />
                                        <Route path="/post/edit/:postId" element={<PageLayout hasHeader={false} hasFooter={false}><WritePage /></PageLayout>} />
                                        <Route path="/news/write" element={<PageLayout hasHeader={false} hasFooter={false}><NewsWritePage /></PageLayout>} />
                                        <Route path="/benefit/write" element={<PageLayout hasHeader={false} hasFooter={false}><BenefitWritePage /></PageLayout>} />
                                        <Route path="/club/create" element={<PageLayout hasHeader={false} hasFooter={false}><ClubCreatePage /></PageLayout>} />
                                        <Route path="/club/manage/:clubId" element={<PageLayout hasFooter={false}><ClubManagePage /></PageLayout>} />
                                        <Route path="/profile/edit" element={<PageLayout hasHeader={false} hasFooter={false}><ProfileEditPage /></PageLayout>} />
                                        
                                        {/* 일치하는 경로가 없을 경우 홈으로 리다이렉트 */}
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
