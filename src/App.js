import React, { useState, useEffect, useRef, useCallback } from 'react';
import { initializeApp } from 'firebase/app';
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile
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
    getDocs
} from 'firebase/firestore';
import { 
    getStorage, 
    ref, 
    uploadBytes, 
    getDownloadURL, 
    deleteObject 
} from 'firebase/storage';
import { Home, Newspaper, LayoutGrid, Users, TicketPercent, ArrowLeft, Heart, MessageCircle, Send, PlusCircle, ChevronLeft, ChevronRight, X, Search, Bell, Star, Pencil, LogOut, Edit, MessageSquare, Trash2, ImageUp } from 'lucide-react';

// --- 로고 컴포넌트 ---
const Logo = ({ size = 28 }) => {
    return (
        <img
            src="https://lh3.googleusercontent.com/d/1gkkNelRAltEEfKv9V4aOScws7MS28IUn"
            alt="Logo"
            width={size}
            height={size}
            style={{ objectFit: 'contain' }}
        />
    );
};

// --- Firebase 설정 ---
const firebaseConfig = {
    apiKey: "AIzaSyAd7ns6wCL72P7X5_qZxX23sBxdkMhWAeg",
    authDomain: "maeulbung.firebaseapp.com",
    projectId: "maeulbung",
    storageBucket: "maeulbung.appspot.com",
    messagingSenderId: "463888320744",
    appId: "1:463888320744:web:0f773fed3428d36895a15d",
    measurementId: "G-WNRFBZX0HE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- 카테고리 스타일 ---
const categoryStyles = {
    '일상': { text: 'text-purple-600', bg: 'bg-purple-100', bgStrong: 'bg-purple-500' },
    '친목': { text: 'text-pink-600', bg: 'bg-pink-100', bgStrong: 'bg-pink-500' },
    '10대': { text: 'text-cyan-600', bg: 'bg-cyan-100', bgStrong: 'bg-cyan-500' },
    '청년': { text: 'text-indigo-600', bg: 'bg-indigo-100', bgStrong: 'bg-indigo-500' },
    '중년': { text: 'text-yellow-600', bg: 'bg-yellow-100', bgStrong: 'bg-yellow-500' },
    '부안맘': { text: 'text-teal-600', bg: 'bg-teal-100', bgStrong: 'bg-teal-500' },
    '질문': { text: 'text-blue-600', bg: 'bg-blue-100', bgStrong: 'bg-blue-500' },
    '기타': { text: 'text-gray-600', bg: 'bg-gray-100', bgStrong: 'bg-gray-500' }
};
const getCategoryStyle = (category) => categoryStyles[category] || categoryStyles['기타'];

// --- 공용 컴포넌트 ---
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                    <div className="w-6"></div> <h3 className="text-lg font-bold text-center"> </h3>
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

// --- 페이지 컴포넌트들 ---

const AuthPage = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault(); setLoading(true); setError('');
        try {
            if (isLoginMode) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                if (nickname.length < 2) throw new Error('닉네임은 2자 이상 입력해주세요.');
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                await updateProfile(user, { displayName: nickname });
                const userRef = doc(db, "users", user.uid);
                await setDoc(userRef, {
                    displayName: nickname, email: user.email, createdAt: Timestamp.now(), followers: [], following: [], likedNews: []
                });
            }
        } catch (err) {
            console.error("Auth Error:", err);
            switch (err.code) {
                case 'auth/email-already-in-use': setError('이미 사용 중인 이메일입니다.'); break;
                case 'auth/invalid-credential': setError('이메일 또는 비밀번호가 잘못되었습니다.'); break;
                default:
                    if (err.message.includes('닉네임')) setError(err.message);
                    else setError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.'); break;
            }
        } finally { setLoading(false); }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-green-50 p-4">
            <div className="text-center mb-8 flex flex-col items-center">
                <Logo size={80} /> <h1 className="text-3xl font-bold text-gray-800 mt-4">마을엔 부안</h1>
                <p className="text-gray-600 mt-2 text-center">지금 우리 마을에서 무슨 일이?<br/>'마을엔'에서 확인하세요!</p>
            </div>
            <div className="w-full max-w-xs">
                <form onSubmit={handleAuthAction} className="space-y-4">
                    {!isLoginMode && (<input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} placeholder="닉네임 (2자 이상)" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A]" />)}
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="이메일 주소" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A]" />
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A]" />
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <button type="submit" disabled={loading} className="w-full mt-4 bg-[#00462A] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#003a22] transition-colors shadow-lg disabled:bg-gray-400">{loading ? '처리 중...' : (isLoginMode ? '로그인' : '회원가입')}</button>
                </form>
                <button onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }} className="w-full mt-4 text-sm text-gray-600 hover:text-[#00462A]">{isLoginMode ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}</button>
            </div>
        </div>
    );
};

