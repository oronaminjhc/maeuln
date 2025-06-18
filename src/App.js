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
    limit
} from 'firebase/firestore';
import { Home, Newspaper, LayoutGrid, Users, TicketPercent, ArrowLeft, Heart, MessageCircle, Send, PlusCircle, ChevronLeft, ChevronRight, X, Search, Bell, Star, Pencil, LogOut, Edit, MessageSquare } from 'lucide-react';

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

const categoryStyles = {
    '일상': { text: 'text-purple-600', bg: 'bg-purple-100', bgStrong: 'bg-purple-500' },
    '맛집': { text: 'text-green-600', bg: 'bg-green-100', bgStrong: 'bg-green-500' },
    '정보': { text: 'text-orange-600', bg: 'bg-orange-100', bgStrong: 'bg-orange-500' },
    '질문': { text: 'text-blue-600', bg: 'bg-blue-100', bgStrong: 'bg-blue-500' },
    '사건사고': { text: 'text-red-600', bg: 'bg-red-100', bgStrong: 'bg-red-500' },
    '기타': { text: 'text-gray-600', bg: 'bg-gray-100', bgStrong: 'bg-gray-500' }
};
const getCategoryStyle = (category) => categoryStyles[category] || categoryStyles['기타'];

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
                    <div className="w-6"></div>
                    <h3 className="text-lg font-bold text-center"> </h3>
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

