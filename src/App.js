// src/App.js

import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
// ▼▼▼ [수정] 'Routes'를 import 목록에 추가 ▼▼▼
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signOut, updateProfile, OAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, onSnapshot, doc, setDoc, getDoc, updateDoc, increment, arrayUnion, arrayRemove, Timestamp, where, orderBy, limit, deleteDoc, getDocs, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { Home, Newspaper, LayoutGrid, Users, TicketPercent, ArrowLeft, Heart, MessageCircle, Send, PlusCircle, ChevronLeft, ChevronRight, X, Search, Bell, Star, Pencil, LogOut, Edit, MessageSquare, Trash2, ImageUp, UserCircle, Lock, Edit2 } from 'lucide-react';

// 외부 파일에서 함수 및 변수 import
import { fetchRegions, fetchCities, getAllRegionCityMap } from './services/region.service';
import { timeSince } from './utils/timeSince';
import { ADMIN_UID, categoryStyles, getCategoryStyle } from './constants';

// Firebase 초기화
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
                    let finalUser = { ...user, isFirestoreDataLoaded: true };
                    if (userSnap.exists()) finalUser = { ...finalUser, ...userSnap.data() };
                    finalUser.isAdmin = finalUser.role === 'admin';
                    if (finalUser.photoURL?.startsWith('http://')) finalUser.photoURL = finalUser.photoURL.replace('http://', 'https://');
                    setCurrentUser(finalUser);
                    setLoading(false);
                }, (error) => { console.error("User doc snapshot error:", error); setCurrentUser({ ...user, isFirestoreDataLoaded: true }); setLoading(false); });
                return () => userUnsubscribe();
            } else { setCurrentUser(null); setLoading(false); }
        });
        return () => unsubscribe();
    }, []);

    const value = { currentUser, loading, adminSelectedCity, setAdminSelectedCity };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => useContext(AuthContext);

