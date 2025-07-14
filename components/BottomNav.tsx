'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, LayoutGrid, Newspaper, Users, Gift } from 'lucide-react';

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { path: '/home', icon: Home, label: '홈' },
    { path: '/board', icon: LayoutGrid, label: '게시판' },
    { path: '/news', icon: Newspaper, label: '소식' },
    { path: '/clubs', icon: Users, label: '클럽' },
    { path: '/benefits', icon: Gift, label: '혜택' }
  ];

  if (['/start', '/region-setup'].some(p => pathname.startsWith(p))) return null;

  return (
    <footer className="fixed bottom-0 left-0 right-0 max-w-sm mx-auto z-20">
      <div
        className="bg-white px-3 pt-2 pb-3 border-t border-gray-200 shadow-[0_-1px_4px_rgba(0,0,0,0.05)]"
        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }}
      >
        <div className="flex justify-around items-center">
          {navItems.map(item => (
            <Link
              href={item.path}
              key={item.path}
              onClick={(e: React.MouseEvent) => {
                if (item.path === '/benefits') {
                  e.preventDefault();
                  alert('서비스 준비중입니다.');
                }
              }}
              className="text-center p-2 rounded-lg w-1/5"
            >
              <item.icon
                className={`w-6 h-6 mx-auto ${
                  pathname.startsWith(item.path) ? 'text-[#00462A]' : 'text-gray-500'
                }`}
              />
              <span
                className={`text-xs font-medium ${
                  pathname.startsWith(item.path) ? 'text-[#00462A] font-bold' : 'text-gray-500'
                }`}
              >
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
} 