// ... HomePage, NewsPage, CalendarPage, ApplyForm, BoardPage 등 다른 컴포넌트는 이전과 동일 ...

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
        
const HomePage = ({ setCurrentPage, posts, buanNews, currentUser, userEvents, followingPosts, handleLikeNews, likedNews }) => {
    const popularPosts = [...posts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 3);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const openDetailModal = (news) => { setSelectedNews(news); setDetailModalOpen(true); };
    const openApplyModal = (news) => { setSelectedNews(news); setApplyModalOpen(true); };
    
    const handleApplySubmit = async (applicationData) => {
        try {
            await addDoc(collection(db, "applications"), { ...applicationData, eventName: selectedNews.title, userId: currentUser.uid, submittedAt: Timestamp.now() });
            alert('신청이 완료되었습니다.'); setApplyModalOpen(false);
        } catch (error) { console.error("Error submitting application: ", error); alert('신청 중 오류가 발생했습니다.'); }
    };

    const timeSince = (date) => {
        if (!date) return ''; const seconds = Math.floor((new Date() - date.toDate()) / 1000);
        if (seconds < 60) return `방금 전`; const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}분 전`; const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}시간 전`; const days = Math.floor(hours / 24);
        return `${days}일 전`;
    };

    return (
        <div className="p-4 space-y-8">
             <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)}>{selectedNews && ( <div> <h2 className="text-2xl font-bold mb-4">{selectedNews.title}</h2> <p className="text-gray-700 whitespace-pre-wrap">{selectedNews.content}</p> </div> )}</Modal>
            <Modal isOpen={applyModalOpen} onClose={() => setApplyModalOpen(false)}>{selectedNews && <ApplyForm news={selectedNews} onSubmit={handleApplySubmit} />}</Modal>
            <section>
                <div className="flex justify-between items-center mb-3"><h2 className="text-lg font-bold">지금 부안에서는</h2><a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('news'); }} className="text-sm font-medium text-gray-500 hover:text-gray-800">더 보기 <ChevronRight className="inline-block" size={14} /></a></div>
                <div className="flex overflow-x-auto gap-4 pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {buanNews.map((news) => {
                        const isLiked = likedNews.includes(news.id);
                        return (
                            <div key={news.id} className="flex-shrink-0 w-4/5 md:w-3/5 rounded-xl shadow-lg overflow-hidden group bg-gray-200 flex flex-col relative">
                                <img src={news.imageUrl} alt={news.title} className="w-full h-auto object-cover" onError={(e) => {e.target.onerror = null; e.target.src='https://placehold.co/600x400/eeeeee/333333?text=Image'}} />
                                <button onClick={() => handleLikeNews(news)} className="absolute top-2 right-2 bg-white/70 p-1.5 rounded-full">
                                    <Heart size={20} className={isLiked ? "text-red-500 fill-current" : "text-gray-500"} />
                                </button>
                                <div className="p-3 bg-white flex-grow"><h3 className="font-bold truncate">{news.title}</h3></div>
                                <div className="grid grid-cols-2 gap-px bg-gray-200">
                                    <button onClick={() => openDetailModal(news)} className="bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">자세히 보기</button>
                                    <button onClick={() => openApplyModal(news)} className="bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">신청하기</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </section>
            <section>
                <div className="flex justify-between items-center mb-3"><h2 className="text-lg font-bold">부안 달력</h2><a href="#" onClick={(e) => {e.preventDefault(); setCurrentPage('calendar');}} className="text-sm font-medium text-gray-500 hover:text-gray-800">자세히 <ChevronRight className="inline-block" size={14} /></a></div>
                <Calendar events={userEvents} onDateClick={(date) => setCurrentPage('calendar', { date })}/>
            </section>
            <section>
                <div className="flex justify-between items-center mb-3"><h2 className="text-lg font-bold">지금 인기있는 글</h2><a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('board'); }} className="text-sm font-medium text-gray-500 hover:text-gray-800">더 보기 <ChevronRight className="inline-block" size={14} /></a></div>
                <div className="space-y-3">
                    {popularPosts.length > 0 ? (popularPosts.map(post => { const style = getCategoryStyle(post.category);
                        return (<div key={post.id} onClick={() => setCurrentPage('postDetail', post.id)} className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3 cursor-pointer"><span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md`}>{post.category}</span><p className="truncate flex-1">{post.title}</p><div className="flex items-center text-xs text-gray-400 gap-2"><Heart size={14} className="text-red-400"/><span>{post.likes?.length || 0}</span></div></div>);
                    })) : (<p className="text-center text-gray-500 py-4">아직 인기글이 없어요.</p>)}
                </div>
            </section>
            <section>
                <div className="flex justify-between items-center mb-3"><h2 className="text-lg font-bold">팔로잉</h2></div>
                <div className="space-y-3">
                    {followingPosts.length > 0 ? (followingPosts.map(post => { const style = getCategoryStyle(post.category);
                        return (
                        <div key={post.id} onClick={() => setCurrentPage('postDetail', post.id)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                            <div className="flex items-center gap-2 mb-2"><span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md`}>{post.category}</span><h3 className="font-bold text-md truncate flex-1">{post.title}</h3></div>
                            <p className="text-gray-600 text-sm mb-3 truncate">{post.content}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500"><div><span onClick={(e) => { e.stopPropagation(); setCurrentPage('userProfile', post.authorId); }} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span><span className="mx-1">·</span><span>{timeSince(post.createdAt)}</span></div><div className="flex items-center gap-3"><div className="flex items-center gap-1"><Heart size={14} className={post.likes?.includes(currentUser.uid) ? 'text-red-500 fill-current' : 'text-gray-400'} /><span>{post.likes?.length || 0}</span></div><div className="flex items-center gap-1"><MessageCircle size={14} className="text-gray-400"/><span>{post.commentCount || 0}</span></div></div></div>
                        </div>
                        );
                    })) : (<p className="text-center text-gray-500 py-4">팔로우하는 사용자의 글이 없습니다.</p>)}
                </div>
            </section>
        </div>
    );
};

const NewsPage = ({ buanNews, currentUser, handleLikeNews, likedNews }) => {
    const [activeTag, setActiveTag] = useState('전체');
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [applyModalOpen, setApplyModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const tags = ['전체', '청년', '문화', '육아', '교육', '노인'];
    const filteredNews = activeTag === '전체' ? buanNews : buanNews.filter(news => news.tags.includes(activeTag));
    const openDetailModal = (news) => { setSelectedNews(news); setDetailModalOpen(true); };
    const openApplyModal = (news) => { setSelectedNews(news); setApplyModalOpen(true); };

    const handleApplySubmit = async (applicationData) => {
        try {
            await addDoc(collection(db, "applications"), { ...applicationData, eventName: selectedNews.title, userId: currentUser.uid, submittedAt: Timestamp.now(), });
            alert('신청이 완료되었습니다.');
            setApplyModalOpen(false);
        } catch (error) {
            console.error("Error submitting application: ", error);
            alert('신청 중 오류가 발생했습니다.');
        }
    };

    return (
        <div className="p-4">
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {tags.map(tag => (
                    <button key={tag} onClick={() => setActiveTag(tag)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${activeTag === tag ? 'bg-[#00462A] text-white' : 'bg-gray-200 text-gray-700'}`}>
                        #{tag}
                    </button>
                ))}
            </div>
            <div className="space-y-4">
                <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)}>
                    {selectedNews && (<div><h2 className="text-2xl font-bold mb-4">{selectedNews.title}</h2><p className="text-gray-700 whitespace-pre-wrap">{selectedNews.content}</p></div>)}
                </Modal>
                <Modal isOpen={applyModalOpen} onClose={() => setApplyModalOpen(false)}>
                    {selectedNews && <ApplyForm news={selectedNews} onSubmit={handleApplySubmit} />}
                </Modal>
                {filteredNews.map((news) => {
                    const isLiked = likedNews.includes(news.id);
                    return (
                        <div key={news.id} className="w-full rounded-xl shadow-lg overflow-hidden group bg-gray-200 flex flex-col relative">
                            <img src={news.imageUrl} alt={news.title} className="w-full h-auto object-cover" onError={(e) => {e.target.onerror = null; e.target.src='https://placehold.co/600x400/eeeeee/333333?text=Image'}} />
                             <button onClick={() => handleLikeNews(news)} className="absolute top-2 right-2 bg-white/70 p-1.5 rounded-full">
                                <Heart size={20} className={isLiked ? "text-red-500 fill-current" : "text-gray-500"} />
                            </button>
                            <div className="p-3 bg-white flex-grow">
                                <h3 className="font-bold truncate">{news.title}</h3>
                            </div>
                            <div className="grid grid-cols-2 gap-px bg-gray-200">
                                <button onClick={() => openDetailModal(news)} className="bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">자세히 보기</button>
                                <button onClick={() => openApplyModal(news)} className="bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">신청하기</button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

const CalendarPage = ({ userEvents, currentUser, pageParam }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [eventTitle, setEventTitle] = useState('');
    
    useEffect(() => {
        if(pageParam?.date) {
            setSelectedDate(pageParam.date);
            setIsModalOpen(true);
        }
    }, [pageParam]);

    const handleDateClick = (date) => { setSelectedDate(date); setIsModalOpen(true); };
    const handleAddEvent = async () => {
        if (!eventTitle.trim()) { alert("일정 제목을 입력해주세요."); return; }
        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'events'), { title: eventTitle, date: selectedDate, createdAt: Timestamp.now(), type: 'user' });
            setIsModalOpen(false); setEventTitle('');
        } catch(error) { console.error("Error adding event: ", error); alert("일정 추가 중 오류가 발생했습니다."); }
    };
    const eventsForSelectedDate = selectedDate && userEvents[selectedDate] ? userEvents[selectedDate] : [];

    return (
        <div className="p-4">
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <div className="p-2">
                    <h3 className="text-lg font-bold mb-4">{selectedDate}</h3>
                    <div className="mb-4">
                        <input type="text" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} placeholder="새로운 일정"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00462A] focus:border-[#00462A]" />
                    </div>
                    <button onClick={handleAddEvent} className="w-full bg-[#00462A] text-white font-bold py-2 px-4 rounded-lg hover:bg-[#003a22]"> 저장 </button>
                    <div className="mt-6">
                        <h4 className="font-bold mb-2">이 날의 일정:</h4>
                        {eventsForSelectedDate.length > 0 ? (
                            <ul className="list-disc list-inside space-y-1">
                                {eventsForSelectedDate.map(event => <li key={event.id}>{event.title}</li>)}
                            </ul>
                        ) : ( <p className="text-gray-500">등록된 일정이 없습니다.</p> )}
                    </div>
                </div>
            </Modal>
            <Calendar events={userEvents} onDateClick={handleDateClick} />
        </div>
    );
};

const ApplyForm = ({ news, onSubmit }) => {
    const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [dob, setDob] = useState(''); const [agreed, setAgreed] = useState(false);
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name || !phone || !dob) { alert('모든 정보를 입력해주세요.'); return; }
        if (!agreed) { alert('개인정보 수집 및 이용에 동의해주세요.'); return; }
        onSubmit({ name, phone, dob });
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-2xl font-bold mb-4">{news.title}</h2>
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">이름</label>
                <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00462A] focus:border-[#00462A] sm:text-sm" />
            </div>
            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">전화번호</label>
                <input type="tel" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00462A] focus:border-[#00462A] sm:text-sm" />
            </div>
            <div>
                <label htmlFor="dob" className="block text-sm font-medium text-gray-700">생년월일</label>
                <input type="date" id="dob" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-[#00462A] focus:border-[#00462A] sm:text-sm" />
            </div>
            <div className="flex items-start">
                <div className="flex items-center h-5">
                    <input id="agreement" name="agreement" type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="focus:ring-[#00462A] h-4 w-4 text-[#00462A] border-gray-300 rounded" />
                </div>
                <div className="ml-3 text-sm"> <label htmlFor="agreement" className="font-medium text-gray-700">신청 기능은 7월 1일 베타 버전 이후 활성화됩니다!</label> </div>
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00462A] hover:bg-[#003a22] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00462A]">
                제출하기
            </button>
        </form>
    );
};

