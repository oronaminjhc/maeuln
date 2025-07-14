'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, onSnapshot, where, orderBy, limit, QueryConstraint } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
// import 경로 오류를 수정하였습니다. 실제 파일 경로에 맞게 아래와 같이 수정하세요.
// import 경로 오류를 수정하였습니다. 실제 파일 경로에 맞게 아래와 같이 수정하세요.
import { useAuth } from '../../lib/context/AuthContext';
import { timeSince } from '../../lib/utils/timeSince';
import { getCategoryStyle } from '../../lib/constants/categoryStyles';
import { ChevronRight, Heart, MessageCircle } from 'lucide-react';
import Header from '../../components/common/Header';
import BottomNav from '../../components/BottomNav';
import LoadingSpinner from '../../components/LoadingSpinner';
import Calendar from '@/components/Calendar';
import NewsCard from '@/components/NewsCard';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  city: string;
  authorId: string;
  authorName: string;
  createdAt: any;
  likes?: string[];
  commentCount?: number;
}

interface News {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  imagePath?: string;
  date?: string;
}

export default function HomePage() {
  const { currentUser, adminSelectedCity } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [buanNews, setBuanNews] = useState<News[] | null>(null);
  const [followingPosts, setFollowingPosts] = useState<Post[]>([]);
  const [userEvents, setUserEvents] = useState<Record<string, any[]>>({});
  const [likedNews, setLikedNews] = useState<string[]>(currentUser?.likedNews || []);

  const displayCity = adminSelectedCity || (currentUser?.isAdmin ? '전국' : currentUser?.city);

  const openDetailModal = (news: News) => {
    // Implementation for detail modal
    console.log('Open detail modal:', news);
  };

  useEffect(() => {
    if (currentUser) setLikedNews(currentUser.likedNews || []);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser || (!currentUser.isAdmin && !currentUser.city)) return;

    const targetCity = adminSelectedCity || (currentUser.isAdmin ? null : currentUser.city);
    if (!currentUser.isAdmin && !targetCity) {
      setPosts([]);
      setBuanNews([]);
      return;
    }

    const createSub = (coll: string, q: QueryConstraint[], setData: (data: any[]) => void) =>
      onSnapshot(query(collection(db, coll), ...q), (s) =>
        setData(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
        () => setData([])
      );

    const q: QueryConstraint[] = targetCity ? [where("city", "==", targetCity), orderBy("createdAt", "desc")] : [orderBy("createdAt", "desc")];

    const unsubs = [
      createSub('posts', q, setPosts),
      createSub('news', q, setBuanNews),
      onSnapshot(query(collection(db, `users/${currentUser.uid}/events`)), (s) => {
        const ev: Record<string, any[]> = {};
        s.forEach((d) => {
          const e = { id: d.id, ...d.data() };
          if (!ev[e.date]) ev[e.date] = [];
          ev[e.date].push(e);
        });
        setUserEvents(ev);
      })
    ];

    if (currentUser?.following && Array.isArray(currentUser.following) && currentUser.following.length > 0) {
      unsubs.push(
        onSnapshot(
          query(collection(db, "posts"), 
          where('authorId', 'in', currentUser.following.slice(0, 10)), 
          orderBy("createdAt", "desc")
        ), 
        (s) => setFollowingPosts(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      );
    } else {
      setFollowingPosts([]);
    }

    return () => { unsubs.forEach(un => { if (typeof un === 'function') un(); }); };
  }, [currentUser, adminSelectedCity]);

  const handleLikeNews = async (newsItem: News) => {
    // Implementation for liking news
    console.log('Like news:', newsItem);
  };

  const handleDeleteNews = async (id: string, path: string) => {
    // Implementation for deleting news
    console.log('Delete news:', id, path);
  };

  if (posts === null || buanNews === null) return <LoadingSpinner />;

  const popularPosts = posts ? [...posts].sort((a, b) => (b.likes?.length || 0) - (a.likes?.length || 0)).slice(0, 3) : [];

  return (
    <>
      <Header />
      <main className="flex-grow bg-white">
        <div className="p-4 space-y-8">
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">지금 {displayCity}에서는</h2>
              <Link href="/news" className="text-sm font-medium text-gray-500 hover:text-gray-800">
                더 보기 <ChevronRight className="inline-block" size={14} />
              </Link>
            </div>
            <div className="flex overflow-x-auto gap-4 pb-3" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {buanNews.length > 0 ? (
                buanNews.map((n) => (
                  <div key={n.id} className="w-4/5 md:w-3/5 shrink-0">
                    <NewsCard
                      news={n}
                      isAdmin={currentUser?.isAdmin}
                      openDetailModal={openDetailModal}
                      handleDeleteNews={handleDeleteNews}
                      handleLikeNews={handleLikeNews}
                      isLiked={likedNews.includes(n.id)}
                    />
                  </div>
                ))
              ) : (
                <div className="text-center text-gray-500 w-full p-8 bg-gray-100 rounded-lg">
                  등록된 소식이 없습니다.
                </div>
              )}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">{displayCity} 달력</h2>
              <Link href="/calendar" className="text-sm font-medium text-gray-500 hover:text-gray-800">
                자세히 <ChevronRight className="inline-block" size={14} />
              </Link>
            </div>
            <Calendar events={userEvents} onDateClick={(date) => router.push('/calendar', { state: { date } })} />
          </section>

          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">지금 인기있는 글</h2>
              <Link href="/board" className="text-sm font-medium text-gray-500 hover:text-gray-800">
                더 보기 <ChevronRight className="inline-block" size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {popularPosts.length > 0 ? (
                popularPosts.map(p => {
                  const s = getCategoryStyle(p.category, p.city);
                  return (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/post/${p.id}`)}
                      className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 flex items-center gap-3 cursor-pointer"
                    >
                      <span className={`text-xs font-bold ${s.text} ${s.bg} px-2 py-1 rounded-md`}>
                        {p.category}
                      </span>
                      <p className="truncate flex-1">{p.title}</p>
                      <div className="flex items-center text-xs text-gray-400 gap-2">
                        <Heart size={14} className="text-red-400" />
                        <span>{p.likes?.length || 0}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-4">인기글이 없어요.</p>
              )}
            </div>
          </section>

          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-lg font-bold">팔로잉</h2>
            </div>
            <div className="space-y-3">
              {followingPosts.length > 0 ? (
                followingPosts.map(p => {
                  const s = getCategoryStyle(p.category, p.city);
                  return (
                    <div
                      key={p.id}
                      onClick={() => router.push(`/post/${p.id}`)}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-xs font-bold ${s.text} ${s.bg} px-2 py-1 rounded-md`}>
                          {p.category}
                        </span>
                        <h3 className="font-bold text-md truncate flex-1">{p.title}</h3>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 truncate">{p.content}</p>
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <div>
                          <span
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/profile/${p.authorId}`);
                            }}
                            className="font-semibold cursor-pointer hover:underline"
                          >
                            {p.authorName}
                          </span>
                          <span className="mx-1">·</span>
                          <span>{timeSince(p.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1">
                            <Heart size={14} className={p.likes?.includes(currentUser?.uid || '') ? 'text-red-500 fill-current' : 'text-gray-400'} />
                            <span>{p.likes?.length || 0}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle size={14} className="text-gray-400" />
                            <span>{p.commentCount || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-gray-500 py-4">팔로우하는 사용자의 글이 없습니다.</p>
              )}
            </div>
          </section>
        </div>
      </main>
      <BottomNav />
    </>
  );
} 