'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { collection, query, onSnapshot, where, orderBy } from 'firebase/firestore';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from '@/lib/firebase/config';
import { useAuth } from '@/lib/contexts/AuthContext';
import { PlusCircle } from 'lucide-react';
import Header from '@/components/Header';
import BottomNav from '@/components/BottomNav';
import LoadingSpinner from '@/components/LoadingSpinner';
import NewsCard from '@/components/NewsCard';

interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  imagePath?: string;
  date?: string;
  tags?: string[];
}

export default function NewsPage() {
  const { currentUser, adminSelectedCity } = useAuth();
  const router = useRouter();
  const [newsList, setNewsList] = useState<News[] | null>(null);
  const [likedNews, setLikedNews] = useState<string[]>(currentUser?.likedNews || []);
  const [activeTag, setActiveTag] = useState('전체');
  const tags = ['전체', '교육', '문화', '청년', '농업', '안전', '운동', '행사', '복지'];
  const displayCity = adminSelectedCity || (currentUser?.isAdmin ? '전체' : currentUser?.city);

  useEffect(() => {
    if (currentUser) setLikedNews(currentUser.likedNews || []);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;

    const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);
    if (!currentUser.isAdmin && !targetCity) {
      setNewsList([]);
      return;
    }

    const baseQuery = targetCity ? [where("city", "==", targetCity)] : [];
    const q = query(collection(db, "news"), ...baseQuery, orderBy("createdAt", "desc"));

    const unsub = onSnapshot(q, (s) => setNewsList(s.docs.map(d => ({ id: d.id, ...d.data() })) as News[]), (e) => {
      console.error("Error fetching news:", e);
      setNewsList([]);
    });

    return () => unsub();
  }, [currentUser, adminSelectedCity]);

  const handleLikeNews = async (newsItem: News) => {
    if (!currentUser || !newsItem) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const isLiked = likedNews.includes(newsItem.id);
    try {
      await updateDoc(userRef, {
        likedNews: isLiked ? arrayRemove(newsItem.id) : arrayUnion(newsItem.id)
      });
    } catch (e) {
      console.error("Like Error:", e);
      alert("작업 처리 중 오류 발생");
    }
  };

  const handleDeleteNews = async (newsId: string, imagePath: string) => {
    if (!currentUser?.isAdmin || !window.confirm("정말로 이 소식을 삭제하시겠습니까?")) return;
    try {
      if (imagePath) await deleteObject(ref(storage, imagePath));
      await deleteDoc(doc(db, 'news', newsId));
      alert("소식이 삭제되었습니다.");
    } catch (error: any) {
      alert(`소식 삭제 중 오류: ${error.message}`);
    }
  };

  const openDetailModal = (news: News) => {
    // Implementation for detail modal
    console.log('Open detail modal:', news);
  };

  if (newsList === null) return <LoadingSpinner />;

  const filteredNews = activeTag === '전체' ? newsList : newsList.filter(news => news.tags?.includes(activeTag));
  const pageTitle = displayCity === '전체' ? '전체 소식' : `${displayCity} 소식`;

  return (
    <>
      <Header />
      <main className="flex-grow bg-white">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-4">{pageTitle}</h1>
          {currentUser?.isAdmin && (
            <button
              onClick={() => router.push('/news/write')}
              className="w-full mb-4 bg-[#00462A] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#003a22] shadow-lg flex items-center justify-center gap-2"
            >
              <PlusCircle size={20} />
              {displayCity === '전체' ? '새 소식 작성' : `${displayCity} 소식 작성`}
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
          <div className="space-y-4">
            {filteredNews.length > 0 ? (
              filteredNews.map((news) => (
                <NewsCard
                  key={news.id}
                  news={news}
                  isAdmin={currentUser?.isAdmin}
                  openDetailModal={openDetailModal}
                  handleDeleteNews={handleDeleteNews}
                  handleLikeNews={handleLikeNews}
                  isLiked={likedNews.includes(news.id)}
                />
              ))
            ) : (
              <div className="text-center text-gray-500 py-10 p-8 bg-gray-100 rounded-lg">
                {activeTag === '전체' ? '등록된 소식이 없습니다.' : `선택한 태그에 해당하는 소식이 없습니다.`}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </>
  );
} 