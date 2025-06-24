import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
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
import { Home, Newspaper, LayoutGrid, Users, TicketPercent, ArrowLeft, Heart, MessageCircle, Send, PlusCircle, ChevronLeft, ChevronRight, X, Search, Bell, Star, Pencil, LogOut, Edit, MessageSquare, Trash2, ImageUp, UserCircle, Lock, Edit2 } from 'lucide-react';


// ★ 관리자 UID 지정
const ADMIN_UID = 'wvXNcSqXMsaiqOCgBvU7A4pJoFv1';

// --- Firebase 설정 ---
const firebaseConfig = {
    apiKey: "AIzaSyAd7ns6wCL72P7X5_qZxX23sBxdkMhWAeg",
    authDomain: "maeulbung.firebaseapp.com",
    projectId: "maeulbung",
    storageBucket: "maeulbung.firebasestorage.app", 
    messagingSenderId: "463888320744",
    appId: "1:463888320744:web:0f773fed3428d36895a15d",
    measurementId: "G-WNRFBZX0HE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- 인증 Context ---
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                const userRef = doc(db, "users", user.uid);
                const userUnsubscribe = onSnapshot(userRef, (userSnap) => {
                    const userData = userSnap.exists() ? userSnap.data() : {};
                    const finalUser = { ...user, ...userData, photoURL: userData.photoURL || user.photoURL };
                    setCurrentUser(finalUser);
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

    return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};


// --- 로고, 헬퍼, 공용 컴포넌트 ---
const Logo = ({ size = 28 }) => (
    <img src="https://lh3.googleusercontent.com/d/1gkkNelRAltEEfKv9V4aOScws7MS28IUn" alt="Logo" width={size} height={size} style={{ objectFit: 'contain' }}/>
);
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
const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
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
const NewsCard = ({ news, isAdmin, openDetailModal, setCurrentPage, handleDeleteNews, handleLikeNews, isLiked }) => {
    return (
        <div className="flex-shrink-0 w-full rounded-xl shadow-lg overflow-hidden group bg-gray-200 flex flex-col relative">
            {news.imageUrl && <img src={news.imageUrl} alt={news.title} className="w-full h-48 object-cover" onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/600x400/eeeeee/333333?text=Image' }} />}
            {isAdmin && (
                <div className="absolute top-2 left-2 flex gap-2 z-10">
                    <button onClick={() => setCurrentPage('editNews', news)} className="bg-white/70 p-1.5 rounded-full text-blue-600 shadow"><Pencil size={20} /></button>
                    <button onClick={() => handleDeleteNews(news.id, news.imagePath)} className="bg-white/70 p-1.5 rounded-full text-red-600 shadow"><Trash2 size={20} /></button>
                </div>
            )}
             <button onClick={() => handleLikeNews(news)} className="absolute top-2 right-2 bg-white/70 p-1.5 rounded-full">
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
                    displayName: nickname, email: user.email, createdAt: Timestamp.now(), followers: [], following: [], likedNews: []
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

const HomePage = ({ setCurrentPage, posts, buanNews, handleDeleteNews, handleLikeNews, likedNews, followingPosts, userEvents }) => {
    const { currentUser } = useAuth();
    const popularPosts = [...posts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 3);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const isAdmin = currentUser.uid === ADMIN_UID;

    const openDetailModal = (news) => { setSelectedNews(news); setDetailModalOpen(true); };

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
                    <h2 className="text-lg font-bold">지금 부안에서는</h2>
                    <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('news'); }} className="text-sm font-medium text-gray-500 hover:text-gray-800">더 보기 <ChevronRight className="inline-block" size={14} /></a>
                </div>
                <div className="flex overflow-x-auto gap-4 pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {buanNews.length > 0 ? (
                        buanNews.map((news) => (
                            <div key={news.id} className="w-4/5 md:w-3/5 flex-shrink-0">
                                <NewsCard {...{news, isAdmin, openDetailModal, setCurrentPage, handleDeleteNews, handleLikeNews, isLiked: likedNews.includes(news.id)}} />
                            </div>
                        ))
                    ) : (
                         <div className="text-center text-gray-500 w-full p-8 bg-gray-100 rounded-lg">아직 등록된 소식이 없습니다.</div>
                    )}
                </div>
            </section>

            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold">부안 달력</h2>
                    <a href="#" onClick={(e) => {e.preventDefault(); setCurrentPage('calendar');}} className="text-sm font-medium text-gray-500 hover:text-gray-800">자세히 <ChevronRight className="inline-block" size={14} /></a>
                </div>
                <Calendar events={userEvents} onDateClick={(date) => setCurrentPage('calendar', { date })}/>
            </section>

            <section>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold">지금 인기있는 글</h2>
                    <a href="#" onClick={(e) => { e.preventDefault(); setCurrentPage('board'); }} className="text-sm font-medium text-gray-500 hover:text-gray-800">더 보기 <ChevronRight className="inline-block" size={14} /></a>
                </div>
                <div className="space-y-3">
                    {popularPosts.length > 0 ? (popularPosts.map(post => {
                        const style = getCategoryStyle(post.category);
                        return (
                            <div key={post.id} onClick={() => setCurrentPage('postDetail', post.id)} className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3 cursor-pointer">
                                <span className={`text-xs font-bold ${style.text} ${style.bg} px-2 py-1 rounded-md`}>{post.category}</span>
                                <p className="truncate flex-1">{post.title}</p>
                                <div className="flex items-center text-xs text-gray-400 gap-2">
                                    <Heart size={14} className="text-red-400"/>
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
                    })) : (<p className="text-center text-gray-500 py-4">팔로우하는 사용자의 글이 없습니다.</p>)}
                </div>
            </section>
        </div>
    );
};


const NewsPage = ({ buanNews, setCurrentPage, handleDeleteNews, handleLikeNews, likedNews }) => {
    const { currentUser } = useAuth();
    const isAdmin = currentUser.uid === ADMIN_UID;
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedNews, setSelectedNews] = useState(null);
    const [activeTag, setActiveTag] = useState('전체');
    const tags = ['전체', '교육', '문화', '청년', '농업', '안전', '운동', '행사', '복지'];
    const filteredNews = activeTag === '전체'
        ? buanNews
        : buanNews.filter(news => news.tags && news.tags.includes(activeTag));
    const openDetailModal = (news) => { setSelectedNews(news); setDetailModalOpen(true); };

    return (
        <div className="p-4">
            {isAdmin && (
                <button onClick={() => setCurrentPage('writeNews')} className="w-full mb-4 bg-[#00462A] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#003a22] transition-colors shadow-lg flex items-center justify-center gap-2">
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
                        <NewsCard key={news.id} {...{news, isAdmin, openDetailModal, setCurrentPage, handleDeleteNews, handleLikeNews, isLiked: likedNews.includes(news.id)}} />
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

const NewsWritePage = ({ goBack, itemToEdit }) => {
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
                applyUrl
            };

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

const CalendarPage = ({ userEvents, pageParam }) => {
    const { currentUser } = useAuth();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [eventTitle, setEventTitle] = useState('');

    useEffect(() => {
        if(pageParam?.date) {
            setSelectedDate(pageParam.date);
            setIsModalOpen(true);
        }
    }, [pageParam]);

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

const BoardPage = ({ setCurrentPage }) => {
    const { currentUser } = useAuth();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('전체');
    const categories = ['전체', '일상', '친목', '10대', '청년', '중년', '부안맘', '질문'];

    useEffect(() => {
        setLoading(true);
        let q;
        const postsCollection = collection(db, "posts");

        if (filter === '전체') {
            q = query(postsCollection, orderBy("createdAt", "desc"), limit(50));
        } else {
            q = query(postsCollection, where("category", "==", filter), orderBy("createdAt", "desc"), limit(50));
        }

        const unsubscribe = onSnapshot(q, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        }, (error) => {
            console.error("Error fetching posts: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [filter]);

    return (
        <div className="p-4">
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
            {loading ? <LoadingSpinner /> : (
                <div className="space-y-3">
                    {posts.length > 0 ? (
                        posts.map(post => {
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
            )}
             <button
                onClick={() => setCurrentPage('write')}
                className="fixed bottom-24 right-5 bg-[#00462A] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-[#003a22] transition-transform transform hover:scale-110">
                <PlusCircle size={28} />
            </button>
        </div>
    );
};

const WritePage = ({ goBack, itemToEdit }) => {
    const { currentUser } = useAuth();
    const [title, setTitle] = useState(itemToEdit?.title || '');
    const [content, setContent] = useState(itemToEdit?.content || '');
    const [category, setCategory] = useState(itemToEdit?.category || '일상');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(itemToEdit?.imageUrl || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const categories = ['일상', '친목', '10대', '청년', '중년', '부안맘', '질문'];

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

            const postData = {
                title,
                content,
                category,
                imageUrl,
                imagePath,
                updatedAt: Timestamp.now()
            };

            if (itemToEdit) {
                await updateDoc(doc(db, 'posts', itemToEdit.id), postData);
            } else {
                await addDoc(collection(db, 'posts'), {
                    ...postData,
                    authorId: currentUser.uid,
                    authorName: currentUser.displayName,
                    createdAt: Timestamp.now(),
                    likes: [],
                    bookmarks: [],
                    commentCount: 0,
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
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setCategory(cat)} className={`px-4 py-1.5 text-sm font-semibold rounded-full whitespace-nowrap transition-colors ${category === cat ? `${getCategoryStyle(cat).bgStrong} text-white` : 'bg-gray-200 text-gray-700'}`}>{cat}</button>
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

const PostDetailPage = ({ postId, setCurrentPage, goBack }) => {
    const { currentUser } = useAuth();
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!postId) {
            goBack();
            return;
        }
        const postRef = doc(db, `posts`, postId);
        const unsubscribePost = onSnapshot(postRef, (doc) => {
            if (doc.exists()) {
                setPost({ id: doc.id, ...doc.data() });
            } else {
                alert("삭제된 게시글입니다.");
                goBack();
            }
            setLoading(false);
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
    }, [postId, goBack]);

    const handleLike = async () => {
        if (!post || !currentUser) return;
        const postRef = doc(db, 'posts', postId);
        
        try {
            const postSnap = await getDoc(postRef);
            if (!postSnap.exists()) {
                console.log("문서가 존재하지 않습니다.");
                return;
            }
            const currentLikes = postSnap.data().likes || [];
            const liked = currentLikes.includes(currentUser.uid);

            await updateDoc(postRef, {
                likes: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
            });
        } catch (e) {
            console.error("Error updating like: ", e);
        }
    };

    const handleBookmark = async () => {
        if (!post || !currentUser) return;
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) return;
        
        const currentBookmarks = postSnap.data().bookmarks || [];
        const bookmarked = currentBookmarks.includes(currentUser.uid);
        try {
            await updateDoc(postRef, {
                bookmarks: bookmarked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
            });
        } catch(e) {
            console.error("Error updating bookmark:", e);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!newComment.trim() || !currentUser) return;
        try {
            await addDoc(collection(db, `posts/${postId}/comments`), {
                text: newComment.trim(),
                authorId: currentUser.uid,
                authorName: currentUser.displayName,
                createdAt: Timestamp.now(),
                likes: []
            });
            await updateDoc(doc(db, 'posts', postId), { commentCount: increment(1) });
            setNewComment('');
        } catch (error) {
            console.error("Error adding comment: ", error);
        }
    };

    const handleCommentLike = async (commentId, currentLikes = []) => {
        if (!currentUser) return;
        const commentRef = doc(db, `posts/${postId}/comments`, commentId);
        const liked = currentLikes.includes(currentUser.uid);
        try {
            await updateDoc(commentRef, {
                likes: liked ? arrayRemove(currentUser.uid) : arrayUnion(currentUser.uid)
            });
        } catch(e) {
            console.error("Error liking comment:", e);
        }
    };

    const handleDelete = async (postId, imagePath) => {
        if (!post || post.authorId !== currentUser.uid) return;
        if (window.confirm("정말로 이 게시글을 삭제하시겠습니까?")) {
            try {
                const commentsRef = collection(db, 'posts', postId, 'comments');
                const commentsSnap = await getDocs(commentsRef);
                const deletePromises = commentsSnap.docs.map(doc => deleteDoc(doc.ref));
                await Promise.all(deletePromises);
                
                if (imagePath) {
                    await deleteObject(ref(storage, imagePath));
                }

                await deleteDoc(doc(db, 'posts', postId));
                
                alert("게시글이 삭제되었습니다.");
                goBack();
            } catch (error) {
                console.error("Error deleting post:", error)
                alert("삭제 중 오류가 발생했습니다.");
            }
        }
    };


    if (loading) return <LoadingSpinner />;
    if (!post) return null;

    const isAuthor = post.authorId === currentUser.uid;
    const isLiked = post.likes?.includes(currentUser.uid);
    const isBookmarked = post.bookmarks?.includes(currentUser.uid);
    const style = getCategoryStyle(post.category);

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
                                    <button onClick={() => setCurrentPage('editPost', post)} className="p-1 text-gray-500 hover:text-blue-600"><Pencil size={20} /></button>
                                    <button onClick={() => handleDelete(post.id, post.imagePath)} className="p-1 text-gray-500 hover:text-red-600"><Trash2 size={20} /></button>
                                </>
                            )}
                            <button onClick={handleBookmark} className="p-1 -mr-1">
                                <Star size={22} className={isBookmarked ? "text-yellow-400 fill-current" : "text-gray-400"} />
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 mt-4">
                        <div className="w-8 h-8 rounded-full bg-gray-200 mr-2"></div>
                        <span onClick={() => setCurrentPage('userProfile', post.authorId)} className="font-semibold cursor-pointer hover:underline">{post.authorName}</span>
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

const ProfileEditPage = ({ goBack }) => {
    const { currentUser } = useAuth();
    const [bio, setBio] = useState(currentUser?.bio || '');
    const [town, setTown] = useState(currentUser?.town || '부안읍');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(currentUser?.photoURL || null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const towns = ["부안읍", "행안면", "백산면", "주산면", "하서면", "상서면", "동진면", "계화면", "보안면", "줄포면", "진서면", "변산면", "위도면"];

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
            goBack();

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
                <button onClick={goBack} className="p-2 -ml-2"><ArrowLeft /></button>
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
                        <label htmlFor="town" className="block text-sm font-medium text-gray-700 mb-1">동네 선택</label>
                        <select id="town" value={town} onChange={(e) => setTown(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00462A]">
                            {towns.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserProfilePage = ({ userId, setCurrentPage }) => {
    const { currentUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [isFollowing, setIsFollowing] = useState(false);

    useEffect(() => {
        if (!userId) return;

        const userRef = doc(db, 'users', userId);
        const unsubscribeUser = onSnapshot(userRef, (doc) => {
            if(doc.exists()){
                const userData = doc.data();
                setProfileUser({...userData, id: doc.id, uid: doc.id, photoURL: userData.photoURL || null});
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
                    <p className="text-xs text-gray-500 mt-1">{profileUser.town || '동네를 설정해주세요.'}</p>
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
                        <button onClick={() => setCurrentPage('editProfile')} className="flex-1 p-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 flex items-center justify-center gap-1">
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
                        <button onClick={handleMessage} className="flex-1 px-4 py-2 text-sm font-semibold rounded-lg bg-blue-500 text-white flex items-center justify-center gap-1">
                             <MessageSquare size={16} /> 메시지
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

const SearchPage = ({ setCurrentPage }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            const postsRef = collection(db, 'posts');
            const q = query(postsRef, 
                where('title', '>=', searchTerm),
                where('title', '<=', searchTerm + '\uf8ff')
            );
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
                    placeholder="검색어를 입력하세요..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#00462A]" />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <button onClick={handleSearch} className="px-4 py-2 bg-[#00462A] text-white rounded-full font-semibold">검색</button>
            </div>
            {loading ? <LoadingSpinner /> : (
                <div className="space-y-3">
                    {results.length === 0 && searchTerm && ( <p className="text-center text-gray-500 py-10">검색 결과가 없습니다.</p> )}
                    {results.map(post => (
                        <div key={post.id} onClick={() => setCurrentPage('postDetail', post.id)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer">
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

const ChatListPage = ({ chats, setCurrentPage }) => {
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">채팅 목록</h2>
            <div className="space-y-3">
                {chats.length > 0 ? chats.map(chat => (
                    <div key={chat.id} onClick={() => setCurrentPage('chatPage', { recipientId: chat.otherUser.uid, recipientName: chat.otherUser.displayName })}
                        className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0"></div>
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

const ChatPage = ({ pageParam }) => {
    const { currentUser } = useAuth();
    const { recipientId } = pageParam;
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

const ClubListPage = ({ setCurrentPage }) => {
    const [clubs, setClubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [passwordModalOpen, setPasswordModalOpen] = useState(false);
    const [selectedClub, setSelectedClub] = useState(null);
    const [password, setPassword] = useState('');
    const { currentUser } = useAuth();

    useEffect(() => {
        const q = query(collection(db, "clubs"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            setClubs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const handleClubClick = (club) => {
        if (!club.password) {
            setCurrentPage('clubDetail', { clubId: club.id });
            return;
        }
        
        if (club.members && club.members.includes(currentUser.uid)) {
            setCurrentPage('clubDetail', { clubId: club.id });
            return;
        }

        setSelectedClub(club);
        setPasswordModalOpen(true);
    };

    const handlePasswordSubmit = async () => {
        if (password === selectedClub.password) {
            const clubRef = doc(db, 'clubs', selectedClub.id);
            await updateDoc(clubRef, {
                members: arrayUnion(currentUser.uid)
            });
            setPasswordModalOpen(false);
            setPassword('');
            setCurrentPage('clubDetail', { clubId: selectedClub.id });
        } else {
            alert('비밀번호가 일치하지 않습니다.');
        }
    };

    if (loading) return <LoadingSpinner />;

    return (
        <div className="p-4">
            <Modal isOpen={passwordModalOpen} onClose={() => setPasswordModalOpen(false)}>
                <h3 className="text-lg font-bold mb-4">{selectedClub?.name}</h3>
                <p className="mb-4">이 모임은 비밀번호가 필요합니다.</p>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" className="w-full p-2 border rounded mb-4"/>
                <button onClick={handlePasswordSubmit} className="w-full bg-[#00462A] text-white py-2 rounded">입장하기</button>
            </Modal>

            <button onClick={() => setCurrentPage('clubCreate')} className="w-full mb-4 bg-[#00462A] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#003a22] transition-colors shadow-lg flex items-center justify-center gap-2">
                <PlusCircle size={20} /> 모임 만들기
            </button>
            <div className="space-y-3">
                {clubs.map(club => (
                    <div key={club.id} onClick={() => handleClubClick(club)} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer flex items-center gap-4">
                        <img src={club.photoURL} alt={club.name} className="w-16 h-16 rounded-lg object-cover bg-gray-200" />
                        <div className="flex-1">
                            <h3 className="font-bold text-lg">{club.name}</h3>
                            <p className="text-sm text-gray-500 truncate">{club.description}</p>
                            <div className="text-xs text-gray-400 mt-1 flex items-center">
                                {club.password && <Lock size={12} className="mr-1" />}
                                <span>멤버 {club.members?.length || 1}명</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ClubCreatePage = ({ goBack }) => {
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
            goBack();
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
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    return (
        <div>
            <div className="p-4 flex items-center border-b">
                <button onClick={goBack} className="p-2 -ml-2"><ArrowLeft /></button>
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
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="모임 이름" className="w-full p-2 border-b-2"/>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="모임 소개" className="w-full p-2 border-b-2 h-24"/>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="카테고리 (예: 등산, 독서)" className="w-full p-2 border-b-2"/>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호 (없으면 비공개)" className="w-full p-2 border-b-2"/>
            </div>
        </div>
    );
};

const ClubDetailPage = ({ pageParam, setCurrentPage, goBack }) => {
    const { clubId } = pageParam;
    const [club, setClub] = useState(null);
    const [members, setMembers] = useState([]);
    const [posts, setPosts] = useState([]);
    const { currentUser } = useAuth();
    
    useEffect(() => {
        const clubRef = doc(db, 'clubs', clubId);
        const unsubscribeClub = onSnapshot(clubRef, (doc) => {
            if (doc.exists()) {
                const clubData = { id: doc.id, ...doc.data() };
                setClub(clubData);
                fetchMembers(clubData.members);
            } else {
                goBack();
            }
        });

        const postsQuery = query(collection(db, 'clubs', clubId, 'club_posts'), orderBy('createdAt', 'desc'), limit(5));
        const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
            setPosts(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
        });

        const fetchMembers = async (memberIds) => {
            if (!memberIds || memberIds.length === 0) return;
            const memberPromises = memberIds.map(id => getDoc(doc(db, 'users', id)));
            const memberDocs = await Promise.all(memberPromises);
            setMembers(memberDocs.map(doc => doc.exists() ? {id: doc.id, ...doc.data()} : null).filter(Boolean));
        };

        return () => {
            unsubscribeClub();
            unsubscribePosts();
        };
    }, [clubId, goBack]);

    if (!club) return <LoadingSpinner />;
    const isCreator = currentUser.uid === club.creatorId;

    return (
        <div>
             <div className="relative">
                <img src={club.photoURL} className="w-full h-48 object-cover"/>
                <div className="absolute inset-0 bg-black/30"></div>
                <div className="absolute top-4 left-4"><button onClick={goBack} className="text-white bg-black/30 p-2 rounded-full"><ArrowLeft/></button></div>
                {isCreator && <div className="absolute top-4 right-4"><button onClick={() => alert('수정기능 준비중')} className="text-white bg-black/30 p-2 rounded-full"><Edit2/></button></div>}
                <div className="absolute bottom-4 left-4 text-white">
                    <h2 className="text-2xl font-bold">{club.name}</h2>
                    <p className="text-sm">{club.description}</p>
                </div>
            </div>
            <div className="p-4">
                <section className="mb-6">
                     <div className="flex justify-between items-center mb-3">
                        <h3 className="text-lg font-bold">게시글</h3>
                        <a href="#" onClick={(e) => { e.preventDefault(); alert("준비중입니다.") }} className="text-sm font-medium text-gray-500">더 보기 <ChevronRight className="inline-block" size={14}/></a>
                    </div>
                </section>
                <section>
                    <h3 className="text-lg font-bold mb-3">멤버 ({members.length})</h3>
                    <div className="space-y-2">
                        {members.map(member => (
                            <div key={member.id} onClick={() => setCurrentPage('userProfile', member.id)} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 cursor-pointer">
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

// --- 네비게이션 ---
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
                        const isActive = currentPage === item.id || (item.id === 'clubs' && currentPage.startsWith('club'));
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
function AppContent() {
    const { currentUser } = useAuth();
    const [page, setPage] = useState('home');
    const [pageHistory, setPageHistory] = useState([{page: 'home', param: null}]);
    const [pageParam, setPageParam] = useState(null);
    
    const [posts, setPosts] = useState([]);
    const [buanNews, setBuanNews] = useState([]);
    const [followingPosts, setFollowingPosts] = useState([]);
    const [userEvents, setUserEvents] = useState({});
    const [chats, setChats] = useState([]);
    const [likedNews, setLikedNews] = useState([]);
    
    useEffect(() => {
        if (!currentUser?.uid) {
            setPosts([]); setFollowingPosts([]); setUserEvents({}); setChats([]); setBuanNews([]);
            return;
        }

        const unsubscribes = [];
        setLikedNews(currentUser.likedNews || []);
        unsubscribes.push(onSnapshot(query(collection(db, "news"), orderBy("createdAt", "desc")), (snapshot) => setBuanNews(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))) );
        unsubscribes.push(onSnapshot(query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(50)), (snapshot) => setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))) );
        unsubscribes.push(onSnapshot(query(collection(db, `users/${currentUser.uid}/events`)), (snapshot) => {
            const eventsData = {};
            snapshot.docs.forEach(doc => {
                const event = { id: doc.id, ...doc.data() };
                if (!eventsData[event.date]) eventsData[event.date] = [];
                eventsData[event.date].push(event);
            });
            setUserEvents(eventsData);
        }));
        unsubscribes.push(onSnapshot(query(collection(db, 'chats'), where('members', 'array-contains', currentUser.uid)), async (snapshot) => {
            const chatsData = await Promise.all(snapshot.docs.map(async (docSnap) => {
                const chatData = docSnap.data();
                const otherMemberId = chatData.members.find(id => id !== currentUser.uid);
                if (!otherMemberId) return null;
                const userDoc = await getDoc(doc(db, 'users', otherMemberId));
                return { id: docSnap.id, ...chatData, otherUser: userDoc.exists() ? {uid: userDoc.id, ...userDoc.data()} : { displayName: '알 수 없음', uid: otherMemberId }, };
            }));
            setChats(chatsData.filter(Boolean));
        }));
        if (currentUser.following?.length > 0) {
            unsubscribes.push(onSnapshot(query(collection(db, "posts"), where('authorId', 'in', currentUser.following.slice(0, 10)), orderBy("createdAt", "desc"), limit(30)), (snapshot) => {
                setFollowingPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            }));
        } else {
             setFollowingPosts([]);
        }

        return () => unsubscribes.forEach(unsub => unsub());
    }, [currentUser]);

    const handleLikeNews = async (newsItem) => {
        if (!currentUser) return;
        
        const userRef = doc(db, 'users', currentUser.uid);
        const eventsRef = collection(db, 'users', currentUser.uid, 'events');
        
        try {
            const userSnap = await getDoc(userRef);
            const currentLikedNews = userSnap.data()?.likedNews || [];
            const isLiked = currentLikedNews.includes(newsItem.id);

            if (isLiked) {
                await updateDoc(userRef, { likedNews: arrayRemove(newsItem.id) });
                const q = query(eventsRef, where("newsId", "==", newsItem.id));
                const querySnapshot = await getDocs(q);
                querySnapshot.forEach(async (docSnap) => {
                    await deleteDoc(docSnap.ref);
                });
            } else {
                await updateDoc(userRef, { likedNews: arrayUnion(newsItem.id) });
                if (newsItem.date) {
                    await addDoc(eventsRef, {
                        title: newsItem.title,
                        date: newsItem.date,
                        createdAt: Timestamp.now(),
                        type: 'news',
                        newsId: newsItem.id
                    });
                }
            }
        } catch (error) {
            console.error("Error liking news:", error);
        }
    };
    
    const handleDeleteNews = async (newsId, imagePath) => {
        if(!currentUser || currentUser.uid !== ADMIN_UID) return;
        if (window.confirm("정말로 이 소식을 삭제하시겠습니까?")) {
            try {
                if (imagePath) await deleteObject(ref(storage, imagePath));
                await deleteDoc(doc(db, 'news', newsId));
                alert("소식이 삭제되었습니다.");
            } catch (error) { alert(`소식 삭제 중 오류: ${error.message}`); }
        }
    };

    const setCurrentPage = (pageName, param = null) => {
        if (['benefits'].includes(pageName)) {
            alert('서비스 준비중입니다.');
            return;
        }
        const newPage = pageName === 'clubs' ? 'clubList' : pageName;
        setPage(newPage);
        setPageParam(param);
        setPageHistory(prev => [...prev, {page: newPage, param: param}]);
    };
    
    const goBack = useCallback(() => {
        setPageHistory(prevHistory => {
            if (prevHistory.length <= 1) {
                 setPage('home');
                 setPageParam(null);
                 return [{page: 'home', param: null}];
            }
            const newHistory = prevHistory.slice(0, prevHistory.length - 1);
            const lastPage = newHistory[newHistory.length - 1];
            setPage(lastPage.page || 'home');
            setPageParam(lastPage.param || null);
            return newHistory;
        });
    }, []);

    const renderHeader = () => {
        const hideHeaderOn = ['write', 'editPost', 'writeNews', 'editNews', 'editProfile', 'clubCreate', 'clubDetail'];
        if (hideHeaderOn.includes(page)) return null;

        const mainPagesWithLogo = ['home'];
        const isSubPage = !mainPagesWithLogo.includes(page) && pageHistory.length > 1;
        
        const titleMap = {
            'home': '마을엔 부안', 'news': '소식', 'board': '게시판', 'clubList': '모임',
            'calendar': '달력', 'search': '검색', 'notifications': '알림',
            'chatList': '채팅', 'userProfile': '프로필', 'postDetail': '게시글',
            'chatPage': pageParam?.recipientName || '채팅'
        };
        const title = titleMap[page] || "";

        return (
             <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-4 py-3 flex justify-between items-center border-b border-gray-200">
                <div className="flex items-center gap-2 flex-1">
                    {isSubPage ? (<button onClick={goBack} className="p-1 -ml-2"><ArrowLeft size={24} /></button>) : (<Logo size={28} />)}
                    <h1 className="text-xl font-bold text-gray-800 truncate">{title}</h1>
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={() => setCurrentPage('search')} className="p-1"><Search size={24} className="text-gray-600" /></button>
                     <button onClick={() => setCurrentPage('chatList')} className="p-1"><MessageSquare size={24} className="text-gray-600" /></button>
                     <button onClick={() => setCurrentPage('notifications')} className="p-1"><Bell size={24} className="text-gray-600" /></button>
                     {currentUser && (
                         <button onClick={() => setCurrentPage('userProfile', currentUser.uid)}>
                             {currentUser.photoURL ? 
                                <img src={currentUser.photoURL} alt="p" className="w-8 h-8 rounded-full bg-gray-200 object-cover"/> :
                                <UserCircle size={32} className="text-gray-400"/>
                             }
                         </button>
                     )}
                </div>
            </header>
        );
    };

    const renderPage = () => {
        const pageProps = { setCurrentPage, goBack, pageParam };

        switch (page) {
            case 'home': return <HomePage {...pageProps} posts={posts} buanNews={buanNews} handleDeleteNews={handleDeleteNews} handleLikeNews={handleLikeNews} likedNews={likedNews} followingPosts={followingPosts} userEvents={userEvents} />;
            case 'news': return <NewsPage {...pageProps} buanNews={buanNews} handleDeleteNews={handleDeleteNews} handleLikeNews={handleLikeNews} likedNews={likedNews} />;
            case 'board': return <BoardPage {...pageProps} />;
            case 'postDetail': return <PostDetailPage {...pageProps} postId={pageParam} />;
            case 'write': return <WritePage {...pageProps} />;
            case 'editPost': return <WritePage {...pageProps} itemToEdit={pageParam} />;
            case 'writeNews': return <NewsWritePage {...pageProps} />;
            case 'editNews': return <NewsWritePage {...pageProps} itemToEdit={pageParam} />;
            case 'calendar': return <CalendarPage {...pageProps} userEvents={userEvents} />;
            case 'userProfile': return <UserProfilePage {...pageProps} userId={pageParam} />;
            case 'editProfile': return <ProfileEditPage {...pageProps} />;
            case 'search': return <SearchPage {...pageProps} />;
            case 'notifications': return <NotificationsPage />;
            case 'chatList': return <ChatListPage {...pageProps} chats={chats} />;
            case 'chatPage': return <ChatPage {...pageProps} />;
            case 'clubList': return <ClubListPage {...pageProps} />;
            case 'clubCreate': return <ClubCreatePage {...pageProps} />;
            case 'clubDetail': return <ClubDetailPage {...pageProps} />;
            default: return <HomePage {...pageProps} posts={posts} buanNews={buanNews} handleDeleteNews={handleDeleteNews} handleLikeNews={handleLikeNews} likedNews={likedNews} followingPosts={followingPosts} userEvents={userEvents} />;
        }
    };

    if (!currentUser) return <AuthPage />;

    const showNav = !['write', 'editPost', 'writeNews', 'editNews', 'postDetail', 'chatPage', 'editProfile', 'clubCreate', 'clubDetail'].includes(page);
    const mainContentStyle = { paddingBottom: showNav ? '80px' : '0', minHeight: 'calc(100vh - 60px)', height: page === 'chatPage' ? 'calc(100vh - 60px)' : 'auto' };

    return (
        <div className="max-w-sm mx-auto bg-gray-50 shadow-lg min-h-screen font-sans text-gray-800">
            {renderHeader()}
            <main className="bg-white" style={mainContentStyle}>{renderPage()}</main>
            {showNav && <BottomNav currentPage={page} setCurrentPage={setCurrentPage} />}
        </div>
    );
}

export default function App() {
    return (<AuthProvider><AppContent /></AuthProvider>);
}