const BoardPage = ({ posts, setCurrentPage, currentUser }) => {
    const [filter, setFilter] = useState('전체');
    const categories = ['전체', '일상', '친목', '10대', '청년', '중년', '부안맘', '질문'];
    const filteredPosts = filter === '전체' ? posts : posts.filter(p => p.category === filter);
    const timeSince = (date) => {
        if (!date) return '';
        const seconds = Math.floor((new Date() - date.toDate()) / 1000);
        if (seconds < 60) return `방금 전`;
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}분 전`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}시간 전`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}일 전`;
        return date.toLocaleDateString('ko-KR');
    };

    return (
        <div className="p-4">
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {categories.map(cat => (
                    <button key={cat} onClick={() => setFilter(cat)}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${filter === cat ? 'bg-[#00462A] text-white' : 'bg-gray-200 text-gray-700'}`}>
                        {cat}
                    </button>
                ))}
            </div>
            <div className="space-y-3">
                 {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => {
                        const style = getCategoryStyle(post.category);
                        return (
                        <div key={post.id} onClick={() => setCurrentPage('postDetail', post.id)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md`}>{post.category}</span>
                                <h3 className="font-bold text-md truncate flex-1">{post.title}</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 truncate">{post.content}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                               <div>
                                    <span onClick={(e) => { e.stopPropagation(); setCurrentPage('userProfile', post.authorId); }} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span>
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
             <button onClick={() => setCurrentPage('write')}
                className="fixed bottom-24 right-5 bg-[#00462A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[#003a22] transition-transform transform hover:scale-110">
                <PlusCircle size={28} />
            </button>
        </div>
    );
};


// =================================================================
// ▼▼▼ 문제 1 해결: WritePage 컴포넌트 수정 ▼▼▼
// =================================================================
const WritePage = ({ setCurrentPage, currentUser, postToEdit, goBack }) => {
    const [title, setTitle] = useState(postToEdit?.title || '');
    const [content, setContent] = useState(postToEdit?.content || '');
    const [category, setCategory] = useState(postToEdit?.category || '일상');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(postToEdit?.imageUrl || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['일상', '친목', '10대', '청년', '중년', '부안맘', '질문'];
    
    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) {
            alert('제목과 내용을 모두 입력해주세요.'); return;
        }
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let imageUrl = postToEdit?.imageUrl || null;
            let imagePath = postToEdit?.imagePath || null;

            if (imageFile) {
                if (postToEdit?.imagePath) {
                    const oldImageRef = ref(storage, postToEdit.imagePath);
                    await deleteObject(oldImageRef).catch(err => console.error("기존 이미지 삭제 실패:", err));
                }
                const newImagePath = `posts/${currentUser.uid}/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, newImagePath);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
                imagePath = newImagePath;
            }

            const postData = {
                title, content, category, imageUrl, imagePath,
                updatedAt: Timestamp.now(),
            };

            if (postToEdit) {
                const postRef = doc(db, 'posts', postToEdit.id);
                await updateDoc(postRef, postData);
                // 수정 완료 후 상세 페이지로 돌아가기
                goBack();
            } else {
                await addDoc(collection(db, 'posts'), {
                    ...postData,
                    authorId: currentUser.uid,
                    authorName: currentUser.displayName,
                    createdAt: Timestamp.now(),
                    likes: [], bookmarks: [], commentCount: 0,
                });
                setCurrentPage('board');
            }
        } catch (error) {
            console.error("글 처리 중 오류: ", error);
            alert('글을 처리하는 중 오류가 발생했습니다.');
        } finally {
            // ★ 해결점: 오류가 발생하든, 성공하든 항상 isSubmitting을 false로 변경하여 버튼을 원상태로 복구
            setIsSubmitting(false);
        }
    };

    const pageTitle = postToEdit ? "글 수정" : "글쓰기";
    const goBackAction = () => {
        // 수정 중 뒤로가기 시 상세 페이지로, 새 글 작성 시 보드로 이동
        if (postToEdit) {
            goBack();
        } else {
            setCurrentPage('board');
        }
    };

    return (
        <div>
            <div className="p-4 flex items-center border-b">
                <button onClick={goBackAction} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-lg font-bold mx-auto">{pageTitle}</h2>
                <button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">
                    {isSubmitting ? '등록 중...' : '완료'}
                </button>
            </div>
            <div className="p-4 space-y-4">
                <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {categories.map(cat => {
                        const style = getCategoryStyle(cat);
                        return (
                            <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${category === cat ? `${style.bgStrong} text-white` : 'bg-gray-200 text-gray-700'}`}>
                                {cat}
                            </button>
                        );
                    })}
                </div>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="w-full text-xl p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요..." className="w-full h-64 p-2 focus:outline-none resize-none" />
                <div className="border-t pt-4">
                    <label htmlFor="image-upload" className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#00462A]"><ImageUp size={20} /><span>사진 추가</span></label>
                    <input id="image-upload" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
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

// =================================================================
// ▼▼▼ 문제 2 해결: PostDetailPage 컴포넌트 수정 ▼▼▼
// =================================================================
const PostDetailPage = ({ postId, setCurrentPage, currentUser, goBack }) => {
    const [post, setPost] = useState(null); 
    const [comments, setComments] = useState([]); 
    const [newComment, setNewComment] = useState(''); 
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        if (!postId) { goBack(); return; }
        const postRef = doc(db, `posts`, postId);
        const unsubscribePost = onSnapshot(postRef, (doc) => {
            if (doc.exists()) { 
                setPost({ id: doc.id, ...doc.data() }); 
            } else { 
                alert("삭제된 게시글입니다."); goBack(); 
            }
            setLoading(false);
        });
        const commentsRef = collection(db, `posts/${postId}/comments`); 
        const q = query(commentsRef, orderBy("createdAt", "asc"));
        const unsubscribeComments = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setComments(commentsData);
        });
        return () => { unsubscribePost(); unsubscribeComments(); };
    }, [postId, goBack]);
    
    const handleDelete = async () => {
        if (!post || post.authorId !== currentUser.uid) return;
        if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
            setLoading(true);
            try {
                if (post.imagePath) {
                    const imageRef = ref(storage, post.imagePath);
                    await deleteObject(imageRef);
                }
                await deleteDoc(doc(db, 'posts', postId));
                alert("게시글이 삭제되었습니다.");
                goBack();
            } catch (error) {
                console.error("Error deleting post: ", error);
                alert("삭제 중 오류가 발생했습니다.");
                setLoading(false);
            }
        }
    };

    const handleLike = async () => { /* 이전과 동일 */ };
    const handleBookmark = async () => { /* 이전과 동일 */ };
    const handleCommentSubmit = async (e) => { /* 이전과 동일 */ };
    const handleCommentLike = async (commentId, currentLikes = []) => { /* 이전과 동일 */ };
    const timeSince = (date) => { /* 이전과 동일 */ };
    
    // ★ 해결점: 로딩이 끝나고, post와 currentUser 객체가 모두 존재할 때만 isAuthor를 계산하도록 함
    if (loading) return <LoadingSpinner />; 
    if (!post || !currentUser) return null;

    const isLiked = post.likes?.includes(currentUser.uid);
    const isBookmarked = post.bookmarks?.includes(currentUser.uid);
    const style = getCategoryStyle(post.category);
    const isAuthor = post.authorId === currentUser.uid;
    
    return (
        <div className="pb-20">
            {/* 헤더 부분: 뒤로가기 버튼 추가 */}
            <div className="sticky top-0 bg-white/80 backdrop-blur-sm z-10 px-4 py-3 flex justify-between items-center border-b">
                <button onClick={goBack} className="p-1"><ArrowLeft size={24} /></button>
                <div className="flex items-center gap-2">
                    {/* ★ 해결점: isAuthor가 true일 때만 수정/삭제 버튼이 보이도록 함 */}
                    {isAuthor && (
                        <>
                            <button onClick={() => setCurrentPage('editPost', post)} className="p-1 text-gray-600 hover:text-blue-600">
                                <Pencil size={22} />
                            </button>
                            <button onClick={handleDelete} className="p-1 text-gray-600 hover:text-red-600">
                                <Trash2 size={22} />
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="p-4">
                <div className="mb-4 pb-4 border-b">
                    <span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md mb-2 inline-block`}>{post.category}</span>
                    <div className="flex justify-between items-start mt-2">
                        <h1 className="text-2xl font-bold flex-1 pr-4">{post.title}</h1>
                        <button onClick={handleBookmark} className="p-1">
                            <Star size={22} className={isBookmarked ? "text-yellow-400 fill-current" : "text-gray-400"} />
                        </button>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                        <span onClick={() => setCurrentPage('userProfile', post.authorId)} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span>
                        <span className="mx-2">·</span>
                        <span>{timeSince(post.createdAt)}</span>
                    </div>
                    {post.imageUrl && (
                        <div className="my-4">
                            <img src={post.imageUrl} alt="Post image" className="w-full h-auto rounded-lg object-cover" />
                        </div>
                    )}
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mt-4">{post.content}</p>
                </div>
                {/* 좋아요, 댓글 등 나머지 UI */}
            </div>
             {/* 댓글 입력 폼 등 나머지 UI */}
        </div>
    );
};

// ... UserProfilePage, BottomNav 등 나머지 컴포넌트는 이전과 동일 ...

const UserProfilePage = ({ userId, setCurrentPage, currentUser }) => {
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (!userId) return;
        
        const userRef = doc(db, 'users', userId);
        const unsubscribeUser = onSnapshot(userRef, (doc) => {
            if(doc.exists()){
                const userData = doc.data();
                setProfileUser({...userData, id: doc.id, uid: doc.id});
                setIsFollowing(userData.followers?.includes(currentUser.uid) || false);
            }
        });

        const userPostsQuery = query(collection(db, 'posts'), where("authorId", "==", userId), orderBy("createdAt", "desc"));
        const unsubscribePosts = onSnapshot(userPostsQuery, (snapshot) => {
            setUserPosts(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
        
        return () => { unsubscribeUser(); unsubscribePosts(); };
    }, [userId, currentUser.uid]);

    const handleFollow = async () => {
        const currentUserRef = doc(db, 'users', currentUser.uid);
        const profileUserRef = doc(db, 'users', userId);
        if(isFollowing){
            await updateDoc(currentUserRef, { following: arrayRemove(userId) });
            await updateDoc(profileUserRef, { followers: arrayRemove(currentUser.uid) });
        } else {
            await updateDoc(currentUserRef, { following: arrayUnion(userId) });
            await updateDoc(profileUserRef, { followers: arrayUnion(currentUser.uid) });
        }
    };
    
    const handleLogout = async () => {
        if (window.confirm('로그아웃 하시겠습니까?')) {
            await signOut(auth);
        }
    };

    const handleMessage = () => {
        setCurrentPage('chatPage', { recipientId: userId, recipientName: profileUser.displayName });
    };

    if(!profileUser) return <LoadingSpinner />;
    const isMyProfile = currentUser.uid === userId;

    return (
        <div className="p-4">
            <div className="flex items-center mb-6">
                <div className="w-16 h-16 rounded-full bg-gray-300 mr-4 flex-shrink-0"></div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold">{profileUser.displayName}</h2>
                    <div className="text-sm text-gray-500">
                        <span>팔로워 {profileUser.followers?.length || 0}</span>
                        <span className="mx-2">·</span>
                        <span>팔로잉 {profileUser.following?.length || 0}</span>
                    </div>
                </div>
            </div>
            <div className="flex gap-2 mb-6">
                {isMyProfile ? (
                    <>
                        <button onClick={() => alert('프로필 편집 기능은 준비 중입니다.')} className="flex-1 p-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 flex items-center justify-center gap-1">
                            <Edit size={16} /> 프로필 편집
                        </button>
                        <button onClick={handleLogout} className="flex-1 p-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 flex items-center justify-center gap-1">
                            <LogOut size={16} /> 로그아웃
                        </button>
                    </>
                ) : (
                    <>
                        <button onClick={handleFollow} className={`flex-1 px-4 py-2 text-sm font-semibold rounded-lg ${isFollowing ? 'bg-gray-200 text-gray-800' : 'bg-[#00462A] text-white'}`}>
                            {isFollowing ? '팔로잉' : '팔로우'}
                        </button>
                        <button onClick={handleMessage} className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-500 text-white">
                            메시지
                        </button>
                    </>
                )}
            </div>

            <div className="space-y-3">
                <h3 className="text-lg font-bold">작성한 글</h3>
                {userPosts.length > 0 ? userPosts.map(post => (
                     <div key={post.id} onClick={() => setCurrentPage('postDetail', post.id)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                        <h4 className="font-bold text-md truncate mb-1">{post.title}</h4>
                        <p className="text-gray-600 text-sm truncate">{post.content}</p>
                    </div>
                )) : ( <p className="text-center text-gray-500 py-10">아직 작성한 글이 없습니다.</p> )}
            </div>
        </div>
    );
};

const BottomNav = ({ currentPage, setCurrentPage }) => {
    const navItems = [
        { id: 'home', icon: Home, label: '홈' }, { id: 'board', icon: LayoutGrid, label: '게시판' },
        { id: 'news', icon: Newspaper, label: '소식' }, { id: 'clubs', icon: Users, label: '클럽' },
        { id: 'benefits', icon: TicketPercent, label: '혜택' },
    ];
    const handleNavClick = (id) => {
        if (['clubs', 'benefits'].includes(id)) { alert('서비스 준비중입니다.'); }
        else { setCurrentPage(id); }
    };
    return (
        <footer className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto z-20">
            <div className="bg-white px-3 pt-2 pb-3 border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.05)]">
                <div className="flex justify-around items-center">
                    {navItems.map(item => {
                        const isActive = currentPage === item.id;
                        const IconComponent = item.icon;
                        return (
                            <a href="#" key={item.id} onClick={(e) => { e.preventDefault(); handleNavClick(item.id); }} className="text-center p-2 rounded-lg w-1/5">
                                <IconComponent className={`w-6 h-6 mx-auto ${isActive ? 'text-[#00462A]' : 'text-gray-500'}`} />
                                <span className={`text-xs font-medium ${isActive ? 'text-[#00462A] font-bold' : 'text-gray-500'}`}>{item.label}</span>
                            </a>
                        );
                    })}
                </div>
            </div>
        </footer>
    );
};

// --- 메인 App 컴포넌트 ---
export default function App() {
    const [page, setPage] = useState('home');
    const [pageHistory, setPageHistory] = useState([{page: 'home', param: null}]);
    const [pageParam, setPageParam] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [followingPosts, setFollowingPosts] = useState([]);
    const [userEvents, setUserEvents] = useState({});
    const [chats, setChats] = useState([]);
    const [likedNews, setLikedNews] = useState([]);

    const buanNews = [ /* 이전과 동일 */ ];

    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userDocUnsubscribe = onSnapshot(userRef, (userSnap) => {
                    const userData = userSnap.exists() ? userSnap.data() : {};
                    setCurrentUser({ ...user, ...userData });
                    setLikedNews(userData.likedNews || []);
                    setLoading(false);
                });
                return () => userDocUnsubscribe();
            } else {
                setCurrentUser(null);
                setLoading(false);
            }
        });
        return () => authUnsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser?.uid) {
            setPosts([]); setFollowingPosts([]); setUserEvents({}); setChats([]); return;
        }

        const qPosts = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50));
        const unsubPosts = onSnapshot(qPosts, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        if (currentUser.following && currentUser.following.length > 0) {
            const qFollowingPosts = query(collection(db, "posts"), where('authorId', 'in', currentUser.following.slice(0, 10)), orderBy("createdAt", "desc"), limit(30));
            const unsubFollowing = onSnapshot(qFollowingPosts, (snapshot) => {
                setFollowingPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            });
            return () => { unsubPosts(); unsubFollowing(); };
        } else {
             setFollowingPosts([]);
        }
        
        return () => unsubPosts();
    }, [currentUser?.uid, currentUser?.following]); 

    const setCurrentPage = (pageName, param = null) => {
        const newHistoryEntry = { page: pageName, param: param };
        // 수정 페이지로 갈 때는 히스토리를 쌓지 않고, 수정 완료 후 goBack()으로 돌아오게 함
        if (pageName === 'editPost') {
            setPage(pageName);
            setPageParam(param);
        } else {
            setPageHistory(prev => [...prev, newHistoryEntry]);
            setPage(pageName);
            setPageParam(param);
        }
    };
    
    const goBack = useCallback(() => {
        setPageHistory(prevHistory => {
            if (prevHistory.length <= 1) {
                setPage('home'); setPageParam(null); return [{page: 'home', param: null}];
            }
            const newHistory = prevHistory.slice(0, prevHistory.length - 1);
            const lastPage = newHistory[newHistory.length - 1];
            setPage(lastPage.page || 'home');
            setPageParam(lastPage.param || null);
            return newHistory;
        });
    }, []);

    const renderPage = () => {
        switch (page) {
            case 'home': return <HomePage setCurrentPage={setCurrentPage} posts={posts} buanNews={buanNews} currentUser={currentUser} userEvents={userEvents} followingPosts={followingPosts} likedNews={likedNews} />;
            case 'board': return <BoardPage posts={posts} setCurrentPage={setCurrentPage} currentUser={currentUser} />;
            case 'write': return <WritePage setCurrentPage={setCurrentPage} currentUser={currentUser} goBack={goBack} />;
            case 'editPost': return <WritePage setCurrentPage={setCurrentPage} currentUser={currentUser} postToEdit={pageParam} goBack={goBack} />;
            case 'postDetail': return <PostDetailPage postId={pageParam} setCurrentPage={setCurrentPage} goBack={goBack} currentUser={currentUser} />;
            case 'userProfile': return <UserProfilePage userId={pageParam} setCurrentPage={setCurrentPage} currentUser={currentUser} />;
            // ... 다른 페이지 케이스들
            default: return <HomePage setCurrentPage={setCurrentPage} posts={posts} buanNews={buanNews} currentUser={currentUser} userEvents={userEvents} followingPosts={followingPosts} likedNews={likedNews} />;
        }
    };
    
    if (loading) return <div className="max-w-sm mx-auto bg-white shadow-lg min-h-screen"><LoadingSpinner /></div>;
    if (!currentUser) return <AuthPage />;

    const showNav = !['write', 'editPost', 'postDetail', 'chatPage'].includes(page);

    return (
        <div className="max-w-sm mx-auto bg-gray-50 shadow-lg min-h-screen font-sans text-gray-800">
            <main className="bg-white" style={{paddingBottom: showNav ? '6rem' : '0'}}>
                {renderPage()}
            </main>
            {showNav && <BottomNav currentPage={page} setCurrentPage={setCurrentPage} />}
        </div>
    );
}