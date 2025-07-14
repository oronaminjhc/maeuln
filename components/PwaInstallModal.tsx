'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PwaInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PwaInstallModal({ isOpen, onClose }: PwaInstallModalProps) {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(/iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase()));
  }, []);

  if (!isOpen) return null;

  const ShareIosIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block w-5 h-5 mx-1 align-middle"
    >
      <path d="M12 22V8" />
      <path d="m7 13 5-5 5 5" />
      <path d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-5" />
    </svg>
  );

  const PlusSquareIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block w-5 h-5 mx-1 align-middle"
    >
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="M8 12h8" />
      <path d="M12 8v8" />
    </svg>
  );

  const MoreVerticalIcon = () => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block w-5 h-5 mx-1 align-middle"
    >
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  );

  const iosInstructions = (
    <div className="text-center">
      <p className="text-lg font-semibold mb-4">iOS에서는</p>
      <p className="mb-4">
        공유 버튼 <ShareIosIcon /> 을 누른 후
      </p>
      <p className="mb-6">
        '홈 화면에 추가' <PlusSquareIcon /> 를 선택해주세요.
      </p>
    </div>
  );

  const androidInstructions = (
    <div className="text-center">
      <p className="text-lg font-semibold mb-4">Android에서는</p>
      <p className="mb-4">
        오른쪽 상단 메뉴 <MoreVerticalIcon /> 를 누른 후
      </p>
      <p className="mb-6">'홈 화면에 추가' 또는 '앱 설치'를 선택해주세요.</p>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        {isIOS ? iosInstructions : androidInstructions}
        <button
          onClick={onClose}
          className="w-full mt-4 text-center text-blue-600 font-semibold py-2"
        >
          닫기
        </button>
      </div>
    </div>
  );
} 