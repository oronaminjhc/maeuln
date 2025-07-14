'use client';

import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ArrowLeft, Search, MessageSquare, Bell, UserCircle } from 'lucide-react';
import Logo from './Logo';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { currentUser, adminSelectedCity } = useAuth();

  if (!currentUser) return null;

  const getPageTitle = () => {
    if (pathname === '/home') {
      return adminSelectedCity
        ? `마을N ${adminSelectedCity.replace(/(특별시|광역시|특별자치시|도|시|군|구)$/, '')}`
        : currentUser.isAdmin
        ? '마을N'
        : `마을N ${currentUser.city?.replace(/(특별시|광역시|특별자치시|도|시|군|구)$/, '') || ''}`;
    }
    if (pathname.startsWith('/profile/')) return '프로필';
    if (pathname.startsWith('/post/')) return '게시글';
    if (pathname.startsWith('/chat/')) return '채팅';
    if (pathname.startsWith('/clubs/')) return '모임';

    const pageTitles: Record<string, string> = {
      '/news': '소식',
      '/board': '게시판',
      '/calendar': '달력',
      '/search': '검색',
      '/notifications': '알림',
      '/chats': '채팅'
    };

    return pageTitles[pathname] || '마을N';
  };

  return (
    <header className="sticky top-0 bg-white/80 backdrop-blur-sm z-30 px-4 py-3 flex justify-between items-center border-b border-gray-200 h-16 w-full max-w-sm mx-auto">
      <div className="flex items-center gap-2 flex-1">
        {pathname !== '/home' ? (
          <button onClick={() => router.back()} className="p-1 -ml-2">
            <ArrowLeft size={24} />
          </button>
        ) : (
          <Logo size={28} />
        )}
        <h1 className="text-xl font-bold text-gray-800 truncate">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/search" className="p-1">
          <Search size={24} className="text-gray-600" />
        </Link>
        <Link href="/chats" className="p-1">
          <MessageSquare size={24} className="text-gray-600" />
        </Link>
        <Link href="/notifications" className="p-1">
          <Bell size={24} className="text-gray-600" />
        </Link>
        {currentUser && (
          <Link href={`/profile/${currentUser.uid}`}>
            {currentUser.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt="profile"
                className="w-8 h-8 rounded-full bg-gray-200 object-cover"
              />
            ) : (
              <UserCircle size={32} className="text-gray-400" />
            )}
          </Link>
        )}
      </div>
    </header>
  );
} 