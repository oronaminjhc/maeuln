'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/contexts/AuthContext';
import { fetchRegions, fetchCities } from '@/lib/services/region.service';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function RegionSetupPage() {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [regions, setRegions] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiLoading, setApiLoading] = useState(true);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isSaving && currentUser?.city) {
      router.push('/home');
    }
  }, [currentUser, isSaving, router]);

  useEffect(() => {
    fetchRegions().then(data => {
      setRegions(data);
      setApiLoading(false);
    });
  }, []);

  useEffect(() => {
    if (selectedRegion) {
      setApiLoading(true);
      setCities([]);
      setSelectedCity('');
      fetchCities(selectedRegion).then(data => {
        setCities(data);
        if (data.length === 1) setSelectedCity(data[0]);
        setApiLoading(false);
      });
    } else {
      setCities([]);
    }
  }, [selectedRegion]);

  const handleSaveRegion = async () => {
    if (!selectedRegion || !selectedCity) {
      setError('거주 지역을 모두 선택해주세요.');
      return;
    }
    setLoading(true);
    setError('');
    setIsSaving(true);
    try {
      await setDoc(doc(db, "users", currentUser!.uid), {
        displayName: currentUser!.displayName,
        email: currentUser!.email,
        photoURL: currentUser!.photoURL,
        region: selectedRegion,
        city: selectedCity,
        town: '',
        createdAt: Timestamp.now()
      }, { merge: true });
    } catch (e) {
      console.error("Region save error:", e);
      setError("저장에 실패했습니다. 다시 시도해주세요.");
      setLoading(false);
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white p-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">환영합니다!</h1>
        <p className="text-gray-600 mt-2">
          서비스 이용을 위해<br />거주 지역을 설정해주세요.
        </p>
      </div>
      {apiLoading && !regions.length ? (
        <LoadingSpinner />
      ) : (
        <div className="w-full max-w-xs space-y-4">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A]"
          >
            <option value="">시/도 선택</option>
            {regions.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            disabled={!selectedRegion || apiLoading || cities.length <= 1}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00462A] disabled:bg-gray-200"
          >
            <option value="">시/군 선택</option>
            {apiLoading && selectedRegion ? (
              <option>불러오는 중...</option>
            ) : (
              cities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))
            )}
          </select>
          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}
          <button
            onClick={handleSaveRegion}
            disabled={loading || !selectedCity}
            className="w-full mt-4 bg-[#00462A] text-white font-bold py-3 px-4 rounded-lg hover:bg-[#003a22] transition-colors shadow-lg disabled:bg-gray-400"
          >
            {loading ? "저장 중..." : "마을N 시작하기"}
          </button>
        </div>
      )}
    </div>
  );
} 