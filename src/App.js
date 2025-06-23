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
    updateDoc,
    Timestamp,
    where,
    orderBy,
    limit,
    deleteDoc
} from 'firebase/firestore';
import {
    getStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from 'firebase/storage';
import { Home, Newspaper, LayoutGrid, Users, TicketPercent, ArrowLeft, Heart, MessageCircle, Send, PlusCircle, ChevronLeft, ChevronRight, X, Search, Bell, Star, Pencil, LogOut, Edit, MessageSquare, Trash2, ImageUp } from 'lucide-react';

// ★ 관리자 UID 지정
const ADMIN_UID = 'wvXNcSqXMsaiqOCgBvU7A4pJoFv1';

// --- 로고 컴포넌트 ---
const Logo = ({ size = 28 }) => ( <img src="https://lh3.googleusercontent.com/d/1gkkNelRAltEEfKv9V4aOScws7MS28IUn" alt="Logo" width={size} height={size} style={{ objectFit: 'contain' }} /> );

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

// --- 기타 헬퍼 ---
const categoryStyles = { '일상': { text: 'text-purple-600', bg: 'bg-purple-100', bgStrong: 'bg-purple-500' }, '친목': { text: 'text-pink-600', bg: 'bg-pink-100', bgStrong: 'bg-pink-500' }, '10대': { text: 'text-cyan-600', bg: 'bg-cyan-100', bgStrong: 'bg-cyan-500' }, '청년': { text: 'text-indigo-600', bg: 'bg-indigo-100', bgStrong: 'bg-indigo-500' }, '중년': { text: 'text-yellow-600', bg: 'bg-yellow-100', bgStrong: 'bg-yellow-500' }, '부안맘': { text: 'text-teal-600', bg: 'bg-teal-100', bgStrong: 'bg-teal-500' }, '질문': { text: 'text-blue-600', bg: 'bg-blue-100', bgStrong: 'bg-blue-500' }, '기타': { text: 'text-gray-600', bg: 'bg-gray-100', bgStrong: 'bg-gray-500' } };
const getCategoryStyle = (category) => categoryStyles[category] || categoryStyles['기타'];
const timeSince = (date) => {
    if (!date) return ''; const seconds = Math.floor((new Date() - date.toDate()) / 1000);
    if (seconds < 60) return `방금 전`; const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`; const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`; const days = Math.floor(hours / 24);
    return `${days}일 전`;
};

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
    <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-[#00462A]"></div>
    </div>
);

const NewsCard = ({ news, isAdmin, openDetailModal, setCurrentPage, handleDeleteNews }) => {
    return (
        <div className="flex-shrink-0 w-full rounded-xl shadow-lg overflow-hidden group bg-gray-200 flex flex-col relative">
            {news.imageUrl && <img src={news.imageUrl} alt={news.title} className="w-full h-48 object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/eeeeee/333333?text=Image' }} />}
            
            {isAdmin && (
                <div className="absolute top-2 left-2 flex gap-2 z-10">
                    <button onClick={() => setCurrentPage('editNews', news)} className="bg-white/70 p-1.5 rounded-full text-blue-600 shadow"><Pencil size={20} /></button>
                    <button onClick={() => handleDeleteNews(news.id, news.imagePath)} className="bg-white/70 p-1.5 rounded-full text-red-600 shadow"><Trash2 size={20} /></button>
                </div>
            )}

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
// ▼▼▼ 페이지 컴포넌트들 (모두 포함) ▼▼▼
// =================================================================

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
                    displayName: nickname, email: user.email, createdAt: Timestamp.now(), followers: [], following: []
                });
            }
        } catch (err) {
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

const HomePage = ({ setCurrentPage, posts, buanNews, currentUser, handleDeleteNews, followingPosts, userEvents }) => {
    const popularPosts = [...posts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 3);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const isAdmin = currentUser.uid === ADMIN_UID;

    const openDetailModal = (news) => { setSelectedNews(news); setDetailModalOpen(true); };

    return (
        <div className="p-4 space-y-8">
            <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)}>{selectedNews && ( <div><h2 className="text-2xl font-bold mb-4">{selectedNews.title}</h2><p className="text-gray-700 whitespace-pre-wrap">{selectedNews.content}</p></div> )}</Modal>

            <section>
                <div className="flex justify-between items-center mb-3"><h2 className="text-lg font-bold">지금 부안에서는</h2><a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('news'); }} className="text-sm font-medium text-gray-500 hover:text-gray-800">더 보기 <ChevronRight className="inline-block" size={14} /></a></div>
                <div className="flex overflow-x-auto gap-4 pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {buanNews.map((news) => (
                        <div key={news.id} className="w-4/5 md:w-3/5">
                            <NewsCard {...{news, isAdmin, openDetailModal, setCurrentPage, handleDeleteNews}} />
                        </div>
                    ))}
                     {buanNews.length === 0 && <div className="text-center text-gray-500 w-full p-8 bg-gray-100 rounded-lg">아직 등록된 소식이 없습니다.</div>}
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