// =================================================================
// ▼▼▼ 로고, 헬퍼, 공용 컴포넌트 ▼▼▼
// =================================================================
const Logo = ({ size = 28 }) => (<img src="/logo192.png" alt="Logo" width={size} height={size} style={{ objectFit: 'contain' }}/>);
const Modal = ({ isOpen, onClose, children }) => !isOpen ? null : (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"><div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"><div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center z-10"><div className="w-6"></div><h2 className="text-lg font-bold"> </h2><button onClick={onClose} className="text-gray-500 hover:text-gray-800"><X size={24} /></button></div><div className="p-6">{children}</div></div></div>);
const LoadingSpinner = () => (<div className="flex justify-center items-center h-full pt-20"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00462A]"></div></div>);
const PwaInstallModal = ({ isOpen, onClose }) => { const [isIOS, setIsIOS] = useState(false); useEffect(() => { setIsIOS(/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase())); }, []); if (!isOpen) return null; const ShareIosIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block w-5 h-5 mx-1 align-middle"><path d="M12 22V8"/><path d="m7 13 5-5 5 5"/><path d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5"/></svg>); const PlusSquareIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block w-5 h-5 mx-1 align-middle"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M8 12h8"/><path d="M12 8v8"/></svg>); const MoreVerticalIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block w-5 h-5 mx-1 align-middle"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>); const iosInstructions = (<div className="text-center"><p className="text-lg font-semibold mb-4">iOS에서는</p><p className="mb-4">공유 버튼 <ShareIosIcon /> 을 누른 후</p><p className="mb-6">'홈 화면에 추가' <PlusSquareIcon /> 를 선택해주세요.</p></div>); const androidInstructions = (<div className="text-center"><p className="text-lg font-semibold mb-4">Android에서는</p><p className="mb-4">오른쪽 상단 메뉴 <MoreVerticalIcon /> 를 누른 후</p><p className="mb-6">'홈 화면에 추가' 또는 '앱 설치'를 선택해주세요.</p></div>); return (<div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4"><div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative"><button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"><X size={24} /></button>{isIOS ? iosInstructions : androidInstructions}<button onClick={onClose} className="w-full mt-4 text-center text-blue-600 font-semibold py-2">닫기</button></div></div>); };
const NewsCard = ({ news, isAdmin, openDetailModal, handleDeleteNews, handleLikeNews, isLiked }) => (<div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">{news.imageUrl && <img src={news.imageUrl} alt={news.title} className="w-full h-32 object-cover" />}<div className="p-4"><h3 className="font-bold text-lg truncate mb-1">{news.title}</h3><p className="text-gray-600 text-sm h-10 overflow-hidden text-ellipsis mb-3">{news.content}</p><div className="flex justify-between items-center text-xs text-gray-500"><button onClick={() => openDetailModal(news)} className="font-semibold text-blue-600 hover:underline">자세히 보기</button><div className="flex items-center gap-2">{isAdmin && <button onClick={() => handleDeleteNews(news.id, news.imagePath)} className="text-red-500"><Trash2 size={16} /></button>}<button onClick={() => handleLikeNews(news)} className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-400'}`}><Heart size={16} className={isLiked ? 'fill-current' : ''}/></button></div></div></div></div>);
const Calendar = ({ events, onDateClick }) => { const [currentDate, setCurrentDate] = useState(new Date()); const today = new Date(); const startDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay(); const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate(); const changeMonth = (offset) => { setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1)); }; return (<div className="bg-white p-4 rounded-lg shadow"><div className="flex justify-between items-center mb-4"><button onClick={() => changeMonth(-1)}><ChevronLeft/></button><h3 className="font-bold text-lg">{`${currentDate.getFullYear()}년 ${currentDate.getMonth() + 1}월`}</h3><button onClick={() => changeMonth(1)}><ChevronRight/></button></div><div className="grid grid-cols-7 gap-1 text-center text-sm">{['일', '월', '화', '수', '목', '금', '토'].map(day => <div key={day} className="font-semibold text-gray-600">{day}</div>)}{Array.from({ length: startDay }).map((_, i) => <div key={`empty-${i}`}></div>)}{Array.from({ length: daysInMonth }).map((_, day) => { const date = day + 1; const fullDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`; const isToday = today.getFullYear() === currentDate.getFullYear() && today.getMonth() === currentDate.getMonth() && today.getDate() === date; const hasEvent = events[fullDateStr]?.length > 0; return (<div key={date} onClick={() => onDateClick(fullDateStr)} className="py-2 cursor-pointer relative"><span className={`mx-auto flex items-center justify-center rounded-full w-8 h-8 ${isToday ? 'bg-red-500 text-white' : ''} ${hasEvent ? 'font-bold' : ''}`}>{date}</span>{hasEvent && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full"></div>}</div>);})}</div></div>);};

// =================================================================
// ▼▼▼ 페이지 컴포넌트들 ▼▼▼
// =================================================================
const StartPage = () => { const [loading, setLoading] = useState(false); const [error, setError] = useState(''); const [isModalOpen, setIsModalOpen] = useState(false); const handleKakaoLogin = async () => { setLoading(true); setError(''); try { const provider = new OAuthProvider('oidc.kakao.com'); provider.setCustomParameters({ prompt: 'select_account' }); await signInWithPopup(auth, provider); } catch (error) { if (error.code !== 'auth/popup-closed-by-user') { setError("카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요."); } console.error("Kakao Login Error:", error); } finally { setLoading(false); } }; return (<><Helmet><title>마을N - 우리 동네 SNS</title></Helmet><PwaInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} /><div className="flex flex-col items-center justify-center h-screen bg-green-50 p-4"><div className="text-center mb-8 flex flex-col items-center"><Logo size={80} /><h1 className="text-3xl font-bold text-gray-800 mt-4">마을N</h1><p className="text-gray-600 mt-2 text-center">전국 모든 마을의 이야기<br/>'마을N'에서 확인하세요!</p></div><div className="w-full max-w-xs">{error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}<button onClick={handleKakaoLogin} disabled={loading} className="w-full bg-[#FEE500] text-[#3C1E1E] font-bold py-3 px-4 rounded-lg flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors disabled:bg-gray-400"><svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.89 0 1.75-.12 2.56-.34l-1.39 4.34c-.08.24.16.45.4.39l4.9-3.06c1.8-1.48 2.53-3.88 2.53-6.33C22 6.48 17.52 2 12 2z" fill="#3C1E1E"/></svg>{loading ? "로그인 중..." : "카카오로 3초만에 시작하기"}</button><div className="mt-6 text-center"><button onClick={() => setIsModalOpen(true)} className="text-sm text-gray-600 hover:text-gray-900 font-semibold underline">마을N 앱 다운받기</button></div></div></div></>); };
const RegionSetupPage = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [regions, setRegions] = useState([]); // regions는 이제 {name, code} 객체를 담습니다.
    const [cities, setCities] = useState([]);
    const [selectedRegion, setSelectedRegion] = useState('');
    const [selectedCity, setSelectedCity] = useState('');
    const [loading, setLoading] = useState(false);
    const [apiLoading, setApiLoading] = useState(true);
    const [error, setError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isSaving && currentUser?.city) {
            navigate('/home');
        }
    }, [currentUser, isSaving, navigate]);

    useEffect(() => {
        fetchRegions().then(data => {
            setRegions(data); // data는 이제 [{name, code}, ...] 형태입니다.
            setApiLoading(false);
        });
    }, []);

    useEffect(() => {
        if (selectedRegion) {
            // 선택된 region 이름으로 전체 regions 배열에서 해당 객체를 찾습니다.
            const regionData = regions.find(r => r.name === selectedRegion);
            if (regionData) {
                setApiLoading(true);
                setCities([]);
                setSelectedCity('');
                // fetchCities에 region 코드와 이름을 전달합니다.
                fetchCities(regionData.code, regionData.name).then(data => {
                    setCities(data);
                    if (data.length === 1) setSelectedCity(data[0]);
                    setApiLoading(false);
                });
            }
        } else {
            setCities([]);
        }
    }, [selectedRegion, regions]); // regions를 의존성 배열에 추가합니다.

    const handleSaveRegion = async () => {
        if (!selectedRegion || !selectedCity) {
            setError('거주 지역을 모두 선택해주세요.');
            return;
        }
        setLoading(true);
        setError('');
        setIsSaving(true);
        try {
            await setDoc(doc(db, "users", currentUser.uid), {
                displayName: currentUser.displayName,
                email: currentUser.email,
                photoURL: currentUser.photoURL,
                region: selectedRegion,
                city: selectedCity,
                town: '',
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
                        {/* regions 배열이 객체를 포함하므로 key와 value를 올바르게 설정합니다. */}
                        {regions.map(r => <option key={r.code} value={r.name}>{r.name}</option>)}
                    </select>
                    <select value={selectedCity} onChange={(e) => setSelectedCity(e.target.value)} disabled={!selectedRegion || apiLoading || cities.length <= 1} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A] disabled:bg-gray-200">
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
    const [posts, setPosts] = useState(null);
    const [buanNews, setBuanNews] = useState(null);
    const [followingPosts, setFollowingPosts] = useState([]);
    const [userEvents, setUserEvents] = useState({});
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const displayCity = adminSelectedCity || (currentUser.isAdmin ? '전국' : currentUser.city);

    const openDetailModal = (news) => {
        setSelectedNews(news);
        setDetailModalOpen(true);
    };

    useEffect(() => {
        if (!currentUser || (!currentUser.isAdmin && !currentUser.city)) return;
        const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);
        if (!currentUser.isAdmin && !targetCity) {
            setPosts([]);
            setBuanNews([]);
            return;
        }
        const createSub = (coll, query, setData) => onSnapshot(query(collection(db, coll), ...query), s => setData(s.docs.map(d => ({id:d.id, ...d.data()}))), ()=>setData([]));
        const q = (targetCity) ? [where("city", "==", targetCity), orderBy("createdAt", "desc")] : [orderBy("createdAt", "desc")];
        const unsubs = [
            createSub('posts', q, setPosts),
            createSub('news', q, setBuanNews),
            onSnapshot(query(collection(db, `users/${currentUser.uid}/events`)), s => {
                const ev = {};
                s.forEach(d => {const e={id:d.id, ...d.data()}; if(!ev[e.date])ev[e.date]=[]; ev[e.date].push(e);});
                setUserEvents(ev);
            })
        ];
        if (currentUser.following?.length > 0) {
            unsubs.push(onSnapshot(query(collection(db, "posts"), where('authorId','in',currentUser.following.slice(0,10)), orderBy("createdAt","desc")), s => setFollowingPosts(s.docs.map(d=>({id:d.id,...d.data()})))));
        } else {
            setFollowingPosts([]);
        }
        return () => unsubs.forEach(un => un());
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
            alert("오류가 발생했습니다. 다시 시도해주세요.");
        }
    };
    
    const handleDeleteNews = async (id, path) => {
        if (!currentUser.isAdmin || !window.confirm("삭제하시겠습니까?")) return;
        try {
            if (path) await deleteObject(ref(storage, path));
            await deleteDoc(doc(db, 'news', id));
            alert("삭제 완료");
        } catch(e) {
            alert(`삭제 오류: ${e.message}`);
        }
    };
    
    if (posts === null || buanNews === null) return <LoadingSpinner />;
    
    const popularPosts = posts ? [...posts].sort((a,b)=>(b.likes?.length||0)-(a.likes?.length||0)).slice(0,3) : [];
    
    return (
        <div className="p-4 space-y-8">
            <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
                {selectedNews && (<div><h2>{selectedNews.title}</h2><p>{selectedNews.content}</p></div>)}
            </Modal>
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold">지금 {displayCity}에서는</h2>
                    <Link to="/news" className="text-sm font-medium text-gray-500 hover:text-gray-800">더 보기 <ChevronRight className="inline-block" size={14} /></Link>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {buanNews.length > 0 ? (
                        buanNews.map(n => (
                            <div key={n.id} className="w-4/5 md:w-3/5 shrink-0">
                                <NewsCard {...{news: n, isAdmin: currentUser.isAdmin, openDetailModal, handleDeleteNews, handleLikeNews, isLiked: currentUser.likedNews?.includes(n.id)}} />
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 w-full p-8 bg-gray-100 rounded-lg">등록된 소식이 없습니다.</div>
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
                    {popularPosts.length > 0 ? (popularPosts.map(p => {
                        const s = getCategoryStyle(p.category, p.city);
                        return (
                            <div key={p.id} onClick={() => navigate(`/post/${p.id}`)} className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3 cursor-pointer">
                                <span className={`text-xs font-bold ${s.text} ${s.bg} px-2 py-1 rounded-md`}>{p.category}</span>
                                <p className="truncate flex-1">{p.title}</p>
                                <div className="flex items-center text-xs text-gray-400 gap-2"><Heart size={14} className="text-red-400"/><span>{p.likes?.length||0}</span></div>
                            </div>
                        );
                    })) : (<p className="text-center text-gray-500 py-4">인기글이 없어요.</p>)}
                </div>
            </section>
            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold">팔로잉</h2>
                </div>
                <div className="space-y-3">
                    {followingPosts.length > 0 ? (followingPosts.map(p => {
                        const s = getCategoryStyle(p.category, p.city);
                        return (
                            <div key={p.id} onClick={() => navigate(`/post/${p.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-xs font-bold ${s.text} ${s.bg} px-2 py-1 rounded-md`}>{p.category}</span>
                                    <h3 className="font-bold text-md truncate flex-1">{p.title}</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-3 truncate">{p.content}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500">
                                    <div><span onClick={(e)=>{e.stopPropagation(); navigate(`/profile/${p.authorId}`);}} className="font-semibold cursor-pointer hover:underline">{p.authorName}</span><span className="mx-1">·</span><span>{timeSince(p.createdAt)}</span></div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1"><Heart size={14} className={p.likes?.includes(currentUser.uid)?'text-red-500 fill-current':'text-gray-400'}/><span>{p.likes?.length||0}</span></div>
                                        <div className="flex items-center gap-1"><MessageCircle size={14} className="text-gray-400"/><span>{p.commentCount||0}</span></div>
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
    const [newsList, setNewsList] = useState(null);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [activeTag, setActiveTag] = useState('전체');
    const tags = ['전체', '교육', '문화', '청년', '농업', '안전', '운동', '행사', '복지'];
    const displayCity = adminSelectedCity || (currentUser?.isAdmin ? '전체' : currentUser?.city);

    useEffect(() => {
        if (!currentUser) return;
        const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);
        if (!currentUser.isAdmin && !targetCity) {
            setNewsList([]);
            return;
        }
        const baseQuery = targetCity ? [where("city", "==", targetCity)] : [];
        const q = query(collection(db, "news"), ...baseQuery, orderBy("createdAt", "desc"));
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
            alert("작업 처리 중 오류가 발생했습니다.");
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
    
    if (newsList === null) return <LoadingSpinner />;
    
    const filteredNews = activeTag === '전체' ? newsList : newsList.filter(news => news.tags?.includes(activeTag));
    const pageTitle = displayCity === '전체' ? '전체 소식' : `${displayCity} 소식`;
    
    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{pageTitle}</h1>
            {currentUser.isAdmin && (
                <button onClick={() => navigate('/news/write', { state: { city: displayCity } })} className="w-full mb-4 bg-[#00462A] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#003a22] shadow-lg flex items-center justify-center gap-2">
                    <PlusCircle size={20} /> {displayCity === '전체' ? '새 소식 작성' : `${displayCity} 소식 작성`}
                </button>
            )}
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {tags.map(tag => (
                    <button key={tag} onClick={() => setActiveTag(tag)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${ activeTag === tag ? 'bg-[#00462A] text-white' : 'bg-gray-200 text-gray-700'}`}>
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
                        <NewsCard key={news.id} {...{news, isAdmin: currentUser.isAdmin, openDetailModal, handleDeleteNews, handleLikeNews, isLiked: currentUser.likedNews?.includes(news.id)}} />
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

const NewsWritePage = () => { const navigate = useNavigate(); const location = useLocation(); const itemToEdit = location.state?.itemToEdit; const initialCity = location.state?.city; const { currentUser } = useAuth(); const [title, setTitle] = useState(itemToEdit?.title || ''); const [content, setContent] = useState(itemToEdit?.content || ''); const [tags, setTags] = useState(itemToEdit?.tags?.join(', ') || ''); const [applyUrl, setApplyUrl] = useState(itemToEdit?.applyUrl || ''); const [date, setDate] = useState(itemToEdit?.date || ''); const [imageFile, setImageFile] = useState(null); const [imagePreview, setImagePreview] = useState(itemToEdit?.imageUrl || null); const [isSubmitting, setIsSubmitting] = useState(false); const [postRegion, setPostRegion] = useState(''); const [postCity, setPostCity] = useState(''); useEffect(() => { const city = itemToEdit?.city || initialCity; if(city && city !== '전체') { setPostCity(city); getAllRegionCityMap().then(map => setPostRegion(map.cityToRegion[city] || '')); } }, [itemToEdit, initialCity]); const handleImageChange = (e) => { if (e.target.files[0]) { const file = e.target.files[0]; setImageFile(file); setImagePreview(URL.createObjectURL(file)); }}; const handleSubmit = async () => { if (!title.trim() || !content.trim() || !date) { alert('날짜, 제목, 내용을 모두 입력해주세요.'); return; } if (currentUser.isAdmin && (!postRegion || !postCity)) { alert('게시할 지역 정보가 없습니다. 소식 페이지에서 글쓰기를 시작해주세요.'); return; } if (isSubmitting) return; setIsSubmitting(true); try { let imageUrl = itemToEdit?.imageUrl || null, imagePath = itemToEdit?.imagePath || null; if (imageFile) { if(itemToEdit?.imagePath) await deleteObject(ref(storage, itemToEdit.imagePath)); const newImagePath = `news_images/${Date.now()}_${imageFile.name}`; const storageRef = ref(storage, newImagePath); await uploadBytes(storageRef, imageFile); imageUrl = await getDownloadURL(storageRef); imagePath = newImagePath; } const finalData = { title, content, imageUrl, imagePath, date, updatedAt: Timestamp.now(), tags: tags.split(',').map(t=>t.trim()).filter(Boolean), applyUrl, region: postRegion, city: postCity }; if (itemToEdit) await updateDoc(doc(db, 'news', itemToEdit.id), finalData); else await addDoc(collection(db, 'news'), { ...finalData, createdAt: Timestamp.now(), authorId: currentUser.uid }); navigate('/news'); } catch (error) { alert(`오류: ${error.message}`); } finally { setIsSubmitting(false); } }; return (<div><div className="p-4 flex items-center border-b"><button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button><h2 className="text-lg font-bold mx-auto">{itemToEdit ? "소식 수정" : "소식 작성"}</h2><button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">{isSubmitting ? '등록 중' : '완료'}</button></div><div className="p-4 space-y-4">{currentUser.isAdmin && (postRegion || postCity) && (<div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg"><p className="text-sm font-semibold text-gray-700">작성 지역: <span className="text-green-800">{postRegion} {postCity}</span></p></div>)}<input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" /><input type="text" value={tags} onChange={e=>setTags(e.target.value)} placeholder="태그 (쉼표로 구분)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" /><input type="url" value={applyUrl} onChange={e=>setApplyUrl(e.target.value)} placeholder="신청하기 URL 링크 (선택 사항)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" /><input type="text" value={title} onChange={e=>setTitle(e.target.value)} placeholder="제목" className="w-full text-xl p-2 border-b-2 focus:outline-none focus:border-[#00462A]" /><textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="내용을 입력하세요..." className="w-full h-64 p-2 focus:outline-none resize-none" /><div className="border-t pt-4"><label htmlFor="image-upload-news" className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#00462A]"><ImageUp size={20} /><span>사진 추가</span></label><input id="image-upload-news" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />{imagePreview && (<div className="mt-4 relative w-32 h-32"><img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" /><button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"><X size={14} /></button></div>)}</div></div></div>); };
const CalendarPage = () => { const { currentUser } = useAuth(); const location = useLocation(); const [userEvents, setUserEvents] = useState({}); const [isModalOpen, setIsModalOpen] = useState(false); const [selectedDate, setSelectedDate] = useState(null); const [eventTitle, setEventTitle] = useState(''); useEffect(() => { if (!currentUser) return; const unsub = onSnapshot(query(collection(db, `users/${currentUser.uid}/events`)), s => { const ev = {}; s.docs.forEach(d => { const e = { id: d.id, ...d.data() }; if (!ev[e.date]) ev[e.date] = []; ev[e.date].push(e); }); setUserEvents(ev); }); return unsub; }, [currentUser]); useEffect(() => { if(location.state?.date) { setSelectedDate(location.state.date); setIsModalOpen(true); } }, [location.state]); const handleDateClick = (date) => { setSelectedDate(date); setIsModalOpen(true); }; const handleAddEvent = async () => { if (!eventTitle.trim()) { alert("일정 제목을 입력해주세요."); return; } try { await addDoc(collection(db, `users/${currentUser.uid}/events`), { title: eventTitle, date: selectedDate, type: 'user', createdAt: Timestamp.now() }); setIsModalOpen(false); setEventTitle(''); } catch(e) { console.error("Error adding event: ", e); alert("일정 추가 중 오류 발생"); } }; const eventsForSelectedDate = userEvents[selectedDate] || []; return (<div className="p-4"><Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}><div className="p-2"><h3 className="text-lg font-bold mb-4">{selectedDate}</h3><div className="mb-4"><input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="새로운 일정" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00462A] focus:border-[#00462A]" /></div><button onClick={handleAddEvent} className="w-full bg-[#00462A] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#003a22]">저장</button><div className="mt-6"><h4 className="font-bold mb-2">이 날의 일정:</h4>{eventsForSelectedDate.length > 0 ? (<ul className="list-disc list-inside space-y-1">{eventsForSelectedDate.map(event => <li key={event.id}>{event.title}</li>)}</ul>) : (<p className="text-gray-500">등록된 일정이 없습니다.</p>)}</div></div></Modal><Calendar events={userEvents} onDateClick={handleDateClick} /></div>); };
const BoardPage = () => { const { currentUser, adminSelectedCity } = useAuth(); const navigate = useNavigate(); const [posts, setPosts] = useState(null); const [filter, setFilter] = useState('전체'); const dynamicMomCategory = currentUser?.city ? `${currentUser.city}맘` : '마을맘'; const categories = ['전체', '일상', '친목', '10대', '청년', '중년', dynamicMomCategory, '질문', '기타']; useEffect(() => { if (!currentUser) return; const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city); if (!currentUser.isAdmin && !targetCity) { setPosts([]); return; } let qCons = []; if (targetCity) qCons.push(where("city", "==", targetCity)); if (filter !== '전체') qCons.push(where("category", "==", filter)); const q = query(collection(db, "posts"), ...qCons, orderBy("createdAt", "desc"), limit(50)); const unsub = onSnapshot(q, s => setPosts(s.docs.map(d => ({ id: d.id, ...d.data() }))), e => { console.error("Error fetching posts: ", e); setPosts([]); }); return unsub; }, [filter, currentUser, adminSelectedCity]); if (posts === null) return <LoadingSpinner />; return (<div className="p-4 pb-20"><div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>{categories.map(cat => (<button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${filter === cat ? 'bg-[#00462A] text-white' : 'bg-gray-200 text-gray-700'}`}>{cat}</button>))}</div><div className="space-y-3">{posts.length > 0 ? (posts.map(post => { const style = getCategoryStyle(post.category, post.city); return (<div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer"><div className="flex items-center gap-2 mb-2"><span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md`}>{post.category}</span><h3 className="font-bold text-md truncate flex-1">{post.title}</h3></div><p className="text-gray-600 text-sm mb-3 truncate">{post.content}</p><div className="flex justify-between items-center text-xs text-gray-500"><div><span onClick={(e) => { e.stopPropagation(); navigate(`/profile/${post.authorId}`); }} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span><span className="mx-1">·</span><span>{timeSince(post.createdAt)}</span></div><div className="flex items-center gap-3"><div className="flex items-center gap-1"><Heart size={14} className={post.likes?.includes(currentUser.uid) ? 'text-red-500 fill-current' : 'text-gray-400'} /><span>{post.likes?.length || 0}</span></div><div className="flex items-center gap-1"><MessageCircle size={14} className="text-gray-400"/><span>{post.commentCount || 0}</span></div></div></div></div>); })) : ( <p className="text-center text-gray-500 py-10">해당 카테고리에 글이 없습니다.</p> )}</div><button onClick={() => navigate('/post/write')} className="fixed bottom-24 right-5 bg-[#00462A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[#003a22] hover:scale-110"><PlusCircle size={28} /></button></div>);};
const WritePage = () => { const navigate = useNavigate(); const location = useLocation(); const itemToEdit = location.state?.itemToEdit; const { currentUser } = useAuth(); const [title, setTitle] = useState(itemToEdit?.title || ''); const [content, setContent] = useState(itemToEdit?.content || ''); const [imageFile, setImageFile] = useState(null); const [imagePreview, setImagePreview] = useState(itemToEdit?.imageUrl || null); const [isSubmitting, setIsSubmitting] = useState(false); const userCity = currentUser?.city; const dynamicMomCategory = userCity ? `${userCity}맘` : '마을맘'; const categories = ['일상', '친목', '10대', '청년', '중년', dynamicMomCategory, '질문', '기타']; const [category, setCategory] = useState(itemToEdit?.category || '일상'); const [allRegions, setAllRegions] = useState([]); const [availableCities, setAvailableCities] = useState([]); const [selectedPostRegion, setSelectedPostRegion] = useState(itemToEdit?.region || ''); const [selectedPostCity, setSelectedPostCity] = useState(itemToEdit?.city || ''); useEffect(() => { if (currentUser?.isAdmin) { fetchRegions().then(sidos => { setAllRegions(sidos); if (itemToEdit?.region) fetchCities(itemToEdit.region).then(setAvailableCities); }); } }, [currentUser?.isAdmin, itemToEdit]); useEffect(() => { if (selectedPostRegion) { fetchCities(selectedPostRegion).then(setAvailableCities); if (itemToEdit?.region !== selectedPostRegion) setSelectedPostCity(''); } else setAvailableCities([]); }, [selectedPostRegion, itemToEdit?.region]); useEffect(() => { return () => { if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview); }; }, [imagePreview]); const handleImageChange = (e) => { if (e.target.files[0]) { const file = e.target.files[0]; if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview); setImageFile(file); setImagePreview(URL.createObjectURL(file)); } }; const handleSubmit = async () => { if (!title.trim() || !content.trim()) { alert('제목과 내용을 모두 입력해주세요.'); return; } if (currentUser.isAdmin && (!selectedPostRegion || !selectedPostCity)) { alert('게시글을 등록할 지역을 모두 선택해주세요.'); return; } if (isSubmitting) return; setIsSubmitting(true); try { let imageUrl = itemToEdit?.imageUrl || null, imagePath = itemToEdit?.imagePath || null; if (imageFile) { if (itemToEdit?.imagePath) await deleteObject(ref(storage, itemToEdit.imagePath)).catch(console.error); const newImagePath = `posts/${currentUser.uid}/${Date.now()}_${imageFile.name}`; const storageRef = ref(storage, newImagePath); await uploadBytes(storageRef, imageFile); imageUrl = await getDownloadURL(storageRef); imagePath = newImagePath; } const [region, city] = currentUser.isAdmin ? [selectedPostRegion, selectedPostCity] : [currentUser.region, currentUser.city]; const postData = { title, content, category, imageUrl, imagePath, updatedAt: Timestamp.now(), region, city }; if (!itemToEdit) { Object.assign(postData, { authorId: currentUser.uid, authorName: currentUser.displayName, createdAt: Timestamp.now(), likes: [], bookmarks: [], commentCount: 0 }); } if (itemToEdit) { await updateDoc(doc(db, 'posts', itemToEdit.id), postData); } else { await addDoc(collection(db, 'posts'), postData); } navigate('/board'); } catch (error) { alert(`오류가 발생했습니다: ${error.message}`); } finally { setIsSubmitting(false); } }; return (<div><div className="p-4 flex items-center border-b"><button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button><h2 className="text-lg font-bold mx-auto">{itemToEdit ? "글 수정" : "글쓰기"}</h2><button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">{isSubmitting ? '등록 중...' : '완료'}</button></div><div className="p-4 space-y-4">{currentUser.isAdmin && (<div className="p-4 bg-gray-50 rounded-lg space-y-4 border"><h3 className="text-md font-bold text-gray-800">게시 지역 선택 (관리자)</h3><div><label htmlFor="post-region-select" className="block text-sm font-medium text-gray-700 mb-1">시/도 선택</label><select id="post-region-select" value={selectedPostRegion} onChange={(e) => setSelectedPostRegion(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A]"><option value="">시/도를 선택하세요</option>{allRegions.map(r => (<option key={r} value={r}>{r}</option>))}</select></div><div><label htmlFor="post-city-select" className="block text-sm font-medium text-gray-700 mb-1">시/군 선택</label><select id="post-city-select" value={selectedPostCity} onChange={(e) => setSelectedPostCity(e.target.value)} disabled={!selectedPostRegion || !availableCities.length} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A] disabled:bg-gray-200"><option value="">시/군을 선택하세요</option>{availableCities.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>)}<div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>{categories.map(cat => (<button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${category === cat ? `${getCategoryStyle(cat, userCity).bgStrong} text-white` : 'bg-gray-200 text-gray-700'}`}>{cat}</button>))}</div><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="w-full text-xl p-2 border-b-2 focus:outline-none focus:border-[#00462A]" /><textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요..." className="w-full h-64 p-2 focus:outline-none resize-none" /><div className="border-t pt-4"><label htmlFor="image-upload-post" className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#00462A]"><ImageUp size={20} /><span>사진 추가</span></label><input id="image-upload-post" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />{imagePreview && (<div className="mt-4 relative w-32 h-32"><img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" /><button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"><X size={14} /></button></div>)}</div></div></div>);};
const PostDetailPage = () => { const { postId } = useParams(); const navigate = useNavigate(); const { currentUser } = useAuth(); const [post, setPost] = useState(null); const [comments, setComments] = useState([]); const [newComment, setNewComment] = useState(''); useEffect(() => { if (!postId) { navigate('/board'); return; } const postRef = doc(db, 'posts', postId); const commentsRef = collection(postRef, 'comments'); const postUnsub = onSnapshot(postRef, (d) => { if (d.exists()) setPost({ id: d.id, ...d.data() }); else { alert("삭제된 게시글입니다."); navigate('/board'); }}); const commentsUnsub = onSnapshot(query(commentsRef, orderBy("createdAt", "asc")), s => setComments(s.docs.map(d => ({ id: d.id, ...d.data() })))); return () => { postUnsub(); commentsUnsub(); }; }, [postId, navigate]); const handlePostInteraction = async (field) => { if (!post || !currentUser) return; const currentArray = post[field] || []; const isIncluded = currentArray.includes(currentUser.uid); try { await updateDoc(doc(db, 'posts', postId), { [field]: isIncluded ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) }); } catch (e) { console.error(`Error updating ${field}:`, e); } }; const handleCommentSubmit = async (e) => { e.preventDefault(); if (!newComment.trim() || !currentUser) return; try { const postRef = doc(db, 'posts', postId); const newCommentRef = doc(collection(postRef, 'comments')); const batch = writeBatch(db); batch.set(newCommentRef, { text: newComment.trim(), authorId: currentUser.uid, authorName: currentUser.displayName, authorPhotoURL: currentUser.photoURL, createdAt: Timestamp.now(), likes: [] }); batch.update(postRef, { commentCount: increment(1) }); await batch.commit(); setNewComment(''); } catch (e) { console.error("Error adding comment: ", e); } }; const handleCommentLike = async (commentId) => { if (!currentUser) return; try { const commentRef = doc(db, `posts/${postId}/comments`, commentId); const commentDoc = await getDoc(commentRef); if (!commentDoc.exists()) return; const currentLikes = commentDoc.data().likes || []; await updateDoc(commentRef, { likes: currentLikes.includes(currentUser.uid) ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) }); } catch(e) {console.error("Comment like error", e)} }; const handleDelete = async () => { if (!post || (post.authorId !== currentUser.uid && !currentUser.isAdmin) || !window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) return; try { await deleteDoc(doc(db, 'posts', postId)); if (post.imagePath) await deleteObject(ref(storage, post.imagePath)); alert("게시글이 삭제되었습니다."); navigate('/board'); } catch (e) { console.error("Error deleting post:", e); alert("삭제 중 오류가 발생했습니다."); } }; if (!post) return <LoadingSpinner />; const isAuthor = post.authorId === currentUser?.uid; const style = getCategoryStyle(post.category, post.city); return (<div className="pb-20"><div className="p-4"><div className="mb-4 pb-4 border-b"><span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md mb-2 inline-block`}>{post.category}</span><div className="flex justify-between items-start mt-2"><h1 className="text-2xl font-bold flex-1 pr-4">{post.title}</h1><div className="flex items-center gap-2">{(isAuthor || currentUser.isAdmin) && ( <>{isAuthor && <button onClick={() => navigate(`/post/edit/${post.id}`, { state: { itemToEdit: post }})} className="p-1 text-gray-500 hover:text-blue-600"><Pencil size={20} /></button>}<button onClick={handleDelete} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={20} /></button></> )}<button onClick={() => handlePostInteraction('bookmarks')} className="p-1 -mr-1"><Star size={22} className={post.bookmarks?.includes(currentUser?.uid) ? "text-yellow-400 fill-current" : "text-gray-400"} /></button></div></div><div className="flex items-center text-sm text-gray-500 mt-4 cursor-pointer" onClick={() => navigate(`/profile/${post.authorId}`)}><div className="w-8 h-8 rounded-full bg-gray-200 mr-2 overflow-hidden flex items-center justify-center">{post.authorPhotoURL ? <img src={post.authorPhotoURL} alt={post.authorName} className="w-full h-full object-cover" /> : <UserCircle size={32} className="text-gray-400" />}</div><span className="font-semibold hover:underline">{post.authorName}</span><span className="mx-2">·</span><span>{timeSince(post.createdAt)}</span></div>{post.imageUrl && <img src={post.imageUrl} alt="Post" className="my-4 w-full h-auto rounded-lg object-cover" /> }<p className="text-gray-800 leading-relaxed whitespace-pre-wrap mt-4">{post.content}</p></div><div className="flex items-center gap-4 mb-4"><button onClick={() => handlePostInteraction('likes')} className="flex items-center gap-1 text-gray-600 hover:text-red-500"><Heart size={20} className={post.likes?.includes(currentUser?.uid) ? "text-red-500 fill-current" : ""} /><span>좋아요 {post.likes?.length || 0}</span></button><div className="flex items-center gap-1 text-gray-600"><MessageCircle size={20} /> <span>댓글 {comments.length}</span></div></div><div className="space-y-4">{comments.map(comment => (<div key={comment.id} className="flex gap-3"><div className="w-8 h-8 rounded-full bg-gray-200 mt-1 flex-shrink-0 cursor-pointer" onClick={() => navigate(`/profile/${comment.authorId}`)}>{comment.authorPhotoURL ? <img src={comment.authorPhotoURL} alt={comment.authorName} className="w-full h-full object-cover rounded-full" /> : <UserCircle size={32} className="text-gray-400"/>}</div><div className="flex-1"><div className="bg-gray-100 p-3 rounded-lg"><p onClick={() => navigate(`/profile/${comment.authorId}`)} className="font-semibold text-sm cursor-pointer hover:underline">{comment.authorName}</p><p className="text-gray-800">{comment.text}</p></div><div className="flex items-center mt-1 text-xs text-gray-500"><span>{timeSince(comment.createdAt)}</span><button onClick={() => handleCommentLike(comment.id)} className="ml-4 flex items-center hover:text-red-500"><Heart size={12} className={comment.likes?.includes(currentUser?.uid) ? 'text-red-500 fill-current' : ''} /><span className="ml-1">{comment.likes?.length || 0}</span></button></div></div></div>))}</div></div><div className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto bg-white border-t p-3"><form onSubmit={handleCommentSubmit} className="relative flex items-center"><input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="댓글을 입력하세요." className="w-full pl-4 pr-12 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]" /><button type="submit" className="absolute right-2 p-2 rounded-full text-gray-500 hover:bg-gray-200"><Send size={20} /></button></form></div></div>);};
const ProfileEditPage = () => { const navigate = useNavigate(); const { currentUser } = useAuth(); const [bio, setBio] = useState(currentUser?.bio || ''); const [town, setTown] = useState(currentUser?.town || ''); const [imageFile, setImageFile] = useState(null); const [imagePreview, setImagePreview] = useState(currentUser?.photoURL || null); const [isSubmitting, setIsSubmitting] = useState(false); useEffect(() => { return () => { if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview); }; }, [imagePreview]); const handleImageChange = (e) => { if (e.target.files[0]) { const file = e.target.files[0]; if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview); setImageFile(file); setImagePreview(URL.createObjectURL(file)); } }; const handleSubmit = async () => { if (isSubmitting) return; setIsSubmitting(true); try { let photoURL = currentUser.photoURL; if (imageFile) { const imagePath = `profile_images/${currentUser.uid}/profile.jpg`; const storageRef = ref(storage, imagePath); await uploadBytes(storageRef, imageFile); photoURL = await getDownloadURL(storageRef); } await updateDoc(doc(db, 'users', currentUser.uid), { bio, town, photoURL }); if (photoURL !== currentUser.photoURL) { await updateProfile(auth.currentUser, { photoURL }); } alert('프로필이 성공적으로 업데이트되었습니다.'); navigate(`/profile/${currentUser.uid}`); } catch (e) { console.error("Profile update error:", e); alert(`오류 발생: ${e.message}`); } finally { setIsSubmitting(false); } }; return (<div><div className="p-4 flex items-center border-b"><button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button><h2 className="text-lg font-bold mx-auto">프로필 편집</h2><button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">{isSubmitting ? '저장 중...' : '저장'}</button></div><div className="p-4 flex flex-col items-center"><div className="relative w-24 h-24 mb-4"><div className="w-full h-full rounded-full bg-gray-200 overflow-hidden flex items-center justify-center">{imagePreview ? (<img src={imagePreview} alt="프로필 미리보기" className="w-full h-full object-cover" />) : (<UserCircle size={96} className="text-gray-400" />)}</div><label htmlFor="profile-image-upload" className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full shadow-md cursor-pointer hover:bg-gray-100"><Pencil size={16} className="text-gray-600" /></label><input id="profile-image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" /></div><div className="w-full space-y-4 mt-4"><div><label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">자기소개</label><textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="자기소개를 입력해주세요." className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00462A]" rows="3"/></div><div><label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-1">상세 동네 (직접 입력)</label><input type="text" id="town" value={town} onChange={(e) => setTown(e.target.value)} placeholder="예: 부안읍, 효자동" className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00462A]" /></div></div></div></div>);};
const UserProfilePage = () => { const { userId } = useParams(); const navigate = useNavigate(); const { currentUser, adminSelectedCity, setAdminSelectedCity } = useAuth(); const [profileUser, setProfileUser] = useState(null); const [userPosts, setUserPosts] = useState(null); const [isLoading, setIsLoading] = useState(true); const [isAdminModeOn, setIsAdminModeOn] = useState(false); const [regionCityMap, setRegionCityMap] = useState({ regions: [], citiesByRegion: {}, cityToRegion: {} }); const [selectedAdminRegion, setSelectedAdminRegion] = useState(''); const [selectedAdminCity, setSelectedAdminCity] = useState(''); const [isMapLoading, setIsMapLoading] = useState(true); useEffect(() => { const userUnsub = onSnapshot(doc(db, 'users', userId), (d) => setProfileUser(d.exists() ? { id: d.id, ...d.data() } : null), () => setIsLoading(false)); const postsUnsub = onSnapshot(query(collection(db, 'posts'), where("authorId", "==", userId), orderBy("createdAt", "desc")), (s) => setUserPosts(s.docs.map(d => ({id: d.id, ...d.data()}))), () => setIsLoading(false)); setIsLoading(false); return () => { userUnsub(); postsUnsub(); }; }, [userId]); useEffect(() => { if (currentUser?.isAdmin) { setIsMapLoading(true); getAllRegionCityMap().then(map => { setRegionCityMap(map); if (adminSelectedCity) { const region = map.cityToRegion[adminSelectedCity]; if (region) { setSelectedAdminRegion(region); setSelectedAdminCity(adminSelectedCity); } setIsAdminModeOn(true); } else { setSelectedAdminRegion('전체'); } setIsMapLoading(false); }); } else { setIsMapLoading(false); } }, [currentUser?.isAdmin, adminSelectedCity]); const handleAdminModeToggle = () => { const newModeState = !isAdminModeOn; setIsAdminModeOn(newModeState); if (!newModeState) { setAdminSelectedCity(null); setSelectedAdminRegion('전체'); setSelectedAdminCity(''); } }; const handleRegionViewChange = () => { const finalCity = selectedAdminRegion === '전체' ? null : selectedAdminCity; setAdminSelectedCity(finalCity); alert(`${finalCity ? `${selectedAdminRegion} ${finalCity}` : '전국'} 뷰로 변경되었습니다.`); navigate('/home'); }; const handleFollow = async () => { if (!currentUser || !profileUser) return; try { const isFollowing = profileUser.followers?.includes(currentUser.uid); const batch = writeBatch(db); batch.update(doc(db, 'users', currentUser.uid), { following: isFollowing ? arrayRemove(userId) : arrayUnion(userId) }); batch.update(doc(db, 'users', userId), { followers: isFollowing ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) }); await batch.commit(); } catch(e) { console.error("Follow error:", e); alert("팔로우 처리 중 오류 발생"); }}; const handleLogout = async () => { if (window.confirm('로그아웃 하시겠습니까?')) { await signOut(auth); navigate('/start'); } }; const handleMessage = () => navigate(`/chat/${[currentUser.uid, userId].sort().join('_')}`, { state: { recipientId: userId, recipientName: profileUser.displayName }}); if (isLoading || isMapLoading) return <LoadingSpinner />; if (!profileUser) return <div className='p-4 text-center'>사용자를 찾을 수 없습니다.</div>; const isMyProfile = currentUser.uid === userId; const isFollowing = profileUser.followers?.includes(currentUser.uid) || false; const userLocation = (isMyProfile && currentUser.isAdmin) ? '관리자' : (profileUser.region && profileUser.city ? `${profileUser.region} ${profileUser.city}` : '지역 정보 없음'); return ( <div className="p-4 pb-16"> <div className="flex items-center mb-6"><div className="w-16 h-16 rounded-full mr-4 shrink-0 bg-gray-200 overflow-hidden flex items-center justify-center">{profileUser.photoURL ? (<img src={profileUser.photoURL} alt={profileUser.displayName} className="w-full h-full object-cover" />) : (<UserCircle size={64} className="text-gray-400" />)}</div><div className="flex-1"><h2 className="text-xl font-bold">{profileUser.displayName}</h2><p className="text-sm text-gray-600 mt-1">{profileUser.bio || '자기소개를 입력해주세요.'}</p><p className="text-xs text-gray-500 mt-1">{userLocation}</p><div className="text-sm text-gray-500 mt-2"><span>팔로워 {profileUser.followers?.length || 0}</span><span className="mx-2">·</span><span>팔로잉 {profileUser.following?.length || 0}</span></div></div></div> <div className="flex gap-2 mb-6">{isMyProfile ? (<><button onClick={() => navigate('/profile/edit')} className="flex-1 p-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 flex items-center justify-center gap-1"><Edit size={16} /> 프로필 편집</button><button onClick={handleLogout} className="flex-1 p-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 flex items-center justify-center gap-1"><LogOut size={16} /> 로그아웃</button></>) : (<><button onClick={handleFollow} className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${isFollowing ? 'bg-gray-200 text-[#00462A]' : 'bg-[#00462A] text-white'}`} >{isFollowing ? '✓ 팔로잉' : '+ 팔로우'}</button><button onClick={handleMessage} className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-white text-[#00462A] border border-[#00462A] flex items-center justify-center gap-1.5"><MessageSquare size={16} /> 메시지</button></>)}</div> {isMyProfile && currentUser.isAdmin && (<div className="mb-6 p-4 bg-gray-100 rounded-lg space-y-4"><h3 className="text-md font-bold text-gray-800">관리자 도구</h3><div className="flex items-center justify-between"><label htmlFor="admin-mode-toggle" className="font-semibold text-gray-700">관리자 뷰 활성화</label><button onClick={handleAdminModeToggle} id="admin-mode-toggle" className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isAdminModeOn ? 'bg-green-600' : 'bg-gray-300'}`}><span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isAdminModeOn ? 'translate-x-6' : 'translate-x-1'}`}/></button></div>{isAdminModeOn && (<div className="space-y-3 pt-2 border-t"><label htmlFor="region-select" className="block text-sm font-medium text-gray-600 mb-1">시/도 선택</label><select id="region-select" value={selectedAdminRegion} onChange={(e) => { setSelectedAdminRegion(e.target.value); setSelectedAdminCity(''); }} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A]"><option value="전체">전국 (전체 보기)</option>{regionCityMap.regions.map(r => <option key={r} value={r}>{r}</option>)}</select>{selectedAdminRegion && selectedAdminRegion !== '전체' && (<div><label htmlFor="city-select" className="block text-sm font-medium text-gray-600 mb-1">시/군 선택</label><select id="city-select" value={selectedAdminCity} onChange={(e) => setSelectedAdminCity(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A]" disabled={!regionCityMap.citiesByRegion[selectedAdminRegion]}><option value="">시/군을 선택하세요</option>{(regionCityMap.citiesByRegion[selectedAdminRegion] || []).map(c => <option key={c} value={c}>{c}</option>)}</select></div>)}<button onClick={handleRegionViewChange} disabled={!selectedAdminRegion || (selectedAdminRegion !== '전체' && !selectedAdminCity)} className="w-full mt-2 bg-[#00462A] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#003a22] disabled:bg-gray-400">뷰 변경 적용</button></div>)}</div>)} <div className="space-y-3"><h3 className="text-lg font-bold">작성한 글</h3>{userPosts && userPosts.length > 0 ? userPosts.map(post => ( <div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer"><h4 className="font-bold text-md truncate mb-1">{post.title}</h4><p className="text-gray-600 text-sm truncate">{post.content}</p></div>)) : ( <p className="text-center text-gray-500 py-10">아직 작성한 글이 없습니다.</p> )}</div> </div>);};
const SearchPage = () => { const { currentUser, adminSelectedCity } = useAuth(); const navigate = useNavigate(); const [searchTerm, setSearchTerm] = useState(''); const [results, setResults] = useState([]); const [loading, setLoading] = useState(false); const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city); const displayCity = adminSelectedCity || (currentUser.isAdmin ? '전체' : currentUser.city); const handleSearch = async () => { if (!searchTerm.trim()) return; setLoading(true); try { const constraints = [ where('title', '>=', searchTerm), where('title', '<=', searchTerm + '\uf8ff') ]; if (targetCity) constraints.unshift(where('city', '==', targetCity)); const q = query(collection(db, 'posts'), ...constraints, orderBy('title')); setResults((await getDocs(q)).docs.map(d => ({ id: d.id, ...d.data() }))); } catch (e) { console.error("Search error: ", e); alert("검색 중 오류 발생"); } finally { setLoading(false); } }; return (<div className="p-4"><div className="relative mb-4 flex gap-2"><input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSearch()} placeholder={targetCity ? `${displayCity} 내에서 검색...` : '전체 게시물에서 검색...'} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]" /><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} /><button onClick={handleSearch} className="px-4 py-2 bg-[#00462A] text-white rounded-full font-semibold">검색</button></div>{loading ? <LoadingSpinner /> : (<div className="space-y-3">{results.length > 0 ? results.map(post => (<div key={post.id} onClick={() => navigate(`/post/${post.id}`)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer"><h3 className="font-bold text-md truncate mb-1">{post.title}</h3><p className="text-gray-600 text-sm truncate">{post.content}</p></div>)) : (searchTerm && <p className="text-center text-gray-500 py-10">검색 결과가 없습니다.</p>)}</div>)}</div>);};
const NotificationsPage = () => ( <div className="p-4"> {[ { id: 1, text: '알림 기능은 APP 버전에서만 작동합니다.', time: '방금 전' }, { id: 2, text: '7월 정식 앱 출시를 기대해주세요!', time: '방금 전' } ].map(n => (<div key={n.id} className="p-3 border-b"><p className="text-sm">{n.text}</p><p className="text-xs text-gray-500 mt-1">{n.time}</p></div>))} </div> );
const ChatListPage = () => { const { currentUser } = useAuth(); const navigate = useNavigate(); const [chats, setChats] = useState(null); useEffect(() => { if (!currentUser) return; const q = query(collection(db, 'chats'), where('members', 'array-contains', currentUser.uid), orderBy('lastMessage.createdAt', 'desc')); const unsub = onSnapshot(q, async (s) => { const cData = await Promise.all(s.docs.map(async d => { const cd = d.data(); const oId = cd.members.find(id => id !== currentUser.uid); if (!oId) return null; const uDoc = await getDoc(doc(db, 'users', oId)); return { id: d.id, ...cd, otherUser: uDoc.exists() ? {uid: uDoc.id, ...uDoc.data()} : { displayName: '알 수 없음', uid: oId } }; })); setChats(cData.filter(Boolean)); }, (e) => { console.error("Chat list error:", e); setChats([]); }); return unsub; }, [currentUser]); if (chats === null) return <LoadingSpinner />; return (<div className="p-4"><h2 className="text-xl font-bold mb-4">채팅 목록</h2><div className="space-y-3">{chats.length > 0 ? chats.map(chat => (<div key={chat.id} onClick={() => navigate(`/chat/${chat.id}`, { state: { recipientId: chat.otherUser.uid, recipientName: chat.otherUser.displayName }})} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer flex items-center gap-4"><div className="w-12 h-12 rounded-full bg-gray-300 shrink-0 overflow-hidden flex items-center justify-center">{chat.otherUser.photoURL ? <img src={chat.otherUser.photoURL} alt={chat.otherUser.displayName} className="w-full h-full object-cover" /> : <UserCircle size={48} className="text-gray-400"/>}</div><div className="flex-1 overflow-hidden"><h3 className="font-bold">{chat.otherUser.displayName}</h3><p className="text-sm text-gray-500 truncate">{chat.lastMessage?.text || '메시지를 보내보세요.'}</p></div></div>)) : (<p className="text-center text-gray-500 py-10">진행중인 대화가 없습니다.</p>)}</div></div>);};
const ChatPage = () => { const { currentUser } = useAuth(); const { chatId } = useParams(); const location = useLocation(); const recipientId = location.state?.recipientId; const [messages, setMessages] = useState([]); const [newMessage, setNewMessage] = useState(''); const [isAllowed, setIsAllowed] = useState(true); const [loading, setLoading] = useState(true); const messagesEndRef = useRef(null); useEffect(() => { if (!chatId || !currentUser || !recipientId) { setLoading(false); setIsAllowed(false); return; } const chatRef = doc(db, 'chats', chatId); const messagesRef = collection(chatRef, 'messages'); const q = query(messagesRef, orderBy('createdAt', 'asc')); const messagesUnsub = onSnapshot(q, s => setMessages(s.docs.map(d => ({ id: d.id, ...d.data() }))), () => setLoading(false)); const chatUnsub = onSnapshot(chatRef, chatSnap => { if (chatSnap.exists() && !chatSnap.data().members?.includes(currentUser.uid)) setIsAllowed(false); setLoading(false); }); return () => { messagesUnsub(); chatUnsub(); }; }, [chatId, currentUser, recipientId]); useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]); const handleSendMessage = async (e) => { e.preventDefault(); if (!newMessage.trim() || !recipientId) return; const msg = { text: newMessage, senderId: currentUser.uid, createdAt: Timestamp.now() }; const chatRef = doc(db, 'chats', chatId); try { const batch = writeBatch(db); if (!(await getDoc(chatRef)).exists()) batch.set(chatRef, { members: [currentUser.uid, recipientId], lastMessage: msg }); else batch.update(chatRef, { lastMessage: msg }); batch.set(doc(collection(chatRef, 'messages')), msg); await batch.commit(); setNewMessage(''); } catch (error) { console.error("Send message error:", error); alert("메시지 전송 실패"); } }; if (loading) return <LoadingSpinner />; if (!isAllowed) return <div className="p-4 text-center text-red-500">채팅방 접근 권한이 없습니다.</div>; return (<><div className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map(msg => (<div key={msg.id} className={`flex ${msg.senderId === currentUser.uid ? 'justify-end' : 'justify-start'}`}><div className={`max-w-xs p-3 rounded-lg ${msg.senderId === currentUser.uid ? 'bg-green-500 text-white' : 'bg-gray-200'}`}><p>{msg.text}</p></div></div>))}<div ref={messagesEndRef} /></div><div className="bg-white border-t p-3 sticky bottom-0" style={{paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))'}}><form onSubmit={handleSendMessage} className="relative flex items-center"><input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="메시지 입력" className="w-full pl-4 pr-12 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]" /><button type="submit" className="absolute right-2 p-2 rounded-full text-gray-500 hover:bg-gray-200"><Send size={20} /></button></form></div></>);};
const ClubListPage = () => { const { currentUser } = useAuth(); const navigate = useNavigate(); const [clubs, setClubs] = useState(null); const [passwordModalOpen, setPasswordModalOpen] = useState(false); const [selectedClub, setSelectedClub] = useState(null); const [password, setPassword] = useState(''); const [activeTab, setActiveTab] = useState('내 모임'); useEffect(() => { const unsub = onSnapshot(query(collection(db, "clubs"), orderBy("createdAt", "desc")), (s) => setClubs(s.docs.map(d => ({ id: d.id, ...d.data() })))); return unsub; }, []); if (clubs === null) return <LoadingSpinner />; const displayedClubs = activeTab === '내 모임' ? clubs.filter(c => c.members?.includes(currentUser.uid)) : clubs; const handleEnterClub = (club) => { if (club.members?.includes(currentUser.uid) || !club.password) navigate(`/clubs/${club.id}`); else { setSelectedClub(club); setPasswordModalOpen(true); } }; const handlePasswordSubmit = async () => { if (!selectedClub || !password) return; if (password === selectedClub.password) { try { await updateDoc(doc(db, 'clubs', selectedClub.id), { members: arrayUnion(currentUser.uid) }); navigate(`/clubs/${selectedClub.id}`); } catch (e) { alert("모임 입장 실패"); } finally { setPasswordModalOpen(false); setPassword(''); setSelectedClub(null); } } else alert('비밀번호가 일치하지 않습니다.'); }; return (<div className="p-4"><Modal isOpen={passwordModalOpen} onClose={() => { setPasswordModalOpen(false); setPassword(''); }}><h3 className="text-lg font-bold mb-4">{selectedClub?.name}</h3><p className="mb-4">비밀번호가 필요한 모임입니다.</p><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handlePasswordSubmit()} placeholder="비밀번호" className="w-full p-2 border rounded mb-4" /><button onClick={handlePasswordSubmit} className="w-full bg-[#00462A] text-white py-2 rounded">입장하기</button></Modal><div className="flex justify-between items-center mb-4"><div className="flex bg-gray-200 rounded-lg p-1"><button onClick={() => setActiveTab('내 모임')} className={`px-4 py-1 text-sm font-semibold rounded-md ${activeTab === '내 모임' ? 'bg-white shadow' : 'text-gray-600'}`}>내 모임</button><button onClick={() => setActiveTab('전체 모임')} className={`px-4 py-1 text-sm font-semibold rounded-md ${activeTab === '전체 모임' ? 'bg-white shadow' : 'text-gray-600'}`}>전체 모임</button></div><button onClick={() => navigate('/clubs/create')} className="bg-[#00462A] text-white font-bold py-2 px-3 rounded-lg hover:bg-[#003a22] flex items-center gap-1 text-sm"><PlusCircle size={16} /> 만들기</button></div><div className="space-y-3">{displayedClubs.length > 0 ? displayedClubs.map(club => (<div key={club.id} onClick={() => handleEnterClub(club)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer flex items-center gap-4"><img src={club.photoURL} alt={club.name} className="w-16 h-16 rounded-lg object-cover bg-gray-200 shrink-0" /><div className="flex-1 overflow-hidden"><h3 className="font-bold text-lg">{club.name}</h3><p className="text-sm text-gray-500 truncate">{club.description}</p><div className="text-xs text-gray-400 mt-1 flex items-center">{club.password && <Lock size={12} className="mr-1" />}<span>멤버 {club.members?.length || 1}명</span><span className="mx-1">·</span><span onClick={(e) => { e.stopPropagation(); navigate(`/profile/${club.creatorId}`); }} className="hover:underline">{club.creatorName}</span></div></div></div>)) : (<div className="text-center text-gray-500 py-20">{activeTab === '내 모임' ? '가입한 모임이 없습니다.' : '생성된 모임이 없습니다.'}</div>)}</div></div>);};
const ClubCreatePage = () => { const navigate = useNavigate(); const { currentUser } = useAuth(); const [name, setName] = useState(''); const [desc, setDesc] = useState(''); const [category, setCat] = useState(''); const [password, setPassword] = useState(''); const [imageFile, setImageFile] = useState(null); const [imagePreview, setImagePreview] = useState(null); const [isSubmitting, setIsSubmitting] = useState(false); const handleSubmit = async () => { if (!name || !desc || !imageFile) { alert('모임 이름, 소개, 대표 사진은 필수입니다.'); return; } setIsSubmitting(true); try { const imagePath = `club_images/${currentUser.uid}/${Date.now()}_${imageFile.name}`; const storageRef = ref(storage, imagePath); await uploadBytes(storageRef, imageFile); const photoURL = await getDownloadURL(storageRef); await addDoc(collection(db, 'clubs'), { name, description: desc, category, password, photoURL, imagePath, creatorId: currentUser.uid, creatorName: currentUser.displayName, members: [currentUser.uid], createdAt: Timestamp.now(), }); navigate('/clubs'); } catch (e) { console.error(e); alert('모임 생성 실패'); } finally { setIsSubmitting(false); } }; const handleImageChange = (e) => { const f = e.target.files[0]; if (f) { if (imagePreview && imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview); setImageFile(f); setImagePreview(URL.createObjectURL(f)); }}; return (<div><div className="p-4 flex items-center border-b"><button onClick={() => navigate(-1)} className="p-2 -ml-2"><ArrowLeft /></button><h2 className="text-lg font-bold mx-auto">모임 만들기</h2><button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">{isSubmitting ? '생성 중...' : '완료'}</button></div><div className="p-4 space-y-4"><div className="flex justify-center"><label htmlFor="club-image-upload" className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center cursor-pointer overflow-hidden">{imagePreview ? <img src={imagePreview} alt="preview" className="w-full h-full object-cover" /> : <ImageUp />}</label><input id="club-image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" /></div><input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="모임 이름" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]"/><textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="모임 소개" className="w-full p-2 border-b-2 h-24 resize-none focus:outline-none focus:border-[#00462A]"/><input type="text" value={category} onChange={(e) => setCat(e.target.value)} placeholder="카테고리 (예: 등산, 독서)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]"/><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 (없으면 공개 모임)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]"/></div></div>);};
const ClubDetailPage = () => { const { clubId } = useParams(); const navigate = useNavigate(); const { currentUser } = useAuth(); const [club, setClub] = useState(null); const [members, setMembers] = useState([]); const [posts, setPosts] = useState([]); useEffect(() => { if (!clubId) { navigate('/clubs'); return; } const fetchMembers = async (mIds) => { try { const chunks = []; for (let i = 0; i < mIds.length; i += 30) chunks.push(mIds.slice(i, i + 30)); const snaps = await Promise.all(chunks.map(c => getDocs(query(collection(db, 'users'), where('__name__', 'in', c))))); setMembers(snaps.flatMap(s => s.docs.map(d => ({id: d.id, ...d.data()})))); } catch (e) { console.error("Error fetching members:", e); } }; const unsubClub = onSnapshot(doc(db, 'clubs', clubId), d => { if (d.exists()) { const cData = { id: d.id, ...d.data() }; setClub(cData); if (cData.members?.length) fetchMembers(cData.members); } else { alert("존재하지 않는 모임입니다."); navigate('/clubs'); } }); const unsubPosts = onSnapshot(query(collection(db, `clubs/${clubId}/club_posts`), orderBy('createdAt', 'desc'), limit(5)), s => setPosts(s.docs.map(d => ({id: d.id, ...d.data()})))); return () => { unsubClub(); unsubPosts(); }; }, [clubId, navigate]); if (!club) return <LoadingSpinner />; return (<div><div className="relative"><img src={club.photoURL} alt={club.name} className="w-full h-48 object-cover bg-gray-300"/><div className="absolute inset-0 bg-black/30"></div><div className="absolute top-4 left-4"><button onClick={() => navigate(-1)} className="text-white bg-black/30 p-2 rounded-full"><ArrowLeft/></button></div>{currentUser.uid === club.creatorId && <div className="absolute top-4 right-4"><button onClick={() => alert('수정 기능 준비중')} className="text-white bg-black/30 p-2 rounded-full"><Edit2/></button></div>}<div className="absolute bottom-4 left-4 text-white"><h2 className="text-2xl font-bold">{club.name}</h2><p className="text-sm">{club.description}</p></div></div><div className="p-4"><section className="mb-6"><div className="flex justify-between items-center mb-3"><h3 className="text-lg font-bold">게시글</h3><a href="#" onClick={(e) => { e.preventDefault(); alert("준비중입니다.") }} className="text-sm font-medium text-gray-500 hover:text-gray-800">더 보기 <ChevronRight className="inline-block" size={14}/></a></div></section><section><h3 className="text-lg font-bold mb-3">멤버 ({club.members?.length || 0})</h3><div className="space-y-2">{members.map(m => (<div key={m.id} onClick={() => navigate(`/profile/${m.id}`)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">{m.photoURL ? <img src={m.photoURL} alt={m.displayName} className="w-8 h-8 rounded-full bg-gray-300 object-cover" /> : <UserCircle size={32} className="text-gray-400" />}<span>{m.displayName}</span></div>))}</div></section></div><button onClick={() => alert("준비중입니다.")} className="fixed bottom-24 right-5 bg-[#00462A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg"><PlusCircle size={28} /></button></div>);};

// =================================================================
// ▼▼▼ 레이아웃 및 라우팅 설정 ▼▼▼
// =================================================================
const PageLayout = ({ children, hasHeader = true, hasFooter = true }) => { return (<div className="flex flex-col" style={{minHeight:'100vh'}}> {hasHeader && <Header />} <main className="flex-grow bg-white"> {children} </main> {hasFooter && <BottomNav />} </div>);};
const Header = () => { const navigate = useNavigate(); const location = useLocation(); const { currentUser, adminSelectedCity } = useAuth(); if (!currentUser) return null; const getPageTitle = () => {const { pathname } = location; if (pathname==='/home') return adminSelectedCity?`마을N ${adminSelectedCity.replace(/(특별시|광역시|특별자치시|도|시|군|구)$/,'')}`:currentUser.isAdmin?'마을N':`마을N ${currentUser.city?.replace(/(특별시|광역시|특별자치시|도|시|군|구)$/,'')||''}`; if(pathname.startsWith('/profile/'))return'프로필';if(pathname.startsWith('/post/'))return'게시글';if(pathname.startsWith('/chat/'))return location.state?.recipientName||'채팅';if(pathname.startsWith('/clubs/'))return'모임'; return {'/news':'소식','/board':'게시판','/calendar':'달력','/search':'검색','/notifications':'알림','/chats':'채팅'}[pathname]||'마을N';}; return (<header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-4 py-3 flex justify-between items-center border-b border-gray-200 h-16 w-full max-w-sm mx-auto"><div className="flex items-center gap-2 flex-1">{location.pathname!=='/home'?<button onClick={()=>navigate(-1)} className="p-1 -ml-2"><ArrowLeft size={24} /></button>:<Logo size={28}/>}<h1 className="text-xl font-bold text-gray-800 truncate">{getPageTitle()}</h1></div><div className="flex items-center gap-3"><Link to="/search" className="p-1"><Search size={24} className="text-gray-600" /></Link><Link to="/chats" className="p-1"><MessageSquare size={24} className="text-gray-600" /></Link><Link to="/notifications" className="p-1"><Bell size={24} className="text-gray-600" /></Link>{currentUser&&<Link to={`/profile/${currentUser.uid}`}>{currentUser.photoURL?<img src={currentUser.photoURL} alt="profile" className="w-8 h-8 rounded-full bg-gray-200 object-cover"/>:<UserCircle size={32} className="text-gray-400"/>}</Link>}</div></header>);};
const BottomNav = () => { const location = useLocation(); const navItems = [ { path: '/home', icon: Home, label: '홈' }, { path: '/board', icon: LayoutGrid, label: '게시판' }, { path: '/news', icon: Newspaper, label: '소식' }, { path: '/clubs', icon: Users, label: '클럽' }, { path: '/benefits', icon: TicketPercent, label: '혜택' } ]; if (['/start', '/region-setup'].some(p => location.pathname.startsWith(p))) return null; return (<footer className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto z-20"><div className="bg-white px-3 pt-2 pb-3 border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.05)]" style={{paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))'}}><div className="flex justify-around items-center">{navItems.map(item => (<Link to={item.path} key={item.path} onClick={(e) => { if (item.path === '/benefits') { e.preventDefault(); alert('서비스 준비중입니다.'); } }} className="text-center p-2 rounded-lg w-1/5"><item.icon className={`w-6 h-6 mx-auto ${location.pathname.startsWith(item.path)?'text-[#00462A]':'text-gray-500'}`} /><span className={`text-xs font-medium ${location.pathname.startsWith(item.path)?'text-[#00462A] font-bold':'text-gray-500'}`}>{item.label}</span></Link>))}</div></div></footer>);};
const ProtectedRoute = ({ children }) => { const { currentUser, loading } = useAuth(); const location = useLocation(); if (loading || (currentUser && !currentUser.isFirestoreDataLoaded)) return (<div className="max-w-sm mx-auto bg-white min-h-screen flex items-center justify-center"><LoadingSpinner /></div>); if (!currentUser) return location.pathname === '/start' ? children : <Navigate to="/start" replace />; if (currentUser.isAdmin) { if (['/start', '/region-setup'].includes(location.pathname)) return <Navigate to="/home" replace />; return children; } if (!currentUser.city) return location.pathname === '/region-setup' ? children : <Navigate to="/region-setup" replace />; if (currentUser.city) { if (['/start', '/region-setup'].includes(location.pathname)) return <Navigate to="/home" replace />; return children; } return <Navigate to="/start" replace />;};

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
                                        <Route path="/start" element={<StartPage />} />
                                        <Route path="/region-setup" element={<RegionSetupPage />} />
                                        
                                        <Route path="/home" element={<PageLayout><HomePage /></PageLayout>} />
                                        <Route path="/news" element={<PageLayout><NewsPage /></PageLayout>} />
                                        <Route path="/board" element={<PageLayout><BoardPage /></PageLayout>} />
                                        <Route path="/clubs" element={<PageLayout><ClubListPage /></PageLayout>} />
                                        <Route path="/search" element={<PageLayout><SearchPage /></PageLayout>} />
                                        <Route path="/notifications" element={<PageLayout><NotificationsPage /></PageLayout>} />
                                        <Route path="/chats" element={<PageLayout><ChatListPage /></PageLayout>} />
                                        <Route path="/calendar" element={<PageLayout><CalendarPage /></PageLayout>} />
                                        
                                        <Route path="/profile/:userId" element={<PageLayout hasFooter={false}><UserProfilePage /></PageLayout>} />
                                        <Route path="/post/:postId" element={<PageLayout hasFooter={false}><PostDetailPage /></PageLayout>} />
                                        <Route path="/clubs/:clubId" element={<PageLayout hasFooter={false}><ClubDetailPage /></PageLayout>} />
                                        
                                        <Route path="/chat/:chatId" element={<PageLayout hasHeader={true} hasFooter={false} isChat={true}><ChatPage /></PageLayout>} />
                                        
                                        <Route path="/news/write" element={<PageLayout hasHeader={false} hasFooter={false}><NewsWritePage /></PageLayout>} />
                                        <Route path="/news/edit/:newsId" element={<PageLayout hasHeader={false} hasFooter={false}><NewsWritePage /></PageLayout>} />
                                        <Route path="/post/write" element={<PageLayout hasHeader={false} hasFooter={false}><WritePage /></PageLayout>} />
                                        <Route path="/post/edit/:postId" element={<PageLayout hasHeader={false} hasFooter={false}><WritePage /></PageLayout>} />
                                        <Route path="/profile/edit" element={<PageLayout hasHeader={false} hasFooter={false}><ProfileEditPage /></PageLayout>} />
                                        <Route path="/clubs/create" element={<PageLayout hasHeader={false} hasFooter={false}><ClubCreatePage /></PageLayout>} />
                                        
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