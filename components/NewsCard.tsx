'use client';

import { Heart, Trash2 } from 'lucide-react';

interface NewsCardProps {
  news: any;
  isAdmin?: boolean;
  openDetailModal: (news: any) => void;
  handleDeleteNews: (id: string, path: string) => void;
  handleLikeNews: (news: any) => void;
  isLiked: boolean;
}

export default function NewsCard({
  news,
  isAdmin,
  openDetailModal,
  handleDeleteNews,
  handleLikeNews,
  isLiked
}: NewsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
      {news.imageUrl && (
        <img src={news.imageUrl} alt={news.title} className="w-full h-32 object-cover" />
      )}
      <div className="p-4">
        <h3 className="font-bold text-lg truncate mb-1">{news.title}</h3>
        <p className="text-gray-600 text-sm h-10 overflow-hidden text-ellipsis mb-3">
          {news.content}
        </p>
        <div className="flex justify-between items-center text-xs text-gray-500">
          <button
            onClick={() => openDetailModal(news)}
            className="font-semibold text-blue-600 hover:underline"
          >
            자세히 보기
          </button>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={() => handleDeleteNews(news.id, news.imagePath)}
                className="text-red-500"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              onClick={() => handleLikeNews(news)}
              className={`flex items-center gap-1 ${isLiked ? 'text-red-500' : 'text-gray-400'}`}
            >
              <Heart size={16} className={isLiked ? 'fill-current' : ''} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 