const NewsPage = ({ buanNews, currentUser, setCurrentPage, handleDeleteNews }) => {
    const isAdmin = currentUser.uid === ADMIN_UID;
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const openDetailModal = (news) => { setSelectedNews(news); setDetailModalOpen(true); };

    return (
        <div className="p-4">
            {isAdmin && (
                 <button onClick={() => setCurrentPage('writeNews')} className="w-full mb-4 bg-[#00462A] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#003a22] transition-colors shadow-lg flex items-center justify-center gap-2">
                    <PlusCircle size={20} /> 소식 글쓰기
                </button>
            )}

            <Modal isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)}>{selectedNews && (<div><h2 className="text-2xl font-bold mb-4">{selectedNews.title}</h2><p className="text-gray-700 whitespace-pre-wrap">{selectedNews.content}</p></div>)}</Modal>

            <div className="space-y-4">
                {buanNews.map((news) => ( <NewsCard key={news.id} {...{news, isAdmin, openDetailModal, setCurrentPage, handleDeleteNews}} /> ))}
                {buanNews.length === 0 && <div className="text-center text-gray-500 py-10 p-8 bg-gray-100 rounded-lg">등록된 소식이 없습니다.</div>}
            </div>
        </div>
    );
};

const NewsWritePage = ({ goBack, currentUser, itemToEdit }) => {
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [content, setContent] = useState(itemToEdit?.content || '');
    const [tags, setTags] = useState(itemToEdit?.tags?.join(', ') || '');
    const [applyUrl, setApplyUrl] = useState(itemToEdit?.applyUrl || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(itemToEdit?.imageUrl || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageChange = (e) => {
        if (e.target.files[0]) { const file = e.target.files[0]; setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) { alert('제목과 내용을 모두 입력해주세요.'); return; }
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let imageUrl = itemToEdit?.imageUrl || null;
            let imagePath = itemToEdit?.imagePath || null;

            if (imageFile) {
                if (itemToEdit?.imagePath) { await deleteObject(ref(storage, itemToEdit.imagePath)).catch(err => console.error("기존 이미지 삭제 실패:", err)); }
                const newImagePath = `news_images/${currentUser.uid}/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, newImagePath);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
                imagePath = newImagePath;
            }

            const finalData = { title, content, imageUrl, imagePath, updatedAt: Timestamp.now(), tags: tags.split(',').map(t => t.trim()).filter(Boolean), applyUrl };

            if (itemToEdit) {
                await updateDoc(doc(db, 'news', itemToEdit.id), finalData);
            } else {
                finalData.createdAt = Timestamp.now();
                finalData.authorId = currentUser.uid;
                await addDoc(collection(db, 'news'), finalData);
            }
            goBack();
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
                <button onClick={goBack} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-lg font-bold mx-auto">{pageTitle}</h2>
                <button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">
                    {isSubmitting ? '등록 중...' : '완료'}
                </button>
            </div>
            <div className="p-4 space-y-4">
                <input type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="태그 (쉼표로 구분)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <input type="url" value={applyUrl} onChange={(e) => setApplyUrl(e.target.value)} placeholder="신청하기 URL 링크 (선택 사항)" className="w-full p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="w-full text-xl p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요..." className="w-full h-64 p-2 focus:outline-none resize-none" />
                <div className="border-t pt-4">
                    <label htmlFor="image-upload-news" className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#00462A]"><ImageUp size={20} /><span>사진 추가</span></label>
                    <input id="image-upload-news" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    {imagePreview && ( <div className="mt-4 relative w-32 h-32"> <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" /> <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"><X size={14} /></button> </div> )}
                </div>
            </div>
        </div>
    );
};

const WritePage = ({ goBack, currentUser, itemToEdit }) => {
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [content, setContent] = useState(itemToEdit?.content || '');
    const [category, setCategory] = useState(itemToEdit?.category || '일상');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(itemToEdit?.imageUrl || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['일상', '친목', '10대', '청년', '중년', '부안맘', '질문'];

    const handleImageChange = (e) => {
        if (e.target.files[0]) {
            const file = e.target.files[0]; setImageFile(file); setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!title.trim() || !content.trim()) { alert('제목과 내용을 모두 입력해주세요.'); return; }
        if (isSubmitting) return;
        setIsSubmitting(true);

        try {
            let imageUrl = itemToEdit?.imageUrl || null;
            let imagePath = itemToEdit?.imagePath || null;

            if (imageFile) {
                if (itemToEdit?.imagePath) { await deleteObject(ref(storage, itemToEdit.imagePath)).catch(err => console.error("기존 이미지 삭제 실패:", err)); }
                const newImagePath = `posts/${currentUser.uid}/${Date.now()}_${imageFile.name}`;
                const storageRef = ref(storage, newImagePath);
                await uploadBytes(storageRef, imageFile);
                imageUrl = await getDownloadURL(storageRef);
                imagePath = newImagePath;
            }

            const postData = { title, content, category, imageUrl, imagePath, updatedAt: Timestamp.now() };

            if (itemToEdit) {
                await updateDoc(doc(db, 'posts', itemToEdit.id), postData);
            } else {
                await addDoc(collection(db, 'posts'), {
                    ...postData, authorId: currentUser.uid, authorName: currentUser.displayName, createdAt: Timestamp.now(),
                    likes: [], bookmarks: [], commentCount: 0,
                });
            }
            goBack();
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
                <button onClick={goBack} className="p-2 -ml-2"><ArrowLeft /></button>
                <h2 className="text-lg font-bold mx-auto">{pageTitle}</h2>
                <button onClick={handleSubmit} disabled={isSubmitting} className="text-lg font-bold text-[#00462A] disabled:text-gray-400">
                    {isSubmitting ? '등록 중...' : '완료'}
                </button>
            </div>
            <div className="p-4 space-y-4">
                <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {categories.map(cat => ( <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${category === cat ? `${getCategoryStyle(cat).bgStrong} text-white` : 'bg-gray-200 text-gray-700'}`}>{cat}</button>))}
                </div>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="제목" className="w-full text-xl p-2 border-b-2 focus:outline-none focus:border-[#00462A]" />
                <textarea value={content} onChange={(e) => setContent(e.target.value)} placeholder="내용을 입력하세요..." className="w-full h-64 p-2 focus:outline-none resize-none" />
                <div className="border-t pt-4">
                    <label htmlFor="image-upload-post" className="cursor-pointer flex items-center gap-2 text-gray-600 hover:text-[#00462A]"><ImageUp size={20} /><span>사진 추가</span></label>
                    <input id="image-upload-post" type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                    {imagePreview && ( <div className="mt-4 relative w-32 h-32"> <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-lg" /> <button onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1"><X size={14} /></button> </div> )}
                </div>
            </div>
        </div>
    );
};