const AuthPage = () => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nickname, setNickname] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleAuthAction = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
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
                    displayName: nickname, email: user.email, createdAt: Timestamp.now(), followers: [], following: []
                });
            }
        } catch (err) {
            console.error("Auth Error:", err);
            switch (err.code) {
                case 'auth/operation-not-allowed': setError("Firebase 콘솔에서 이메일/비밀번호 로그인을 활성화해주세요."); break;
                case 'auth/email-already-in-use': setError('이미 사용 중인 이메일입니다.'); break;
                case 'auth/invalid-credential': case 'auth/wrong-password': case 'auth/user-not-found': setError('이메일 또는 비밀번호가 잘못되었습니다.'); break;
                default:
                    if (err.message === '닉네임은 2자 이상 입력해주세요.') setError(err.message);
                    else setError('오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                    break;
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-green-50 p-4">
            <div className="text-center mb-8 flex flex-col items-center">
                <Logo size={80} />
                <h1 className="text-3xl font-bold text-gray-800 mt-4">마을엔 부안</h1>
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
                <button onClick={() => setIsLoginMode(!isLoginMode)} className="w-full mt-4 text-sm text-gray-600 hover:text-[#00462A]">{isLoginMode ? '계정이 없으신가요? 회원가입' : '이미 계정이 있으신가요? 로그인'}</button>
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
        
const HomePage = ({ setCurrentPage, posts, buanNews, currentUser, userEvents, followingPosts }) => {
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
                    {buanNews.map((news, index) => (
                        <div key={index} className="flex-shrink-0 w-4/5 md:w-3/5 rounded-xl shadow-lg overflow-hidden group bg-gray-200 flex flex-col">
                            <img src={news.imageUrl} alt={news.title} className="w-full h-auto object-cover" onError={(e) => {e.target.onerror = null; e.target.src='https://placehold.co/600x400/eeeeee/333333?text=Image'}} />
                            <div className="p-3 bg-white flex-grow"><h3 className="font-bold truncate">{news.title}</h3></div>
                            <div className="grid grid-cols-2 gap-px bg-gray-200">
                                <button onClick={() => openDetailModal(news)} className="bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">자세히 보기</button>
                                <button onClick={() => openApplyModal(news)} className="bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">신청하기</button>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
            <section>
                <div className="flex justify-between items-center mb-3"><h2 className="text-lg font-bold">부안 달력</h2><a href="#" onClick={(e) => {e.preventDefault(); setCurrentPage('calendar');}} className="text-sm font-medium text-gray-500 hover:text-gray-800">자세히 <ChevronRight className="inline-block" size={14} /></a></div>
                <Calendar events={userEvents} />
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

// 소식 페이지
const NewsPage = ({ buanNews, currentUser }) => {
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
                {filteredNews.map((news, index) => (
                    <div key={index} className="w-full rounded-xl shadow-lg overflow-hidden group bg-gray-200 flex flex-col">
                        <img src={news.imageUrl} alt={news.title} className="w-full h-auto object-cover" />
                        <div className="p-3 bg-white flex-grow">
                            <h3 className="font-bold truncate">{news.title}</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-px bg-gray-200">
                            <button onClick={() => openDetailModal(news)} className="bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">자세히 보기</button>
                            <button onClick={() => openApplyModal(news)} className="bg-white py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">신청하기</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// 달력 페이지
const CalendarPage = ({ userEvents, currentUser }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [eventTitle, setEventTitle] = useState('');
    const handleDateClick = (date) => { setSelectedDate(date); setIsModalOpen(true); };
    const handleAddEvent = async () => {
        if (!eventTitle.trim()) { alert("일정 제목을 입력해주세요."); return; }
        try {
            await addDoc(collection(db, 'users', currentUser.uid, 'events'), { title: eventTitle, date: selectedDate, createdAt: Timestamp.now() });
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

// 신청하기 폼
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
                <div className="ml-3 text-sm"> <label htmlFor="agreement" className="font-medium text-gray-700">개인정보제공에 동의합니다.</label> </div>
            </div>
            <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#00462A] hover:bg-[#003a22] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#00462A]">
                제출하기
            </button>
        </form>
    );
};

// 게시판 페이지
const BoardPage = ({ posts, setCurrentPage, currentUser }) => {
    const [filter, setFilter] = useState('전체');
    const categories = ['전체', '일상', '맛집', '정보', '질문', '사건사고'];
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

// 글쓰기 페이지
const WritePage = ({ setCurrentPage, currentUser }) => {
    const [title, setTitle] = useState(''); const [content, setContent] = useState(''); const [category, setCategory] = useState('일상');
    const categories = ['일상', '맛집', '정보', '질문', '사건사고'];
    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) { alert('제목과 내용을 모두 입력해주세요.'); return; }
        try {
            await addDoc(collection(db, 'posts'), {
                title, content, category, authorId: currentUser.uid, authorName: currentUser.displayName,
                createdAt: Timestamp.now(), likes: [], bookmarks: [], commentCount: 0,
            });
            setCurrentPage('board');
        } catch (error) {
            console.error("Error adding document: ", error); alert('글을 등록하는 중 오류가 발생했습니다.');
        }
    };
    return (
        <div>
            <div className="p-4 flex items-center border-b">
                <button onClick={() => setCurrentPage('board')} className="p-2 -ml-2"> <ArrowLeft /> </button>
                <h2 className="text-lg font-bold mx-auto">글쓰기</h2>
                 <button onClick={handleSubmit} className="text-lg font-bold text-[#00462A]">완료</button>
            </div>
            <div className="p-4 space-y-4">
                <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                     {categories.map(cat => {
                        const style = getCategoryStyle(cat);
                        return(
                        <button key={cat} onClick={() => setCategory(cat)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${category === cat ? `${style.bgStrong} text-white` : 'bg-gray-200 text-gray-700'}`}>
                            {cat}
                        </button>
                        );
                    })}
                </div>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목"
                    className="w-full text-xl p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요..."
                    className="w-full h-64 p-2 focus:outline-none resize-none" />
            </div>
        </div>
    );
};

// 글 상세 페이지
const PostDetailPage = ({ postId, setCurrentPage, currentUser, goBack }) => {
    const [post, setPost] = useState(null); const [comments, setComments] = useState([]); const [newComment, setNewComment] = useState(''); const [loading, setLoading] = useState(true);
    const postRef = doc(db, `posts`, postId);
    
    useEffect(() => {
        const unsubscribePost = onSnapshot(postRef, (doc) => {
            if (doc.exists()) { setPost({ id: doc.id, ...doc.data() }); } else { alert("삭제된 게시글입니다."); goBack(); }
            setLoading(false);
        });
        const commentsRef = collection(db, `posts/${postId}/comments`); const q = query(commentsRef);
        const unsubscribeComments = onSnapshot(q, (snapshot) => {
            const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            commentsData.sort((a,b) => a.createdAt.toMillis() - b.createdAt.toMillis()); setComments(commentsData);
        });
        return () => { unsubscribePost(); unsubscribeComments(); };
    }, [postId, goBack]);
    
    const handleLike = async () => {
        if (!post || !currentUser) return; const liked = post.likes?.includes(currentUser.uid);
        try { await updateDoc(postRef, { likes: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) }); }
        catch (e) { console.error("Error updating like: ", e); }
    };
    const handleBookmark = async () => {
        if (!post || !currentUser) return; const bookmarked = post.bookmarks?.includes(currentUser.uid);
        try { await updateDoc(postRef, { bookmarks: bookmarked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) }); }
        catch(e) { console.error("Error updating bookmark:", e); }
    };
    const handleCommentSubmit = async () => {
        if (!newComment.trim() || !currentUser) return;
        try {
            await addDoc(collection(db, `posts/${postId}/comments`), { text: newComment.trim(), authorId: currentUser.uid, authorName: currentUser.displayName, createdAt: Timestamp.now(), likes: [] });
            await updateDoc(postRef, { commentCount: increment(1) });
            setNewComment('');
        } catch (e) { console.error("Error adding comment: ", e); }
    };
    const handleCommentLike = async (commentId, currentLikes = []) => {
        if (!currentUser) return; const commentRef = doc(db, `posts/${postId}/comments`, commentId); const liked = currentLikes.includes(currentUser.uid);
        try { await updateDoc(commentRef, { likes: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid) }); }
        catch(e) { console.error("Error liking comment:", e); }
    };
    const timeSince = (date) => {
        if (!date) return ''; const seconds = Math.floor((new Date() - date.toDate()) / 1000);
        if (seconds < 60) return `방금 전`; const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}분 전`; const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}시간 전`; const days = Math.floor(hours / 24);
        return `${days}일 전`;
    };

    if (loading) return <LoadingSpinner />; if (!post) return null;
    const isLiked = post.likes?.includes(currentUser.uid); const isBookmarked = post.bookmarks?.includes(currentUser.uid);
    const style = getCategoryStyle(post.category);
    
    return (
        <div className="pb-20">
            <div className="p-4">
                <div className="mb-4 pb-4 border-b">
                    <span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md mb-2 inline-block`}>{post.category}</span>
                    <div className="flex justify-between items-start mt-2">
                        <h1 className="text-2xl font-bold flex-1 pr-4">{post.title}</h1>
                        <button onClick={handleBookmark} className="p-1 -mr-1">
                            <Star size={22} className={isBookmarked ? "text-yellow-400 fill-current" : "text-gray-400"} />
                        </button>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                        <span onClick={() => setCurrentPage('userProfile', post.authorId)} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span>
                        <span className="mx-2">·</span>
                        <span>{timeSince(post.createdAt)}</span>
                    </div>
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
                             <div className="w-8 h-8 rounded-full bg-gray-200 mt-1 flex-shrink-0"></div>
                             <div className="flex-1">
                                <div className="bg-gray-100 p-3 rounded-lg">
                                    <p onClick={() => setCurrentPage('userProfile', comment.authorId)} className="font-semibold text-sm cursor-pointer hover:underline">{comment.authorName}</p>
                                    <p className="text-gray-800">{comment.text}</p>
                                </div>
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                    <span>{timeSince(comment.createdAt)}</span>
                                    <button onClick={() => handleCommentLike(comment.id, comment.likes)} className="ml-4 flex items-center hover:text-red-500">
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
                <div className="relative flex items-center">
                    <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="댓글을 입력하세요."
                        className="w-full pl-4 pr-12 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]"
                        onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()} />
                    <button onClick={handleCommentSubmit} className="absolute right-2 p-2 rounded-full text-gray-500 hover:bg-gray-200">
                        <Send size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

// 사용자 프로필 페이지
const UserProfilePage = ({ userId, setCurrentPage, posts, currentUser }) => {
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        const userRef = doc(db, 'users', userId);
        const unsubscribe = onSnapshot(userRef, (doc) => {
            if(doc.exists()){
                const userData = doc.data();
                setProfileUser({...userData, id: doc.id});
                setIsFollowing(userData.followers?.includes(currentUser.uid) || false);
            }
        });
        const userPostsQuery = query(collection(db, 'posts'), where("authorId", "==", userId));
        const unsubscribePosts = onSnapshot(userPostsQuery, (snapshot) => {
            setUserPosts(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });
        return () => { unsubscribe(); unsubscribePosts(); };
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

    if(!profileUser) return <LoadingSpinner />;

    const isMyProfile = currentUser.uid === userId;

    return (
        <div className="p-4">
            <div className="flex items-start mb-4 pb-4 border-b">
                <div className="w-16 h-16 rounded-full bg-gray-300 mr-4 flex-shrink-0"></div>
                <div className="flex-1">
                    <h2 className="text-xl font-bold">{profileUser.displayName}</h2>
                    <div className="text-sm text-gray-500">
                        <span>팔로워 {profileUser.followers?.length || 0}</span>
                        <span className="mx-2">·</span>
                        <span>팔로잉 {profileUser.following?.length || 0}</span>
                    </div>
                </div>
                {isMyProfile ? (
                    <div className="flex gap-2">
                        <button onClick={() => alert('프로필 편집 기능은 준비 중입니다.')} className="p-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 flex items-center gap-1">
                            <Edit size={16} />
                        </button>
                        <button onClick={handleLogout} className="p-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 flex items-center gap-1">
                            <LogOut size={16} />
                        </button>
                    </div>
                ) : (
                    <button onClick={handleFollow} className={`px-4 py-1.5 text-sm font-semibold rounded-full ${isFollowing ? 'bg-gray-200 text-gray-800' : 'bg-[#00462A] text-white'}`}>
                        {isFollowing ? '팔로잉' : '팔로우'}
                    </button>
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

// 하단 네비게이션
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

// 알림 페이지
const NotificationsPage = () => {
    const notifications = [
        { id: 1, text: '새로운 이벤트 "나의 삶, 한 권의 책"이 등록되었습니다.', time: '2시간 전' },
        { id: 2, text: '관심있는 이벤트 "7월 행복UP클래스" 신청이 시작되었습니다.', time: '8시간 전' },
    ];
    return ( <div className="p-4"> {notifications.map(notif => ( <div key={notif.id} className="p-3 border-b border-gray-200"> <p className="text-sm">{notif.text}</p> <p className="text-xs text-gray-500 mt-1">{notif.time}</p> </div> ))} </div> );
};

// 검색 페이지
const SearchPage = ({ posts, setCurrentPage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredPosts = searchTerm ? posts.filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.content.toLowerCase().includes(searchTerm.toLowerCase())) : [];
    return (
        <div className="p-4">
            <div className="relative mb-4">
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="검색어를 입력하세요..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]" />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            </div>
            <div className="space-y-3">
                {searchTerm && filteredPosts.length === 0 && ( <p className="text-center text-gray-500 py-10">검색 결과가 없습니다.</p> )}
                {filteredPosts.map(post => (
                     <div key={post.id} onClick={() => setCurrentPage('postDetail', post.id)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                        <h3 className="font-bold text-md truncate mb-1">{post.title}</h3>
                        <p className="text-gray-600 text-sm truncate">{post.content}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// 메인 앱
export default function App() {
    const [page, setPage] = useState('home');
    const [pageHistory, setPageHistory] = useState(['home']);
    const [pageParam, setPageParam] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [followingPosts, setFollowingPosts] = useState([]);
    const [userEvents, setUserEvents] = useState({});
    const [chats, setChats] = useState([]);

    const buanNews = [
        { title: "취업! 치얼업!", imageUrl: "https://lh3.googleusercontent.com/d/1a-5NaQ3U_K4PJS3vXI83uzRl-83a3Eea", tags: ['청년'], content: `부안군 로컬JOB센터, 구인구직 만남의 날!\n✨ 취업! 치얼업! ✨\n일자리를 찾고 있다면,\n이 기회를 놓치지 마세요!\n\n📍 일시: 2025년 6월 25일(수) 14:00\n📍 장소: 부안군어울림센터 1층\n*부안읍 부풍로 9-30\n\n🤝현장에서 면접까지!\n🎁면접만 봐도 현장면접비 5만원 지급!\n\n📞 사전 접수 필수!\n참여를 원하시는 분은 꼭 전화로 접수해주세요!\n063)584-8032~3`},
        { title: "나의 삶, 한 권의 책", imageUrl: "https://lh3.googleusercontent.com/d/1dTRIAP6fZD0ppTWCjyvn_6nY7joy5v__", tags: ['문화'], content: `2025 생애사 글쓰기 「나의 삶, 한 권의 책」 참여자 모집\n✍️ 2025 생애사 글쓰기\n「나의 삶, 한 권의 책」\n참여자를 모집합니다.\n\n석정문학을 톺아보며\n나를 내세우는 말 대신\n나를 회고하는 문화예술 글쓰기\n\n📖여러분의 이야기가\n한 권의 책으로 남는 순간을 만나보세요.\n\n✅모집기간 : 2025. 6. 18. ~ 선착순 마감\n✅모집대상 : 부안군민 성인 20명 내외\n✅접수방법 : 전화접수\n📞부안군문화재단 063-584-6212\n✅운영기간 : 2025. 7. ~ 10. (총 12회차)\n🕕매주(금) 오후 6시 30분 ~ 8시 30분\n✅운영장소: 부안석정문학관 1층 프로그램실`},
        { title: "7월 행복UP클래스 참여자 모집", imageUrl: "https://lh3.googleusercontent.com/d/14ovfCnTDi-4bmb8MeIX4OT6KzykZcd7M", tags: ['문화'], content: `🌟7월, 행복UP클래스 참여자 모집! 🌟\n✅모집대상\n부안 청년 누구나 (1979~2006년생)\n\n✅신청기간\n6. 19.(목) 오전 9시 ~ 6. 21.(토) 오후 6시\n※ 인기 클래스는 조기 마감될 수 있어요!\n\n✅신청하기 : https://naver.me/GuDn0War\n\n✅ 선정 안내\n📲 6월 24일(화) 문자 개별 발송\n📞 참여 의사 유선 확인: 6월 26일(금) 18시까지!\n※ 미확인 시 자동 취소\n\n✅ 최종 확정\n📬 6월 27일(토) 개별 통보\n🚫 당일취소❌ 노쇼❌ = 다음달 참여 제한!\n\n📝 신청 & 문의 : 부안청년UP센터\n☎ 063-584-2662,3\n(운영시간: 화•금 13:00~21:00 / 토 9:00~18:00)`}
    ];

   useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userRef);
                setCurrentUser({ uid: user.uid, ...user, ...(userSnap.exists() ? userSnap.data() : {}) });
            } else {
                setCurrentUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        if (!currentUser?.uid) {
            setPosts([]);
            setFollowingPosts([]);
            setUserEvents({});
            setChats([]);
            return;
        }

        const unsubscribes = [];

        const qPosts = query(collection(db, "posts"));
        unsubscribes.push(onSnapshot(qPosts, (snapshot) => {
            const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            postsData.sort((a,b) => b.createdAt.toMillis() - a.createdAt.toMillis());
            setPosts(postsData);
        }, error => console.error("Error fetching posts:", error)));

        const qEvents = query(collection(db, `users/${currentUser.uid}/events`));
        unsubscribes.push(onSnapshot(qEvents, (snapshot) => {
            const eventsData = {};
            snapshot.docs.forEach(doc => {
                const event = { id: doc.id, ...doc.data() };
                if (!eventsData[event.date]) eventsData[event.date] = [];
                eventsData[event.date].push(event);
            });
            setUserEvents(eventsData);
        }, error => console.error("Error fetching events:", error)));
        
        if (currentUser.following && currentUser.following.length > 0) {
            const followingIds = currentUser.following.slice(0, 30);
            const qFollowingPosts = query(collection(db, "posts"), where('authorId', 'in', followingIds));
            unsubscribes.push(onSnapshot(qFollowingPosts, (snapshot) => {
                const postsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                postsData.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
                setFollowingPosts(postsData);
            }, error => console.error("Error fetching following posts:", error)));
        } else {
            setFollowingPosts([]);
        }

        const qChats = query(collection(db, 'chats'), where('members', 'array-contains', currentUser.uid));
        unsubscribes.push(onSnapshot(qChats, async (snapshot) => {
            const chatsData = await Promise.all(snapshot.docs.map(async (doc) => {
                const chatData = doc.data();
                const otherMemberId = chatData.members.find(id => id !== currentUser.uid);
                if (!otherMemberId) return null;
                const userDoc = await getDoc(doc(db, 'users', otherMemberId));
                return {
                    id: doc.id,
                    ...chatData,
                    otherUser: userDoc.exists() ? userDoc.data() : { displayName: '알 수 없음' },
                };
            }));
            setChats(chatsData.filter(Boolean));
        }, error => console.error("Error fetching chats:", error)));

        return () => unsubscribes.forEach(unsub => unsub());
    }, [currentUser?.uid, currentUser?.following]); 

    const setCurrentPage = (pageName, param = null) => {
        setPage(pageName); setPageParam(param);
        if (pageName !== page || JSON.stringify(param) !== JSON.stringify(pageParam)) {
            setPageHistory(prev => [...prev, {page: pageName, param: param}]);
        }
    };
    
    const goBack = useCallback(() => {
        setPageHistory(prevHistory => {
            if (prevHistory.length <= 1) return prevHistory;
            const newHistory = [...prevHistory];
            newHistory.pop();
            const lastPage = newHistory[newHistory.length - 1];
            setPage(lastPage.page || 'home');
            setPageParam(lastPage.param || null);
            return newHistory;
        });
    }, []);

    if (loading) return <div className="max-w-sm mx-auto bg-white shadow-lg min-h-screen"><LoadingSpinner /></div>;
    if (!currentUser) return <AuthPage />;
    
    const renderHeader = () => {
        const mainPages = ['home'];
        const isSubPage = !mainPages.includes(page) && pageHistory.length > 1;
        const titleMap = { 'home': '마을엔 부안', 'news': '소식', 'board': '게시판', 'calendar': '달력', 'search': '검색', 'notifications': '알림', 'chatList': '채팅', 'chatPage': pageParam?.recipientName || '채팅' };
        const title = titleMap[page] || "마을엔 부안";
        
        return (
             <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                {isSubPage ? ( <button onClick={goBack} className="p-1"><ArrowLeft size={24} /></button> ) : ( <div className="flex items-center gap-2"> <Logo size={28} /> <h1 className="text-xl font-bold text-gray-800">{title}</h1> </div> )}
                <div className="flex items-center gap-3">
                     <button onClick={() => setCurrentPage('search')} className="p-1"><Search size={24} className="text-gray-600" /></button>
                     <button onClick={() => setCurrentPage('chatList')} className="p-1"><MessageSquare size={24} className="text-gray-600" /></button>
                     <button onClick={() => setCurrentPage('notifications')} className="p-1"><Bell size={24} className="text-gray-600" /></button>
                     <button onClick={() => setCurrentPage('userProfile', currentUser.uid)} className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center font-bold text-pink-700">{currentUser.displayName?.charAt(0) || '?'}</button>
                </div>
            </header>
        );
    };

    const renderPage = () => {
        switch (page) {
            case 'home': return <HomePage setCurrentPage={setCurrentPage} posts={posts} buanNews={buanNews} currentUser={currentUser} userEvents={userEvents} followingPosts={followingPosts} />;
            case 'news': return <NewsPage buanNews={buanNews} currentUser={currentUser} />;
            case 'calendar': return <CalendarPage userEvents={userEvents} currentUser={currentUser}/>;
            case 'board': return <BoardPage posts={posts} setCurrentPage={setCurrentPage} currentUser={currentUser} />;
            case 'write': return <WritePage setCurrentPage={setCurrentPage} currentUser={currentUser} />;
            case 'postDetail': return <PostDetailPage postId={pageParam} setCurrentPage={setCurrentPage} goBack={goBack} currentUser={currentUser} />;
            case 'userProfile': return <UserProfilePage userId={pageParam} setCurrentPage={setCurrentPage} currentUser={currentUser} />;
            case 'search': return <SearchPage posts={posts} setCurrentPage={setCurrentPage} />;
            case 'notifications': return <NotificationsPage />;
            case 'chatList': return <ChatListPage chats={chats} setCurrentPage={setCurrentPage} currentUser={currentUser} />;
            case 'chatPage': return <ChatPage pageParam={pageParam} currentUser={currentUser} />;
            default: return <HomePage setCurrentPage={setCurrentPage} posts={posts} buanNews={buanNews} currentUser={currentUser} userEvents={userEvents} followingPosts={followingPosts} />;
        }
    };

    return (
        <div className="max-w-sm mx-auto bg-gray-50 shadow-lg min-h-screen font-sans text-gray-800">
            {renderHeader()}
            <main className="pb-24 bg-white"> {renderPage()} </main>
            {!['write', 'postDetail', 'chatPage'].includes(page) && <BottomNav currentPage={page} setCurrentPage={setCurrentPage} />}
        </div>
    );
}

// ... (다른 컴포넌트들은 이전과 동일하게 유지)

// 채팅방 목록 페이지
const ChatListPage = ({ chats, setCurrentPage, currentUser }) => {
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">채팅 목록</h2>
            <div className="space-y-3">
                {chats.length > 0 ? chats.map(chat => (
                    <div key={chat.id} onClick={() => setCurrentPage('chatPage', { recipientId: chat.otherUser.uid, recipientName: chat.otherUser.displayName })}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0"></div>
                        <div className="flex-1">
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

// 채팅 페이지
const ChatPage = ({ pageParam, currentUser }) => {
    const { recipientId, recipientName } = pageParam;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);
    
    const chatId = [currentUser.uid, recipientId].sort().join('_');

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
        if (!newMessage.trim()) return;

        const messageData = {
            text: newMessage,
            senderId: currentUser.uid,
            createdAt: Timestamp.now(),
        };

        const chatRef = doc(db, 'chats', chatId);
        const messagesRef = collection(chatRef, 'messages');
        
        try {
            await addDoc(messagesRef, messageData);
            await setDoc(chatRef, {
                members: [currentUser.uid, recipientId],
                lastMessage: messageData,
            }, { merge: true });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-120px)]">
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
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t">
                 <div className="relative flex items-center">
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
                </div>
            </form>
        </div>
    );
};
