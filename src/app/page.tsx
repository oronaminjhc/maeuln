'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomePage() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    
    if (!currentUser) {
      router.push('/start');
    } else if (currentUser.isAdmin) {
      router.push('/home');
    } else if (!currentUser.city) {
      router.push('/region-setup');
    } else {
      router.push('/home');
    }
  }, [currentUser, loading, router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return <LoadingSpinner />;
} 