const BoardPage = ({ posts, setCurrentPage, currentUser }) => {
    const [filter, setFilter] = useState('전체');
    const categories = ['전체', '일상', '친목', '10대', '청년', '중년', '부안맘', '질문'];
    const filteredPosts = filter === '전체' ? posts : posts.filter(p => p.category === filter);

    return (
        <div className="p-4">
            <div className="flex space-x-2 mb-4 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {categories.map(cat => ( <button key={cat} onClick={() => setFilter(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${filter === cat ? 'bg-[#00462A] text-white' : 'bg-gray-200 text-gray-700'}`}>{cat}</button> ))}
            </div>
            <div className="space-y-3">
                 {filteredPosts.length > 0 ? (
                    filteredPosts.map(post => (
                        <div key={post.id} onClick={() => setCurrentPage('postDetail', post.id)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-xs font-bold ${getCategoryStyle(post.category).text} ${getCategoryStyle(post.category).bg} px-2 py-1 rounded-md`}>{post.category}</span>
                                <h3 className="font-bold text-md truncate flex-1">{post.title}</h3>
                            </div>
                            <p className="text-gray-600 text-sm mb-3 truncate">{post.content}</p>
                            <div className="flex justify-between items-center text-xs text-gray-500">
                               <div>
                                    <span className="font-semibold">{post.authorName}</span>
                                    <span className="mx-1">·</span>
                                    <span>{timeSince(post.createdAt)}</span>
                               </div>
                               <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1"><Heart size={14} className={post.likes?.includes(currentUser.uid) ? 'text-red-500 fill-current' : 'text-gray-400'} /><span>{post.likes?.length || 0}</span></div>
                                    <div className="flex items-center gap-1"><MessageCircle size={14} className="text-gray-400"/><span>{post.commentCount || 0}</span></div>
                               </div>
                            </div>
                        </div>
                    ))
                ) : ( <p className="text-center text-gray-500 py-10">해당 카테고리에 글이 없습니다.</p> )}
            </div>
             <button onClick={() => setCurrentPage('write')} className="fixed bottom-24 right-5 bg-[#00462A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[#003a22] transition-transform transform hover:scale-110">
                <PlusCircle size={28} />
            </button>
        </div>
    );
};

const PostDetailPage = ({ postId, setCurrentPage, currentUser, goBack }) => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!postId) { goBack(); return; }
        const postRef = doc(db, 'posts', postId);
        const unsubscribePost = onSnapshot(postRef, (doc) => {
            if (doc.exists()) { setPost({ id: doc.id, ...doc.data() }); }
            else { alert("삭제된 게시글입니다."); goBack(); }
            setLoading(false);
        });
        return () => unsubscribePost();
    }, [postId, goBack]);

    const handleDelete = async (postId, imagePath) => {
        if (!post || post.authorId !== currentUser.uid) return;
        if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
            try {
                if (imagePath) { await deleteObject(ref(storage, imagePath)); }
                await deleteDoc(doc(db, 'posts', postId));
                alert("게시글이 삭제되었습니다."); goBack();
            } catch (error) {
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };

    if (loading) return <LoadingSpinner />;
    if (!post || !currentUser) return null;

    const isAuthor = post.authorId === currentUser.uid;

    return (
        <div className="p-4 pb-20">
            <div className="mb-4 pb-4 border-b">
                <span className={`text-xs font-bold ${getCategoryStyle(post.category).text} ${getCategoryStyle(post.category).bg} px-2 py-1 rounded-md mb-2 inline-block`}>{post.category}</span>
                <div className="flex justify-between items-start mt-2">
                    <h1 className="text-2xl font-bold flex-1 pr-4">{post.title}</h1>
                    {isAuthor && (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setCurrentPage('editPost', post)} className="p-1 text-gray-500 hover:text-blue-600"><Pencil size={20} /></button>
                            <button onClick={() => handleDelete(post.id, post.imagePath)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={20} /></button>
                        </div>
                    )}
                </div>
                <div className="flex items-center text-sm text-gray-500 mt-4">
                    <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                    <span className="font-semibold">{post.authorName}</span>
                    <span className="mx-2">·</span>
                    <span>{timeSince(post.createdAt)}</span>
                </div>
                {post.imageUrl && ( <div className="my-4"><img src={post.imageUrl} alt="Post" className="w-full h-auto rounded-lg object-cover" /></div> )}
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap mt-4">{post.content}</p>
            </div>
        </div>
    );
};

const BottomNav = ({ currentPage, setCurrentPage }) => {
    const navItems = [
        { id: 'home', icon: Home, label: '홈' }, 
        { id: 'board', icon: LayoutGrid, label: '게시판' },
        { id: 'news', icon: Newspaper, label: '소식' },
        { id: 'clubs', icon: Users, label: '클럽' },
        { id: 'benefits', icon: TicketPercent, label: '혜택' },
    ];
    return (
        <footer className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto z-20">
            <div className="bg-white px-3 pt-2 pb-3 border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.05)]">
                <div className="flex justify-around items-center">
                    {navItems.map(item => {
                        const isActive = currentPage === item.id;
                        const IconComponent = item.icon;
                        return (
                            <a href="#" key={item.id} onClick={(e) => { e.preventDefault(); setCurrentPage(item.id); }} className="text-center p-2 rounded-lg w-1/5">
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

// =================================================================
// ▼▼▼ 메인 App 컴포넌트 ▼▼▼
// =================================================================
export default function App() {
    const [page, setPage] = useState('home');
    const [pageHistory, setPageHistory] = useState([{page: 'home', param: null}]);
    const [pageParam, setPageParam] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [posts, setPosts] = useState([]);
    const [buanNews, setBuanNews] = useState([]);
    const [followingPosts, setFollowingPosts] = useState([]);
    const [userEvents, setUserEvents] = useState({});

    // Auth 상태 리스너
    useEffect(() => {
        const authUnsubscribe = onAuthStateChanged(auth, user => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userDocUnsubscribe = onSnapshot(userRef, (userSnap) => {
                    setCurrentUser({ ...user, ...(userSnap.exists() ? userSnap.data() : {}) });
                    if(loading) setLoading(false);
                }, () => setLoading(false));
                return () => userDocUnsubscribe();
            } else {
                setCurrentUser(null); setLoading(false);
            }
        });
        return () => authUnsubscribe();
    }, [loading]);

    // Firestore 데이터 리스너
    useEffect(() => {
        if (!currentUser) return;

        const unsubNews = onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc")), (snapshot) => {
            setBuanNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });

        const unsubPosts = onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50)), (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        });
        
        let unsubFollowing = () => {};
        if (currentUser.following && currentUser.following.length > 0) {
           unsubFollowing = onSnapshot(query(collection(db, "posts"), where('authorId', 'in', currentUser.following), orderBy("createdAt", "desc"), limit(20)), (snapshot) => {
               setFollowingPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
           });
        } else {
            setFollowingPosts([]);
        }
        
        return () => { unsubNews(); unsubPosts(); unsubFollowing(); };
    }, [currentUser]);

    const handleDeleteNews = async (newsId, imagePath) => {
        if(!currentUser || currentUser.uid !== ADMIN_UID) return;
        if (window.confirm("정말로 이 소식을 삭제하시겠습니까?")) {
            try {
                if (imagePath) { await deleteObject(ref(storage, imagePath)); }
                await deleteDoc(doc(db, 'news', newsId));
                alert("소식이 삭제되었습니다.");
            } catch (error) {
                alert(`소식 삭제 중 오류: ${error.message}`);
            }
        }
    };

    const setCurrentPage = (pageName, param = null) => {
        if (['clubs', 'benefits'].includes(pageName)) {
            alert('서비스 준비중입니다.');
            return;
        }
        setPageHistory(prev => [...prev, {page: pageName, param: param}]);
        setPage(pageName); setPageParam(param);
    };

    const goBack = useCallback(() => {
        const newHistory = pageHistory.slice(0, -1);
        if (newHistory.length > 0) {
            const lastPage = newHistory[newHistory.length - 1];
            setPage(lastPage.page || 'home'); setPageParam(lastPage.param || null); setPageHistory(newHistory);
        } else {
            setPage('home'); setPageParam(null); setPageHistory([{page: 'home', param: null}]);
        }
    }, [pageHistory]);

    const renderHeader = () => {
        const isMainPage = page === 'home';
        const titleMap = { 'home': '마을엔 부안', 'news': '소식', 'board': '게시판', 'postDetail': '게시글', 'userProfile': '프로필', 'calendar': '달력' };
        const title = titleMap[page] || "";

        const hideHeaderOn = ['write', 'writeNews', 'editPost', 'editNews'];
        if (hideHeaderOn.includes(page)) return null;

        return (
             <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                <div className="flex items-center gap-2 flex-1">
                    {isMainPage ? ( <Logo size={28} /> ) : ( <button onClick={goBack} className="p-1 -ml-2"><ArrowLeft size={24} /></button> )}
                    <h1 className="text-xl font-bold text-gray-800 truncate">{title}</h1>
                </div>
                <div className="flex items-center gap-3">
                     {currentUser && <button onClick={() => setCurrentPage('userProfile', currentUser.uid)} className="w-8 h-8 rounded-full bg-pink-200 flex items-center justify-center font-bold text-pink-700">{currentUser.displayName?.charAt(0) || '?'}</button>}
                </div>
            </header>
        );
    };

    const renderPage = () => {
        if (!currentUser) return <LoadingSpinner />;

        switch (page) {
            case 'home': return <HomePage {...{ setCurrentPage, posts, buanNews, currentUser, handleDeleteNews, followingPosts, userEvents }} />;
            case 'news': return <NewsPage {...{ buanNews, currentUser, setCurrentPage, handleDeleteNews }} />;
            case 'board': return <BoardPage {...{ posts, setCurrentPage, currentUser }} />;
            case 'postDetail': return <PostDetailPage {...{ postId: pageParam, setCurrentPage, currentUser, goBack }} />;
            case 'write': return <WritePage {...{ goBack, currentUser }} />;
            case 'editPost': return <WritePage {...{ goBack, currentUser }} itemToEdit={pageParam} />;
            case 'writeNews': return <NewsWritePage {...{ goBack, currentUser }} />;
            case 'editNews': return <NewsWritePage {...{ goBack, currentUser }} itemToEdit={pageParam} />;
            default: return <HomePage {...{ setCurrentPage, posts, buanNews, currentUser, handleDeleteNews, followingPosts, userEvents }} />;
        }
    };

    if (loading) return <div className="max-w-sm mx-auto bg-white shadow-lg min-h-screen"><LoadingSpinner /></div>;
    if (!currentUser) return <AuthPage />;

    const showNav = !['write', 'writeNews', 'editPost', 'editNews'].includes(page);

    return (
        <div className="max-w-sm mx-auto bg-gray-50 shadow-lg min-h-screen font-sans text-gray-800">
            {renderHeader()}
            <main className="bg-white" style={{paddingBottom: showNav ? '80px' : '0', minHeight: 'calc(100vh - 60px)'}}>
                {renderPage()}
            </main>
            {showNav && <BottomNav currentPage={page} setCurrentPage={setCurrentPage} />}
        </div>
    );
}