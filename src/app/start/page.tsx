'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { Helmet } from 'react-helmet-async';
import Logo from '@/components/Logo';
import PwaInstallModal from '@/components/PwaInstallModal';

export default function StartPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleKakaoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new OAuthProvider('oidc.kakao.com');
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        setError("카카오 로그인에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
      console.error("Kakao Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>마을N - 우리 동네 SNS</title>
      </Helmet>
      <PwaInstallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <div className="flex flex-col items-center justify-center h-screen bg-green-50 p-4">
        <div className="text-center mb-8 flex flex-col items-center">
          <Logo size={80} />
          <h1 className="text-3xl font-bold text-gray-800 mt-4">마을N</h1>
          <p className="text-gray-600 mt-2 text-center">
            전국 모든 마을의 이야기<br />'마을N'에서 확인하세요!
          </p>
        </div>
        <div className="w-full max-w-xs">
          {error && (
            <p className="text-red-500 text-sm text-center mb-4">{error}</p>
          )}
          <button
            onClick={handleKakaoLogin}
            disabled={loading}
            className="w-full bg-[#FEE500] text-[#3C1E1E] font-bold py-3 px-4 rounded-lg flex items-center justify-center shadow-lg hover:bg-yellow-400 transition-colors disabled:bg-gray-400"
          >
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c.89 0 1.75-.12 2.56-.34l-1.39 4.34c-.08.24.16.45.4.39l4.9-3.06c1.8-1.48 2.53-3.88 2.53-6.33C22 6.48 17.52 2 12 2z"
                fill="#3C1E1E"
              />
            </svg>
            {loading ? "로그인 중..." : "카카오로 3초만에 시작하기"}
          </button>
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsModalOpen(true)}
              className="text-sm text-gray-600 hover:text-gray-900 font-semibold underline"
            >
              마을N 앱 다운받기
            </button>
          </div>
        </div>
      </div>
    </>
  );
} 